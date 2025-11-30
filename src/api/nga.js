const APP_ID = '1010';
const SECRET = '392e916a6d1d8b7523e2701470000c30bc2165a1';
const BASE_URL = 'https://ngabbs.com/app_api.php';

function makeSign(uid, token, signParams, t) {
  return md5(`${APP_ID}${uid}${token}${signParams}${t}${SECRET}`);
}

// Tiny MD5 implementation (public domain, trimmed to our needs)
function md5(str) {
  function cmn(q, a, b, x, s, t) {
    a = ((a + q + x + t) | 0) + b;
    return ((a << s) | (a >>> (32 - s))) | 0;
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function toBytes(s) {
    const bytes = [];
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 128) bytes.push(c);
      else if (c < 2048) {
        bytes.push((c >> 6) | 192, (c & 63) | 128);
      } else {
        bytes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
      }
    }
    return bytes;
  }

  const x = [];
  let i;
  const bytes = toBytes(str);
  for (i = 0; i < bytes.length; i++) x[i >> 2] |= bytes[i] << ((i % 4) << 3);
  x[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) << 3);
  x[(((bytes.length + 8) >>> 6) << 4) + 14] = bytes.length * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (i = 0; i < x.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;

    a = ff(a, b, c, d, x[i], 7, -680876936);
    d = ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i + 10], 17, -42063);
    b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = gg(b, c, d, a, x[i], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = hh(a, b, c, d, x[i + 5], 4, -378558);
    d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = hh(d, a, b, c, x[i], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = ii(a, b, c, d, x[i], 6, -198630844);
    d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = (a + oa) | 0;
    b = (b + ob) | 0;
    c = (c + oc) | 0;
    d = (d + od) | 0;
  }

  function rhex(n) {
    const s = '0123456789abcdef';
    let out = '';
    for (let j = 0; j < 4; j++) {
      out += s.charAt((n >> (j * 8 + 4)) & 0x0f) + s.charAt((n >> (j * 8)) & 0x0f);
    }
    return out;
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d);
}

async function post(act, payload) {
  const url = `${BASE_URL}?${act}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://ngabbs.com/',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10.0; NGA Translate Desktop)',
      'X-USER-AGENT': 'Nga_Official/90954(Desktop)' ,
    },
    body: new URLSearchParams(payload),
  });
  if (!res.ok) throw new Error(`NGA API ${res.status}`);
  const data = await res.json();
  return data;
}

export async function fetchForumThreads({ fid, page = 1, act = 'list', orderBy = 'postdatedesc', uid = '', token = '' }) {
  const t = Math.floor(Date.now() / 1000);
  const signParams = String(fid);
  const sign = makeSign(uid, token, signParams, t);

  const payload = {
    page: Number(page),
    __output: 14,
    __inchst: 'utf-8',
    app_id: APP_ID,
    access_uid: uid,
    access_token: token,
    t,
    sign,
  };

  if (act === 'topped') {
    payload.topped = String(fid);
  } else {
    payload.fid = String(fid);
    if (act === 'list') payload.order_by = orderBy;
  }

  return post('__lib=subject&__act=' + act, payload);
}

export async function fetchThreadPosts({ tid, page = 1, uid = '', token = '' }) {
  const t = Math.floor(Date.now() / 1000);
  const sign = makeSign(uid, token, String(tid), t);
  const payload = {
    tid: String(tid),
    page: Number(page),
    __output: 14,
    __inchst: 'utf-8',
    app_id: APP_ID,
    access_uid: uid,
    access_token: token,
    t,
    sign,
  };
  return post('__lib=post&__act=list', payload);
}

export async function searchThreads({ keyword, page = 1, fid = '', uid = '', token = '', table = 7 }) {
  const t = Math.floor(Date.now() / 1000);
  const sign = makeSign(uid, token, keyword, t);
  const payload = {
    key: keyword,
    page: Number(page),
    table: Number(table),
    fid,
    recommend: '',
    __output: 14,
    __inchst: 'utf-8',
    app_id: APP_ID,
    access_uid: uid,
    access_token: token,
    t,
    sign,
  };
  return post('__lib=subject&__act=search', payload);
}

export async function searchForums({ keyword, page = 1, uid = '', token = '' }) {
  const t = Math.floor(Date.now() / 1000);
  const sign = makeSign(uid, token, keyword, t);
  const payload = {
    key: keyword,
    page: Number(page),
    __output: 14,
    __inchst: 'utf-8',
    app_id: APP_ID,
    access_uid: uid,
    access_token: token,
    t,
    sign,
  };
  return post('__lib=forum&__act=search', payload);
}
