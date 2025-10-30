package main

import (
	"bufio"
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// Trie structures
type TrieNode struct {
	Children map[rune]*TrieNode
	IsEnd    bool
	Value    string
}

type Trie struct {
	Root      *TrieNode
	WordCount int
}

func NewTrie() *Trie {
	return &Trie{
		Root: &TrieNode{
			Children: make(map[rune]*TrieNode),
		},
	}
}

func (t *Trie) Insert(word, value string) {
	current := t.Root
	for _, char := range word {
		if _, exists := current.Children[char]; !exists {
			current.Children[char] = &TrieNode{
				Children: make(map[rune]*TrieNode),
			}
		}
		current = current.Children[char]
	}
	current.IsEnd = true
	current.Value = value
	t.WordCount++
}

func (t *Trie) FindLongestPrefix(text string) (string, string) {
	current := t.Root
	longestPrefix := ""
	longestValue := ""
	prefix := strings.Builder{}
	
	for _, char := range text {
		if _, exists := current.Children[char]; !exists {
			break
		}
		current = current.Children[char]
		prefix.WriteRune(char)
		if current.IsEnd {
			longestPrefix = prefix.String()
			longestValue = current.Value
		}
	}
	return longestPrefix, longestValue
}

// ChineseConverter struct
type ChineseConverter struct {
	s2tMap map[rune]rune
	t2sMap map[rune]rune
}

// Translation data structures
type TranslationData struct {
	Names2          *Trie
	Names           *Trie
	VietPhrase      *Trie
	ChinesePhienAm  map[string]string
}

// Request/Response types
type TranslateRequest struct {
    Text string `json:"text"`
    Glossary []GlossaryEntry `json:"glossary,omitempty"`
}

type TranslateResponse struct {
	TranslatedText string `json:"translatedText"`
	Error          string `json:"error,omitempty"`
}

type TranslateItem struct {
    Text  string `json:"text,omitempty"`
    Text2 string `json:"Text,omitempty"`
    Glossary []GlossaryEntry `json:"glossary,omitempty"`
}

type DetectedLanguage struct {
	Language string  `json:"language"`
	Score    float64 `json:"score"`
}

type Translation struct {
	Text string `json:"text"`
	To   string `json:"to"`
}

type TranslateResult struct {
	DetectedLanguage DetectedLanguage `json:"detectedLanguage,omitempty"`
	Translations     []Translation    `json:"translations,omitempty"`
	Error            string           `json:"error,omitempty"`
}

type Translate4Request struct {
    Text       string `json:"text"`
    SourceLang string `json:"source_lang"`
    TargetLang string `json:"target_lang"`
    Glossary   []GlossaryEntry `json:"glossary,omitempty"`
}

type Translate4Response struct {
	Alternatives []string `json:"alternatives"`
	Code         int      `json:"code"`
	Data         string   `json:"data"`
	ID           int64    `json:"id"`
	Method       string   `json:"method"`
	SourceLang   string   `json:"source_lang"`
	TargetLang   string   `json:"target_lang"`
}

var (
	chineseRegex     = regexp.MustCompile(`[\x{3400}-\x{4dbf}\x{4e00}-\x{9fff}\x{f900}-\x{faff}]`)
	quoteRegex       = regexp.MustCompile(`([\["'])\s*(\w)`)
	rightQuoteRegex  = regexp.MustCompile(`\s+(["'\]])`)
	capitalizeRegex  = regexp.MustCompile(`([?!⟨:«])\s+(\w)`)
	punctuationRegex = regexp.MustCompile(`\s+([;:?!.])`)
	dotCapitalizeRegex = regexp.MustCompile(`\.\s+(\w)`)
	newlineCapitalizeRegex = regexp.MustCompile(`(\n)\s*(\w)`)
	converter        *ChineseConverter
	translationData  *TranslationData
)

// Glossary entry struct provided by clients
type GlossaryEntry struct {
    Raw  string `json:"raw"`
    Mean string `json:"mean"`
}

// Build a transient trie from glossary entries with highest priority.
// Raw keys are converted to Simplified to match scanning input.
func buildGlossaryTrie(entries []GlossaryEntry) *Trie {
    if len(entries) == 0 {
        return nil
    }
    t := NewTrie()
    for _, e := range entries {
        if e.Raw == "" { continue }
        key := e.Raw
        if converter != nil { key = converter.toSimplified(key) }
        t.Insert(key, e.Mean)
    }
    return t
}

func main() {
	// Initialize converter
	converter = newChineseConverter()
	
	// Load translation data
	fmt.Println("Loading dictionary files...")
	
	var err error
	translationData, err = loadTranslationData()
	if err != nil {
		log.Fatalf("FATAL: Failed to load translation data: %v", err)
	}

	// Verify that we have loaded essential data
	totalEntries := translationData.Names2.WordCount + 
		translationData.Names.WordCount + 
		translationData.VietPhrase.WordCount + 
		len(translationData.ChinesePhienAm)
	
	if totalEntries == 0 {
		log.Fatal("FATAL: No dictionary data loaded! Please ensure data/ folder contains:")
		log.Fatal("  - Names2.txt")
		log.Fatal("  - Names.txt") 
		log.Fatal("  - VietPhrase.txt")
		log.Fatal("  - ChinesePhienAmWords.txt")
	}
	
	fmt.Printf("Successfully loaded %d dictionary entries:\n", totalEntries)
	fmt.Printf("  - Names2: %d entries\n", translationData.Names2.WordCount)
	fmt.Printf("  - Names: %d entries\n", translationData.Names.WordCount)
	fmt.Printf("  - VietPhrase: %d entries\n", translationData.VietPhrase.WordCount)
	fmt.Printf("  - ChinesePhienAm: %d entries\n", len(translationData.ChinesePhienAm))

	app := fiber.New()
	
	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE",
		AllowHeaders: "*",
	}))
	
	// Routes
	app.Post("/translate", handleTranslate)
	app.Post("/translate2", handleTranslate2)
	app.Get("/translate3", handleTranslate3)
	app.Post("/translate4", handleTranslate4)
	
	fmt.Println("Server starting on port 5005...")
	log.Fatal(app.Listen(":5005"))
}


func loadTranslationData() (*TranslationData, error) {
	data := &TranslationData{
		Names2:         NewTrie(),
		Names:          NewTrie(),
		VietPhrase:     NewTrie(),
		ChinesePhienAm: make(map[string]string),
	}

	dataDir := "data"
	
	// Check if data directory exists
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("data directory '%s' not found", dataDir)
	}
	
	// Load Names2.txt
	if err := loadTrieFromFile(filepath.Join(dataDir, "Names2.txt"), data.Names2, false); err != nil {
		return nil, fmt.Errorf("failed to load Names2.txt: %v", err)
	} else {
		fmt.Printf("Loaded Names2.txt: %d entries\n", data.Names2.WordCount)
	}
	
	// Load Names.txt (with split values)  
	if err := loadTrieFromFile(filepath.Join(dataDir, "Names.txt"), data.Names, true); err != nil {
		return nil, fmt.Errorf("failed to load Names.txt: %v", err)
	} else {
		fmt.Printf("Loaded Names.txt: %d entries\n", data.Names.WordCount)
	}
	
	// Load VietPhrase.txt (with split values)
	if err := loadTrieFromFile(filepath.Join(dataDir, "VietPhrase.txt"), data.VietPhrase, true); err != nil {
		return nil, fmt.Errorf("failed to load VietPhrase.txt: %v", err)
	} else {
		fmt.Printf("Loaded VietPhrase.txt: %d entries\n", data.VietPhrase.WordCount)
	}
	
	// Load ChinesePhienAmWords.txt
	if err := loadDictFromFile(filepath.Join(dataDir, "ChinesePhienAmWords.txt"), data.ChinesePhienAm); err != nil {
		return nil, fmt.Errorf("failed to load ChinesePhienAmWords.txt: %v", err)
	} else {
		fmt.Printf("Loaded ChinesePhienAmWords.txt: %d entries\n", len(data.ChinesePhienAm))
	}

	return data, nil
}

func loadTrieFromFile(filename string, trie *Trie, splitValues bool) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineCount := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		lineCount++
		
		// Skip BOM on first line
		if lineCount == 1 && strings.HasPrefix(line, "\ufeff") {
			line = strings.TrimPrefix(line, "\ufeff")
		}
		
		if line == "" {
			continue
		}
		
		parts := strings.Split(line, "=")
		if len(parts) != 2 {
			continue
		}
		
		key := parts[0]
		value := parts[1]
		
		if splitValues {
			// Split by | or / and take the first value
			value = strings.ReplaceAll(value, "|", "/")
			valueParts := strings.Split(value, "/")
			if len(valueParts) > 0 {
				value = valueParts[0]
			}
		}
		
		trie.Insert(key, value)
	}
	
	return scanner.Err()
}

func loadDictFromFile(filename string, dict map[string]string) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineCount := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		lineCount++
		
		// Skip BOM on first line
		if lineCount == 1 && strings.HasPrefix(line, "\ufeff") {
			line = strings.TrimPrefix(line, "\ufeff")
		}
		
		if line == "" {
			continue
		}
		
		parts := strings.Split(line, "=")
		if len(parts) == 2 {
			dict[parts[0]] = parts[1]
		}
	}
	
	return scanner.Err()
}

func newChineseConverter() *ChineseConverter {
	simplified := "皑蔼碍爱翱袄奥坝罢摆败颁办绊帮绑镑谤剥饱宝报鲍辈贝钡狈备惫绷笔毕毙闭边编贬变辩辫鳖瘪濒滨宾摈饼拨钵铂驳卜补参蚕残惭惨灿苍舱仓沧厕侧册测层诧搀掺蝉馋谗缠铲产阐颤场尝长偿肠厂畅钞车彻尘陈衬撑称惩诚骋痴迟驰耻齿炽冲虫宠畴踌筹绸丑橱厨锄雏础储触处传疮闯创锤纯绰辞词赐聪葱囱从丛凑窜错达带贷担单郸掸胆惮诞弹当挡党荡档捣岛祷导盗灯邓敌涤递缔点垫电淀钓调迭谍叠钉顶锭订东动栋冻斗犊独读赌镀锻断缎兑队对吨顿钝夺鹅额讹恶饿儿尔饵贰发罚阀珐矾钒烦范贩饭访纺飞废费纷坟奋愤粪丰枫锋风疯冯缝讽凤肤辐抚辅赋复负讣妇缚该钙盖干赶秆赣冈刚钢纲岗皋镐搁鸽阁铬个给龚宫巩贡钩沟构购够蛊顾剐关观馆惯贯广规硅归龟闺轨诡柜贵刽辊滚锅国过骇韩汉阂鹤贺横轰鸿红后壶护沪户哗华画划话怀坏欢环还缓换唤痪焕涣黄谎挥辉毁贿秽会烩汇讳诲绘荤浑伙获货祸击机积饥讥鸡绩缉极辑级挤几蓟剂济计记际继纪夹荚颊贾钾价驾歼监坚笺间艰缄茧检碱硷拣捡简俭减荐槛鉴践贱见键舰剑饯渐溅涧浆蒋桨奖讲酱胶浇骄娇搅铰矫侥脚饺缴绞轿较秸阶节茎惊经颈静镜径痉竞净纠厩旧驹举据锯惧剧鹃绢杰洁结诫届紧锦仅谨进晋烬尽劲荆觉决诀绝钧军骏开凯颗壳课垦恳抠库裤夸块侩宽矿旷况亏岿窥馈溃扩阔蜡腊莱来赖蓝栏拦篮阑兰澜谰揽览懒缆烂滥捞劳涝乐镭垒类泪篱离里鲤礼丽厉励砾历沥隶俩联莲连镰怜涟帘敛脸链恋炼练粮凉两辆谅疗辽镣猎临邻鳞凛赁龄铃凌灵岭领馏刘龙聋咙笼垄拢陇楼娄搂篓芦卢颅庐炉掳卤虏鲁赂禄录陆驴吕铝侣屡缕虑滤绿峦挛孪滦乱抡轮伦仑沦纶论萝罗逻锣箩骡骆络妈玛码蚂马骂吗买麦卖迈脉瞒馒蛮满谩猫锚铆贸么霉没镁门闷们锰梦谜弥觅绵缅庙灭悯闽鸣铭谬谋亩钠纳难挠脑恼闹馁腻撵捻酿鸟聂啮镊镍柠狞宁拧泞钮纽脓浓农疟诺欧鸥殴呕沤盘庞国爱赔喷鹏骗飘频贫苹凭评泼颇扑铺朴谱脐齐骑岂启气弃讫牵扦钎铅迁签谦钱钳潜浅谴堑枪呛墙蔷强抢锹桥乔侨翘窍窃钦亲轻氢倾顷请庆琼穷趋区躯驱龋颧权劝却鹊让饶扰绕热韧认纫荣绒软锐闰润洒萨鳃赛伞丧骚扫涩杀纱筛晒闪陕赡缮伤赏烧绍赊摄慑设绅审婶肾渗声绳胜圣师狮湿诗尸时蚀实识驶势释饰视试寿兽枢输书赎属术树竖数帅双谁税顺说硕烁丝饲耸怂颂讼诵擞苏诉肃虽绥岁孙损笋缩琐锁獭挞抬摊贪瘫滩坛谭谈叹汤烫涛绦腾誊锑题体屉条贴铁厅听烃铜统头图涂团颓蜕脱鸵驮驼椭洼袜弯湾顽万网韦违围为潍维苇伟伪纬谓卫温闻纹稳问瓮挝蜗涡窝呜钨乌诬无芜吴坞雾务误锡牺袭习铣戏细虾辖峡侠狭厦锨鲜纤咸贤衔闲显险现献县馅羡宪线厢镶乡详响项萧销晓啸蝎协挟携胁谐写泻谢锌衅兴汹锈绣虚嘘须许绪续轩悬选癣绚学勋询寻驯训讯逊压鸦鸭哑亚讶阉烟盐严颜阎艳厌砚彦谚验鸯杨扬疡阳痒养样瑶摇尧遥窑谣药爷页业叶医铱颐遗仪彝蚁艺亿忆义诣议谊译异绎荫阴银饮樱婴鹰应缨莹萤营荧蝇颖哟拥佣痈踊咏涌优忧邮铀犹游诱舆鱼渔娱与屿语吁御狱誉预驭鸳渊辕园员圆缘远愿约跃钥岳粤悦阅云郧匀陨运蕴酝晕韵杂灾载攒暂赞赃脏凿枣灶责择则泽贼赠扎札轧铡闸诈斋债毡盏斩辗崭栈战绽张涨帐账胀赵蛰辙锗这贞针侦诊镇阵挣睁狰帧郑证织职执纸挚掷帜质钟终种肿众诌轴皱昼骤猪诸诛烛瞩嘱贮铸筑驻专砖转赚桩庄装妆壮状锥赘坠缀谆浊兹资渍踪综总纵邹诅组钻致钟么为只凶准启板里雳余链泄"
	traditional := "皚藹礙愛翺襖奧壩罷擺敗頒辦絆幫綁鎊謗剝飽寶報鮑輩貝鋇狽備憊繃筆畢斃閉邊編貶變辯辮鼈癟瀕濱賓擯餅撥缽鉑駁蔔補參蠶殘慚慘燦蒼艙倉滄廁側冊測層詫攙摻蟬饞讒纏鏟産闡顫場嘗長償腸廠暢鈔車徹塵陳襯撐稱懲誠騁癡遲馳恥齒熾沖蟲寵疇躊籌綢醜櫥廚鋤雛礎儲觸處傳瘡闖創錘純綽辭詞賜聰蔥囪從叢湊竄錯達帶貸擔單鄲撣膽憚誕彈當擋黨蕩檔搗島禱導盜燈鄧敵滌遞締點墊電澱釣調叠諜疊釘頂錠訂東動棟凍鬥犢獨讀賭鍍鍛斷緞兌隊對噸頓鈍奪鵝額訛惡餓兒爾餌貳發罰閥琺礬釩煩範販飯訪紡飛廢費紛墳奮憤糞豐楓鋒風瘋馮縫諷鳳膚輻撫輔賦複負訃婦縛該鈣蓋幹趕稈贛岡剛鋼綱崗臯鎬擱鴿閣鉻個給龔宮鞏貢鈎溝構購夠蠱顧剮關觀館慣貫廣規矽歸龜閨軌詭櫃貴劊輥滾鍋國過駭韓漢閡鶴賀橫轟鴻紅後壺護滬戶嘩華畫劃話懷壞歡環還緩換喚瘓煥渙黃謊揮輝毀賄穢會燴彙諱誨繪葷渾夥獲貨禍擊機積饑譏雞績緝極輯級擠幾薊劑濟計記際繼紀夾莢頰賈鉀價駕殲監堅箋間艱緘繭檢堿鹼揀撿簡儉減薦檻鑒踐賤見鍵艦劍餞漸濺澗漿蔣槳獎講醬膠澆驕嬌攪鉸矯僥腳餃繳絞轎較稭階節莖驚經頸靜鏡徑痙競淨糾廄舊駒舉據鋸懼劇鵑絹傑潔結誡屆緊錦僅謹進晉燼盡勁荊覺決訣絕鈞軍駿開凱顆殼課墾懇摳庫褲誇塊儈寬礦曠況虧巋窺饋潰擴闊蠟臘萊來賴藍欄攔籃闌蘭瀾讕攬覽懶纜爛濫撈勞澇樂鐳壘類淚籬離裏鯉禮麗厲勵礫曆瀝隸倆聯蓮連鐮憐漣簾斂臉鏈戀煉練糧涼兩輛諒療遼鐐獵臨鄰鱗凜賃齡鈴淩靈嶺領餾劉龍聾嚨籠壟攏隴樓婁摟簍蘆盧顱廬爐擄鹵虜魯賂祿錄陸驢呂鋁侶屢縷慮濾綠巒攣孿灤亂掄輪倫侖淪綸論蘿羅邏鑼籮騾駱絡媽瑪碼螞馬罵嗎買麥賣邁脈瞞饅蠻滿謾貓錨鉚貿麽黴沒鎂門悶們錳夢謎彌覓綿緬廟滅憫閩鳴銘謬謀畝鈉納難撓腦惱鬧餒膩攆撚釀鳥聶齧鑷鎳檸獰甯擰濘鈕紐膿濃農瘧諾歐鷗毆嘔漚盤龐國愛賠噴鵬騙飄頻貧蘋憑評潑頗撲鋪樸譜臍齊騎豈啓氣棄訖牽扡釺鉛遷簽謙錢鉗潛淺譴塹槍嗆牆薔強搶鍬橋喬僑翹竅竊欽親輕氫傾頃請慶瓊窮趨區軀驅齲顴權勸卻鵲讓饒擾繞熱韌認紉榮絨軟銳閏潤灑薩鰓賽傘喪騷掃澀殺紗篩曬閃陝贍繕傷賞燒紹賒攝懾設紳審嬸腎滲聲繩勝聖師獅濕詩屍時蝕實識駛勢釋飾視試壽獸樞輸書贖屬術樹豎數帥雙誰稅順說碩爍絲飼聳慫頌訟誦擻蘇訴肅雖綏歲孫損筍縮瑣鎖獺撻擡攤貪癱灘壇譚談歎湯燙濤縧騰謄銻題體屜條貼鐵廳聽烴銅統頭圖塗團頹蛻脫鴕馱駝橢窪襪彎灣頑萬網韋違圍爲濰維葦偉僞緯謂衛溫聞紋穩問甕撾蝸渦窩嗚鎢烏誣無蕪吳塢霧務誤錫犧襲習銑戲細蝦轄峽俠狹廈鍁鮮纖鹹賢銜閑顯險現獻縣餡羨憲線廂鑲鄉詳響項蕭銷曉嘯蠍協挾攜脅諧寫瀉謝鋅釁興洶鏽繡虛噓須許緒續軒懸選癬絢學勳詢尋馴訓訊遜壓鴉鴨啞亞訝閹煙鹽嚴顔閻豔厭硯彥諺驗鴦楊揚瘍陽癢養樣瑤搖堯遙窯謠藥爺頁業葉醫銥頤遺儀彜蟻藝億憶義詣議誼譯異繹蔭陰銀飲櫻嬰鷹應纓瑩螢營熒蠅穎喲擁傭癰踴詠湧優憂郵鈾猶遊誘輿魚漁娛與嶼語籲禦獄譽預馭鴛淵轅園員圓緣遠願約躍鑰嶽粵悅閱雲鄖勻隕運蘊醞暈韻雜災載攢暫贊贓髒鑿棗竈責擇則澤賊贈紮劄軋鍘閘詐齋債氈盞斬輾嶄棧戰綻張漲帳賬脹趙蟄轍鍺這貞針偵診鎮陣掙睜猙幀鄭證織職執紙摯擲幟質鍾終種腫衆謅軸皺晝驟豬諸誅燭矚囑貯鑄築駐專磚轉賺樁莊裝妝壯狀錐贅墜綴諄濁茲資漬蹤綜總縱鄒詛組鑽緻鐘麼為隻兇準啟闆裡靂餘鍊洩"

	converter := &ChineseConverter{
		s2tMap: make(map[rune]rune),
		t2sMap: make(map[rune]rune),
	}

	sRunes := []rune(simplified)
	tRunes := []rune(traditional)

	for i, sChar := range sRunes {
		if i < len(tRunes) {
			converter.s2tMap[sChar] = tRunes[i]
			converter.t2sMap[tRunes[i]] = sChar
		}
	}

	return converter
}

/*
// Special characters map - will add back later
var SPECIAL_CHARS = map[string]string{
	"。": ".", "，": ",", "！": "!", "？": "?",
}
*/

// Special characters replacements array - initialized at package level
var specialCharsReplacements = [][2]string{
	{"＿", "_"}, {"╴", "_"}, {"'", "'"}, {"》", "»"}, {"｝", "}"}, {"﹜", "}"},
	{"】", "]"}, {"］", "]"}, {"﹞", "]"}, {"）", ")"}, {"｠", ")"},
	{"〈", "<"}, {"《", "«"}, {"｛", "{"}, {"﹛", "{"}, {"【", "["},
	{"［", "["}, {"﹝", "["}, {"（", "("}, {"｟", "("},
	{"℃", "℃"}, {"°", "°"}, {"￡", "￡"}, {"＄", "$"}, {"﹩", "$"}, {"￥", "￥"},
	{"·", "·"}, {"•", "·"}, {"‧", "·"}, {"・", "·"}, {"﹖", "?"},
	{"？", "?"}, {"﹗", "!"}, {"！", "!"}, {"～", "~"}, {"﹀", "∨"},
	{"︿", "∧"}, {"︳", "|"}, {"｜", "|"}, {"︱", "|"}, {"≧", "≥"},
	{"≦", "≤"}, {"≒", "≈"}, {"＝", "="}, {"﹦", "="}, {"＞", ">"},
	{"﹥", ">"}, {"＜", "<"}, {"﹤", "<"}, {"﹣", "-"}, {"﹟", "#"},
	{"＾", "^"}, {"‵", "`"}, {"¨", "¨"}, {"‥", "¨"}, {"ˉ", "-"},
	{"。", "."}, {"，", ","}, {"､", ","}, {"、", ","}, {"」", "'"},
	{"：", ":"}, {"；", ";"}, {"┅", "..."}, {"…", "..."}, {"∶", ":"},
}

func replaceSpecialChars(text string) string {
	// Apply all special character replacements
	for _, replacement := range specialCharsReplacements {
		text = strings.ReplaceAll(text, replacement[0], replacement[1])
	}
	
	// Handle quotes separately using byte values to avoid syntax issues
	text = strings.ReplaceAll(text, "\u201C", "\"") // "
	text = strings.ReplaceAll(text, "\u201D", "\"") // "  
	text = strings.ReplaceAll(text, "\u300F", "\"") // 』
	text = strings.ReplaceAll(text, "\u2019", "'")  // '
	text = strings.ReplaceAll(text, "\u300C", "'")  // 「
	text = strings.ReplaceAll(text, "\u300E", "\"") // 『
	
	return text
}

func (c *ChineseConverter) toSimplified(text string) string {
	var result strings.Builder
	for _, char := range text {
		if simplifiedChar, exists := c.t2sMap[char]; exists {
			result.WriteRune(simplifiedChar)
		} else {
			result.WriteRune(char)
		}
	}
	return result.String()
}

func convertToSinoVietnamese(text string, data *TranslationData, glossaryTrie *Trie) string {
    text = replaceSpecialChars(text)
	
	tokens := []string{}
	runes := []rune(text)
	i := 0
	chunkSize := 1000 // Process text in chunks of 1000 characters like Python

	for i < len(runes) {
		// Determine chunk end
		chunkEnd := i + chunkSize
		if chunkEnd > len(runes) {
			chunkEnd = len(runes)
		}
		
		chunk := runes[i:chunkEnd]
		j := 0

		for j < len(chunk) {
			// Check for Latin characters
			if isLatin(chunk[j]) {
				start := j
				for j < len(chunk) && isLatin(chunk[j]) {
					j++
				}
				tokens = append(tokens, string(chunk[start:j]))
				continue
			}
            
            // Check Glossary first (highest priority for this request)
            chunkText := string(chunk[j:])
            if glossaryTrie != nil {
                if prefix, value := glossaryTrie.FindLongestPrefix(chunkText); prefix != "" {
                    tokens = append(tokens, value)
                    j += len([]rune(prefix))
                    continue
                }
            }

            // Check Names2 next (global high priority)
            if prefix, value := data.Names2.FindLongestPrefix(chunkText); prefix != "" {
                tokens = append(tokens, value)
                j += len([]rune(prefix))
                continue
            }

			// Check Names
			if prefix, value := data.Names.FindLongestPrefix(chunkText); prefix != "" {
				tokens = append(tokens, value)
				j += len([]rune(prefix))
				continue
			}

			// Check VietPhrase
			if prefix, value := data.VietPhrase.FindLongestPrefix(chunkText); prefix != "" {
				if value != "" {
					tokens = append(tokens, value)
				}
				j += len([]rune(prefix))
				continue
			}

			// Fallback to ChinesePhienAm for single characters
			char := string(chunk[j])
			if value, exists := data.ChinesePhienAm[char]; exists {
				tokens = append(tokens, value)
			} else {
				tokens = append(tokens, char)
			}
			j++
		}

		i += chunkSize
	}

	return rephrase(tokens)
}

func isLatin(r rune) bool {
	return (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || 
		   r == '<' || r == '>' || r == '/'
}

func rephrase(tokens []string) string {
	if len(tokens) == 0 {
		return ""
	}

	nonWord := map[string]bool{
		"\"": true, "[": true, "{": true, " ": true, ",": true,
		"!": true, "?": true, ";": true, "'": true, ".": true,
	}

	result := []string{}
	upper := false
	lastTokenEmpty := false

	for i, token := range tokens {
		if strings.TrimSpace(token) != "" { // Non-empty token
			if i == 0 || (!upper && !nonWord[token]) {
				if len(result) > 0 && !lastTokenEmpty {
					result = append(result, " ")
				}
				// Only capitalize if not already capitalized
				if len(token) > 0 && token[0] >= 'a' && token[0] <= 'z' {
					token = strings.ToUpper(string(token[0])) + token[1:]
				}
				upper = true
			} else if !nonWord[token] && !lastTokenEmpty {
				result = append(result, " ")
			}
			result = append(result, token)
			lastTokenEmpty = false
		} else { // Empty token
			if !lastTokenEmpty && i > 0 {
				result = append(result, " ")
			}
			result = append(result, token)
			lastTokenEmpty = true
		}
	}

	text := strings.TrimSpace(strings.Join(result, ""))
	
	// Remove spaces after left quotation marks and capitalize first word
	text = regexp.MustCompile(`([\[\"\'])\s*(\w)`).ReplaceAllStringFunc(text, func(match string) string {
		parts := regexp.MustCompile(`([\[\"\'])\s*(\w)`).FindStringSubmatch(match)
		if len(parts) >= 3 {
			return parts[1] + strings.ToUpper(parts[2])
		}
		return match
	})
	
	// Remove spaces before right quotation marks
	text = regexp.MustCompile(`\s+(["'\]])`).ReplaceAllString(text, "$1")
	
	// Capitalize first word after ? and ! marks
	text = regexp.MustCompile(`([?!⟨:«])\s+(\w)`).ReplaceAllStringFunc(text, func(match string) string {
		parts := regexp.MustCompile(`([?!⟨:«])\s+(\w)`).FindStringSubmatch(match)
		if len(parts) >= 3 {
			return parts[1] + " " + strings.ToUpper(parts[2])
		}
		return match
	})
	
	// Remove spaces before colon and semicolon
	text = regexp.MustCompile(`\s+([;:?!.])`).ReplaceAllString(text, "$1")
	
	// Capitalize first word after a single dot, but not after triple dots
	// Since Go doesn't support negative lookahead, we'll use a simpler approach
	text = regexp.MustCompile(`\.\s+(\w)`).ReplaceAllStringFunc(text, func(match string) string {
		// Check if this is not part of triple dots by looking at context
		if !strings.Contains(text, "...") || !strings.Contains(match, "...") {
			parts := regexp.MustCompile(`\.\s+(\w)`).FindStringSubmatch(match)
			if len(parts) >= 2 {
				return ". " + strings.ToUpper(parts[1])
			}
		}
		return match
	})
	
	text = regexp.MustCompile(`(\n)\s*(\w)`).ReplaceAllStringFunc(text, func(match string) string {
		parts := regexp.MustCompile(`(\n)\s*(\w)`).FindStringSubmatch(match)
		if len(parts) >= 3 {
			return parts[1] + strings.ToUpper(parts[2])
		}
		return match
	})

	return text
}

func containsNonWordChar(token string, nonWord map[rune]bool) bool {
	for _, r := range token {
		if nonWord[r] {
			return true
		}
	}
	return false
}

func translateText(text string, glossaryTrie *Trie) (string, string) {
    if chineseRegex.MatchString(text) {
        simplifiedText := converter.toSimplified(text)
        translatedText := convertToSinoVietnamese(simplifiedText, translationData, glossaryTrie)
        return translatedText, "zh"
    }
    return text, "und"
}

func handleTranslate(c *fiber.Ctx) error {
	c.Set("Content-Type", "application/json")

	var req TranslateRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
    }

	if req.Text == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No text provided"})
	}

    gTrie := buildGlossaryTrie(req.Glossary)
    translatedText, _ := translateText(req.Text, gTrie)

	response := TranslateResponse{
		TranslatedText: translatedText,
	}

	return c.JSON(response)
}

func handleTranslate2(c *fiber.Ctx) error {
	c.Set("Content-Type", "application/json")

    var items []TranslateItem
    if err := c.BodyParser(&items); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
    }

	var results []TranslateResult

	for _, item := range items {
		var text string
		if item.Text != "" {
			text = item.Text
		} else if item.Text2 != "" {
			text = item.Text2
		} else {
			results = append(results, TranslateResult{
				Error: "No 'text' or 'Text' field found in request",
			})
			continue
		}

        gTrie := buildGlossaryTrie(item.Glossary)
        translatedText, lang := translateText(text, gTrie)

		results = append(results, TranslateResult{
			DetectedLanguage: DetectedLanguage{
				Language: lang,
				Score:    1.0,
			},
			Translations: []Translation{
				{
					Text: strings.TrimSpace(translatedText),
					To:   "vi",
				},
			},
		})
	}

	return c.JSON(results)
}

func handleTranslate3(c *fiber.Ctx) error {
	c.Set("Content-Type", "application/json")

	text := c.Query("q")
	if text == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No text provided"})
	}

    translatedText, _ := translateText(text, nil)

	messageLines := strings.Split(text, "\n")
	responseLines := strings.Split(translatedText, "\n")

	var result [][]string
	minLen := len(messageLines)
	if len(responseLines) < minLen {
		minLen = len(responseLines)
	}

	for i := 0; i < minLen; i++ {
		if i == minLen-1 {
			result = append(result, []string{
				strings.TrimSpace(responseLines[i]),
				strings.TrimSpace(messageLines[i]),
			})
		} else {
			result = append(result, []string{
				strings.TrimSpace(responseLines[i]) + "\n",
				strings.TrimSpace(messageLines[i]) + "\n",
			})
		}
	}

	nestedResult := [][][]string{result}
	return c.JSON(nestedResult)
}

func handleTranslate4(c *fiber.Ctx) error {
	c.Set("Content-Type", "application/json")

	authToken := c.Get("Authorization")
	if authToken == "" {
		authToken = c.Query("token")
	}

	var req Translate4Request
    if err := c.BodyParser(&req); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
    }

	if req.Text == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "text is required"})
	}
	if req.SourceLang == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "source_lang is required"})
	}
	if req.TargetLang == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "target_lang is required"})
	}

    gTrie := buildGlossaryTrie(req.Glossary)
    translatedText, _ := translateText(req.Text, gTrie)

	rand.Seed(time.Now().UnixNano())
	randomID := time.Now().Unix()*1000 + rand.Int63n(1000)

	response := Translate4Response{
		Alternatives: []string{},
		Code:         200,
		Data:         translatedText,
		ID:           randomID,
		Method:       "Free",
		SourceLang:   strings.ToUpper(req.SourceLang),
		TargetLang:   strings.ToUpper(req.TargetLang),
	}

	return c.JSON(response)
}
