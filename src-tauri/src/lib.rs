use std::{
    collections::{HashMap, HashSet},
    fs::File,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    sync::Arc,
};

use anyhow::{Context, Result};
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct TranslateResponse {
    pub translated_text: String,
    pub detected_language: String,
}

#[derive(Debug, Deserialize)]
pub struct GlossaryEntry {
    pub raw: String,
    pub mean: String,
}

#[derive(Debug, Deserialize)]
pub struct TranslatePayload {
    pub text: String,
    pub glossary: Option<Vec<GlossaryEntry>>,
}

struct TrieNode {
    children: HashMap<char, Box<TrieNode>>,
    is_end: bool,
    value: Option<String>,
}

impl TrieNode {
    fn new() -> Self {
        Self {
            children: HashMap::new(),
            is_end: false,
            value: None,
        }
    }
}

impl Clone for TrieNode {
    fn clone(&self) -> Self {
        let mut children = HashMap::new();
        for (k, v) in &self.children {
            children.insert(*k, Box::new((**v).clone()));
        }
        Self {
            children,
            is_end: self.is_end,
            value: self.value.clone(),
        }
    }
}

#[derive(Clone)]
struct Trie {
    root: Box<TrieNode>,
    word_count: usize,
}

impl Trie {
    fn new() -> Self {
        Self {
            root: Box::new(TrieNode::new()),
            word_count: 0,
        }
    }

    fn insert(&mut self, word: &str, value: &str) {
        let mut node = &mut self.root;
        for ch in word.chars() {
            node = node
                .children
                .entry(ch)
                .or_insert_with(|| Box::new(TrieNode::new()));
        }
        node.is_end = true;
        node.value = Some(value.to_string());
        self.word_count += 1;
    }

    fn find_longest_prefix(&self, text: &str) -> Option<(usize, String)> {
        let mut node = &self.root;
        let mut longest: Option<(usize, String)> = None;
        let mut consumed = 0usize;

        for ch in text.chars() {
            if let Some(next) = node.children.get(&ch) {
                consumed += 1;
                node = next;
                if node.is_end {
                    if let Some(val) = &node.value {
                        longest = Some((consumed, val.clone()));
                    }
                }
            } else {
                break;
            }
        }

        longest
    }
}

#[derive(Clone)]
struct TranslationData {
    names2: Trie,
    names: Trie,
    vietphrase: Trie,
    chinese_phien_am: HashMap<String, String>,
}

#[derive(Clone)]
struct ChineseConverter {
    t2s: HashMap<char, char>,
}

impl ChineseConverter {
    fn to_simplified(&self, input: &str) -> String {
        input
            .chars()
            .map(|ch| self.t2s.get(&ch).copied().unwrap_or(ch))
            .collect()
    }
}

#[derive(Clone)]
pub struct Translator {
    data: TranslationData,
    converter: ChineseConverter,
}

impl Translator {
    pub fn load(data_dir: &Path) -> Result<Self> {
        let mut data = TranslationData {
            names2: Trie::new(),
            names: Trie::new(),
            vietphrase: Trie::new(),
            chinese_phien_am: HashMap::new(),
        };

        let names2 = data_dir.join("Names2.txt");
        let names = data_dir.join("Names.txt");
        let vietphrase = data_dir.join("VietPhrase.txt");
        let phien_am = data_dir.join("ChinesePhienAmWords.txt");

        load_trie(&names2, &mut data.names2, false)
            .with_context(|| format!("failed to load {}", names2.display()))?;
        load_trie(&names, &mut data.names, true)
            .with_context(|| format!("failed to load {}", names.display()))?;
        load_trie(&vietphrase, &mut data.vietphrase, true)
            .with_context(|| format!("failed to load {}", vietphrase.display()))?;
        load_dict(&phien_am, &mut data.chinese_phien_am)
            .with_context(|| format!("failed to load {}", phien_am.display()))?;

        let converter = build_converter();

        Ok(Self { data, converter })
    }

    pub(crate) fn translate(&self, text: &str, glossary: Option<&Trie>) -> TranslateResponse {
        if CHINESE_RE.is_match(text) {
            let simplified = self.converter.to_simplified(text);
            let translated = self.convert_to_sino_vietnamese(&simplified, glossary);
            return TranslateResponse {
                translated_text: translated,
                detected_language: "zh".into(),
            };
        }

        TranslateResponse {
            translated_text: text.to_string(),
            detected_language: "und".into(),
        }
    }

    fn convert_to_sino_vietnamese(&self, text: &str, glossary: Option<&Trie>) -> String {
        let mut tokens = Vec::new();
        let chars: Vec<char> = replace_special_chars(text).chars().collect();
        let mut idx = 0usize;

        while idx < chars.len() {
            if is_latin(chars[idx]) {
                let start = idx;
                while idx < chars.len() && is_latin(chars[idx]) {
                    idx += 1;
                }
                tokens.push(chars[start..idx].iter().collect::<String>());
                continue;
            }

            let remaining: String = chars[idx..].iter().collect();

            if let Some(trie) = glossary {
                if let Some((advance, val)) = trie.find_longest_prefix(&remaining) {
                    tokens.push(val);
                    idx += advance;
                    continue;
                }
            }

            if let Some((advance, val)) = self.data.names2.find_longest_prefix(&remaining) {
                tokens.push(val);
                idx += advance;
                continue;
            }

            if let Some((advance, val)) = self.data.names.find_longest_prefix(&remaining) {
                tokens.push(val);
                idx += advance;
                continue;
            }

            if let Some((advance, val)) = self.data.vietphrase.find_longest_prefix(&remaining) {
                tokens.push(val);
                idx += advance;
                continue;
            }

            let ch = chars[idx].to_string();
            if let Some(val) = self.data.chinese_phien_am.get(&ch) {
                tokens.push(val.clone());
            } else {
                tokens.push(ch);
            }
            idx += 1;
        }

        rephrase(tokens)
    }
}

pub fn translate_payload(translator: &Translator, payload: TranslatePayload) -> Result<TranslateResponse, String> {
    if payload.text.trim().is_empty() {
        return Err("text is required".into());
    }

    let glossary_trie = build_glossary(payload.glossary.as_deref(), &translator.converter);
    Ok(translator.translate(&payload.text, glossary_trie.as_ref()))
}

pub(crate) fn build_glossary(entries: Option<&[GlossaryEntry]>, converter: &ChineseConverter) -> Option<Trie> {
    let entries = entries?;
    if entries.is_empty() {
        return None;
    }

    let mut trie = Trie::new();
    for entry in entries {
        if entry.raw.trim().is_empty() {
            continue;
        }
        let key = converter.to_simplified(entry.raw.trim());
        trie.insert(&key, entry.mean.trim());
    }
    Some(trie)
}

fn load_trie(path: &Path, trie: &mut Trie, split_values: bool) -> Result<()> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut line_no = 0usize;

    for line in reader.lines() {
        line_no += 1;
        let mut line = line?;
        if line_no == 1 && line.starts_with('\u{feff}') {
            line = line.trim_start_matches('\u{feff}').to_string();
        }
        if line.trim().is_empty() {
            continue;
        }

        let mut parts = line.splitn(2, '=');
        let Some(key) = parts.next() else { continue };
        let Some(raw_value) = parts.next() else { continue };
        let mut value = raw_value.to_string();

        if split_values {
            let replaced = value.replace('|', "/");
            if let Some(first) = replaced.split('/').next() {
                value = first.to_string();
            }
        }

        trie.insert(key, &value);
    }

    Ok(())
}

fn load_dict(path: &Path, dict: &mut HashMap<String, String>) -> Result<()> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut line_no = 0usize;

    for line in reader.lines() {
        line_no += 1;
        let mut line = line?;
        if line_no == 1 && line.starts_with('\u{feff}') {
            line = line.trim_start_matches('\u{feff}').to_string();
        }
        if line.trim().is_empty() {
            continue;
        }
        let mut parts = line.splitn(2, '=');
        let Some(key) = parts.next() else { continue };
        let Some(value) = parts.next() else { continue };
        dict.insert(key.to_string(), value.to_string());
    }

    Ok(())
}

fn replace_special_chars(text: &str) -> String {
    static REPLACEMENTS: &[(&str, &str)] = &[
        ("＿", "_"),
        ("╴", "_"),
        ("'", "'"),
        ("》", "»"),
        ("｝", "}"),
        ("﹜", "}"),
        ("】", "]"),
        ("］", "]"),
        ("﹞", "]"),
        ("）", ")"),
        ("｠", ")"),
        ("〈", "<"),
        ("《", "«"),
        ("｛", "{"),
        ("﹛", "{"),
        ("【", "["),
        ("［", "["),
        ("﹝", "["),
        ("（", "("),
        ("｟", "("),
        ("℃", "℃"),
        ("°", "°"),
        ("￡", "￡"),
        ("＄", "$"),
        ("﹩", "$"),
        ("￥", "￥"),
        ("·", "·"),
        ("•", "·"),
        ("‧", "·"),
        ("・", "·"),
        ("﹖", "?"),
        ("？", "?"),
        ("﹗", "!"),
        ("！", "!"),
        ("～", "~"),
        ("﹀", "∨"),
        ("︿", "∧"),
        ("︳", "|"),
        ("｜", "|"),
        ("︱", "|"),
        ("≧", "≥"),
        ("≦", "≤"),
        ("≒", "≈"),
        ("＝", "="),
        ("﹦", "="),
        ("＞", ">"),
        ("﹥", ">"),
        ("＜", "<"),
        ("﹤", "<"),
        ("﹣", "-"),
        ("﹟", "#"),
        ("＾", "^"),
        ("‵", "`"),
        ("¨", "¨"),
        ("‥", "¨"),
        ("ˉ", "-"),
        ("。", "."),
        ("，", ","),
        ("､", ","),
        ("、", ","),
        ("」", "'"),
        ("：", ":"),
        ("；", ";"),
        ("┅", "..."),
        ("…", "..."),
        ("∶", ":"),
    ];

    let mut result = text.to_string();
    for (from, to) in REPLACEMENTS {
        result = result.replace(from, to);
    }

    result
        .replace('\u{201c}', "\"")
        .replace('\u{201d}', "\"")
        .replace('\u{300f}', "\"")
        .replace('\u{2019}', "'")
        .replace('\u{300c}', "'")
        .replace('\u{300e}', "\"")
}

fn rephrase(tokens: Vec<String>) -> String {
    if tokens.is_empty() {
        return String::new();
    }

    let non_word: HashSet<&str> = HashSet::from(["\"", "[", "{", " ", ",", "!", "?", ";", "'", "."]);
    let mut result: Vec<String> = Vec::new();
    let mut upper = false;
    let mut last_empty = false;

    for (idx, token) in tokens.iter().enumerate() {
        if token.trim().is_empty() {
            if !last_empty && idx > 0 {
                result.push(" ".into());
            }
            result.push(token.clone());
            last_empty = true;
            continue;
        }

        let is_non_word = non_word.contains(token.as_str());

        if idx == 0 || (!upper && !is_non_word) {
            if !result.is_empty() && !last_empty {
                result.push(" ".into());
            }
            let mut t = token.clone();
            if let Some(first) = t.chars().next() {
                if first.is_ascii_lowercase() {
                    let upper_first = first.to_ascii_uppercase();
                    t.replace_range(0..first.len_utf8(), &upper_first.to_string());
                }
            }
            result.push(t);
            upper = true;
        } else {
            if !is_non_word && !last_empty {
                result.push(" ".into());
            }
            result.push(token.clone());
        }
        last_empty = false;
    }

    let mut text = result.concat();
    text = QUOTE_LEFT_RE
        .replace_all(&text, |caps: &regex::Captures| format!("{}{}", &caps[1], caps[2].to_ascii_uppercase()))
        .to_string();

    text = QUOTE_RIGHT_RE.replace_all(&text, "$1").to_string();

    text = CAPITALIZE_AFTER_MARK_RE
        .replace_all(&text, |caps: &regex::Captures| format!("{} {}", &caps[1], caps[2].to_ascii_uppercase()))
        .to_string();

    text = PUNCTUATION_RE.replace_all(&text, "$1").to_string();

    text = DOT_CAPITALIZE_RE
        .replace_all(&text, |caps: &regex::Captures| format!(". {}", caps[1].to_ascii_uppercase()))
        .to_string();

    text = NEWLINE_CAPITALIZE_RE
        .replace_all(&text, |caps: &regex::Captures| format!("{}\n{}", &caps[1], caps[2].to_ascii_uppercase()))
        .to_string();

    text.trim().to_string()
}

fn is_latin(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || matches!(ch, '<' | '>' | '/')
}

static CHINESE_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"[\u{3400}-\u{4dbf}\u{4e00}-\u{9fff}\u{f900}-\u{faff}]").expect("valid regex")
});

static QUOTE_LEFT_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"([\["'])\s*(\w)"#).unwrap());
static QUOTE_RIGHT_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"\s+(["'\]])"#).unwrap());
static CAPITALIZE_AFTER_MARK_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"([?!⟨:«])\s+(\w)"#).unwrap());
static PUNCTUATION_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"\s+([;:?!.])"#).unwrap());
static DOT_CAPITALIZE_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"\.\s+(\w)"#).unwrap());
static NEWLINE_CAPITALIZE_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"(\n)\s*(\w)"#).unwrap());

fn build_converter() -> ChineseConverter {
    const SIMPLIFIED: &str = "皑蔼碍爱翱袄奥坝罢摆败颁办绊帮绑镑谤剥饱宝报鲍辈贝钡狈备惫绷笔毕毙闭边编贬变辩辫鳖瘪濒滨宾摈饼拨钵铂驳卜补参蚕残惭惨灿苍舱仓沧厕侧册测层诧搀掺蝉馋谗缠铲产阐颤场尝长偿肠厂畅钞车彻尘陈衬撑称惩诚骋痴迟驰耻齿炽冲虫宠畴踌筹绸丑橱厨锄雏础储触处传疮闯创锤纯绰辞词赐聪葱囱从丛凑窜错达带贷担单郸掸胆惮诞弹当挡党荡档捣岛祷导盗灯邓敌涤递缔点垫电淀钓调迭谍叠钉顶锭订东动栋冻斗犊独读赌镀锻断缎兑队对吨顿钝夺鹅额讹恶饿儿尔饵贰发罚阀珐矾钒烦范贩饭访纺飞废费纷坟奋愤粪丰枫锋风疯冯缝讽凤肤辐抚辅赋复负讣妇缚该钙盖干赶秆赣冈刚钢纲岗皋镐搁鸽阁铬个给龚宫巩贡钩沟构购够蛊顾剐关观馆惯贯广规硅归龟闺轨诡柜贵刽辊滚锅国过骇韩汉阂鹤贺横轰鸿红后壶护沪户哗华画划话怀坏欢环还缓换唤痪焕涣黄谎挥辉毁贿秽会烩汇讳诲绘荤浑伙获货祸击机积饥讥鸡绩缉极辑级挤几蓟剂济计记际继纪夹荚颊贾钾价驾歼监坚笺间艰缄茧检碱硷拣捡简俭减荐槛鉴践贱见键舰剑饯渐溅涧浆蒋桨奖讲酱胶浇骄娇搅铰矫侥脚饺缴绞轿较秸阶节茎惊经颈静镜径痉竞净纠厩旧驹举据锯惧剧鹃绢杰洁结诫届紧锦仅谨进晋烬尽劲荆觉决诀绝钧军骏开凯颗壳课垦恳抠库裤夸块侩宽矿旷况亏岿窥馈溃扩阔蜡腊莱来赖蓝栏拦篮阑兰澜谰揽览懒缆烂滥捞劳涝乐镭垒类泪篱离里鲤礼丽厉励砾历沥隶俩联莲连镰怜涟帘敛脸链恋炼练粮凉两辆谅疗辽镣猎临邻鳞凛赁龄铃凌灵岭领馏刘龙聋咙笼垄拢陇楼娄搂篓芦卢颅庐炉掳卤虏鲁赂禄录陆驴吕铝侣屡缕虑滤绿峦挛孪滦乱抡轮伦仑沦纶论萝罗逻锣箩骡骆络妈玛码蚂马骂吗买麦卖迈脉瞒馒蛮满谩猫锚铆贸么霉没镁门闷们锰梦谜弥觅绵缅庙灭悯闽鸣铭谬谋亩钠纳难挠脑恼闹馁腻撵捻酿鸟聂啮镊镍柠狞宁拧泞钮纽脓浓农疟诺欧鸥殴呕沤盘庞国爱赔喷鹏骗飘频贫苹凭评泼颇扑铺朴谱脐齐骑岂启气弃讫牵扦钎铅迁签谦钱钳潜浅谴堑枪呛墙蔷强抢锹桥乔侨翘窍窃钦亲轻氢倾顷请庆琼穷趋区躯驱龋颧权劝却鹊让饶扰绕热韧认纫荣绒软锐闰润洒萨鳃赛伞丧骚扫涩杀纱筛晒闪陕赡缮伤赏烧绍赊摄慑设绅审婶肾渗声绳胜圣师狮湿诗尸时蚀实识驶势释饰视试寿兽枢输书赎属术树竖数帅双谁税顺说硕烁丝饲耸怂颂讼诵擞苏诉肃虽绥岁孙损笋缩琐锁獭挞抬摊贪瘫滩坛谭谈叹汤烫涛绦腾誊锑题体屉条贴铁厅听烃铜统头图涂团颓蜕脱鸵驮驼椭洼袜弯湾顽万网韦违围为潍维苇伟伪纬谓卫温闻纹稳问瓮挝蜗涡窝呜钨乌诬无芜吴坞雾务误锡牺袭习铣戏细虾辖峡侠狭厦锨鲜纤咸贤衔闲显险现献县馅羡宪线厢镶乡详响项萧销晓啸蝎协挟携胁谐写泻谢锌衅兴汹锈绣虚嘘须许绪续轩悬选癣绚学勋询寻驯训讯逊压鸦鸭哑亚讶阉烟盐严颜阎艳厌砚彦谚验鸯杨扬疡阳痒养样瑶摇尧遥窑谣药爷页业叶医铱颐遗仪彝蚁艺亿忆义诣议谊译异绎荫阴银饮樱婴鹰应缨莹萤营荧蝇颖哟拥佣痈踊咏涌优忧邮铀犹游诱舆鱼渔娱与屿语吁御狱誉预驭鸳渊辕园员圆缘远愿约跃钥岳粤悦阅云郧匀陨运蕴酝晕韵杂灾载攒暂赞赃脏凿枣灶责择则泽贼赠扎札轧铡闸诈斋债毡盏斩辗崭栈战绽张涨帐账胀赵蛰辙锗这贞针侦诊镇阵挣睁狰帧郑证织职执纸挚掷帜质钟终种肿众诌轴皱昼骤猪诸诛烛瞩嘱贮铸筑驻专砖转赚桩庄装妆壮状锥赘坠缀谆浊兹资渍踪综总纵邹诅组钻致钟么为只凶准启板里雳余链泄";

    const TRADITIONAL: &str = "皚藹礙愛翺襖奧壩罷擺敗頒辦絆幫綁鎊謗剝飽寶報鮑輩貝鋇狽備憊繃筆畢斃閉邊編貶變辯辮鼈癟瀕濱賓擯餅撥缽鉑駁蔔補參蠶殘慚慘燦蒼艙倉滄廁側冊測層詫攙摻蟬饞讒纏鏟産闡顫場嘗長償腸廠暢鈔車徹塵陳襯撐稱懲誠騁癡遲馳恥齒熾沖蟲寵疇躊籌綢醜櫥廚鋤雛礎儲觸處傳瘡闖創錘純綽辭詞賜聰蔥囪從叢湊竄錯達帶貸擔單鄲撣膽憚誕彈當擋黨蕩檔搗島禱導盜燈鄧敵滌遞締點墊電澱釣調叠諜疊釘頂錠訂東動棟凍鬥犢獨讀賭鍍鍛斷緞兌隊對噸頓鈍奪鵝額訛惡餓兒爾餌貳發罰閥琺礬釩煩範販飯訪紡飛廢費紛墳奮憤糞豐楓鋒風瘋馮縫諷鳳膚輻撫輔賦複負訃婦縛該鈣蓋幹趕稈贛岡剛鋼綱崗臯鎬擱鴿閣鉻個給龔宮鞏貢鈎溝構購夠蠱顧剮關觀館慣貫廣規矽歸龜閨軌詭櫃貴劊輥滾鍋國過駭韓漢閡鶴賀橫轟鴻紅後壺護滬戶嘩華畫劃話懷壞歡環還緩換喚瘓煥渙黃謊揮輝毀賄穢會燴彙諱誨繪葷渾夥獲貨禍擊機積饑譏雞績緝極輯級擠幾薊劑濟計記際繼紀夾莢頰賈鉀價駕殲監堅箋間艱緘繭檢堿鹼揀撿簡儉減薦檻鑒踐賤見鍵艦劍餞漸濺澗漿蔣槳獎講醬膠澆驕嬌攪鉸矯僥腳餃繳絞轎較稭階節莖驚經頸靜鏡徑痙競淨糾廄舊駒舉據鋸懼劇鵑絹傑潔結誡屆緊錦僅謹進晉燼盡勁荊覺決訣絕鈞軍駿開凱顆殼課墾懇摳庫褲誇塊儈寬礦曠況虧巋窺饋潰擴闊蠟臘萊來賴藍欄攔籃闌蘭瀾讕攬覽懶纜爛濫撈勞澇樂鐳壘類淚籬離裏鯉禮麗厲勵礫曆瀝隸倆聯蓮連鐮憐漣簾斂臉鏈戀煉練糧涼兩輛諒療遼鐐獵臨鄰鱗凜賃齡鈴淩靈嶺領餾劉龍聾嚨籠壟攏隴樓婁摟簍蘆盧顱廬爐擄鹵虜魯賂祿錄陸驢呂鋁侶屢縷慮濾綠巒攣孿灤亂掄輪倫侖淪綸論蘿羅邏鑼籮騾駱絡媽瑪碼螞馬罵嗎買麥賣邁脈瞞饅蠻滿謾貓錨鉚貿麽黴沒鎂門悶們錳夢謎彌覓綿緬廟滅憫閩鳴銘謬謀畝鈉納難撓腦惱鬧餒膩攆撚釀鳥聶齧鑷鎳檸獰甯擰濘鈕紐膿濃農瘧諾歐鷗毆嘔漚盤龐國愛賠噴鵬騙飄頻貧蘋憑評潑頗撲鋪樸譜臍齊騎豈啓氣棄訖牽扡釺鉛遷簽謙錢鉗潛淺譴塹槍嗆牆薔強搶鍬橋喬僑翹竅竊欽親輕氫傾頃請慶瓊窮趨區軀驅齲顴權勸卻鵲讓饒擾繞熱韌認紉榮絨軟銳閏潤灑薩鰓賽傘喪騷掃澀殺紗篩曬閃陝贍繕傷賞燒紹賒攝懾設紳審嬸腎滲聲繩勝聖師獅濕詩屍時蝕實識駛勢釋飾視試壽獸樞輸書贖屬術樹豎數帥雙誰稅順說碩爍絲飼聳慫頌訟誦擻蘇訴肅雖綏歲孫損筍縮瑣鎖獺撻擡攤貪癱灘壇譚談歎湯燙濤縧騰謄銻題體屜條貼鐵廳聽烴銅統頭圖塗團頹蛻脫鴕馱駝橢窪襪彎灣頑萬網韋違圍爲濰維葦偉僞緯謂衛溫聞紋穩問甕撾蝸渦窩嗚鎢烏誣無蕪吳塢霧務誤錫犧襲習銑戲細蝦轄峽俠狹廈鍁鮮纖鹹賢銜閑顯險現獻縣餡羨憲線廂鑲鄉詳響項蕭銷曉嘯蠍協挾攜脅諧寫瀉謝鋅釁興洶鏽繡虛噓須許緒續軒懸選癬絢學勳詢尋馴訓訊遜壓鴉鴨啞亞訝閹煙鹽嚴顔閻豔厭硯彥諺驗鴦楊揚瘍陽癢養樣瑤搖堯遙窯謠藥爺頁業葉醫銥頤遺儀彜蟻藝億憶義詣議誼譯異繹蔭陰銀飲櫻嬰鷹應纓瑩螢營熒蠅穎喲擁傭癰踴詠湧優憂郵鈾猶遊誘輿魚漁娛與嶼語籲禦獄譽預馭鴛淵轅園員圓緣遠願約躍鑰嶽粵悅閱雲鄖勻隕運蘊醞暈韻雜災載攢暫贊贓髒鑿棗竈責擇則澤賊贈紮劄軋鍘閘詐齋債氈盞斬輾嶄棧戰綻張漲帳賬脹趙蟄轍鍺這貞針偵診鎮陣掙睜猙幀鄭證織職執紙摯擲幟質鍾終種腫衆謅軸皺晝驟豬諸誅燭矚囑貯鑄築駐專磚轉賺樁莊裝妝壯狀錐贅墜綴諄濁茲資漬蹤綜總縱鄒詛組鑽緻鐘麼為隻兇準啟闆裡靂餘鍊洩";

    let mut map = HashMap::new();
    for (s, t) in SIMPLIFIED.chars().zip(TRADITIONAL.chars()) {
        map.insert(t, s);
    }

    ChineseConverter { t2s: map }
}

#[derive(Clone)]
pub struct TranslatorState(pub Arc<Translator>);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn translate_sample_matches_go_output() {
        let data_dir = PathBuf::from("data");
        let translator = Translator::load(&data_dir).expect("load dictionaries");
        let res = translator.translate("请不要把互联网上的戾气带来这里！", None);
        assert_eq!(res.detected_language, "zh");
        assert_eq!(res.translated_text, "Xin đừng đem internet lên lệ khí mang đến nơi này!");
    }
}
