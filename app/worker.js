/**
 * NGA API Cloudflare Worker
 * Converted from PHP NgaApi class
 */

/**
 * MD5 hash implementation
 * (Cloudflare Workers doesn't support MD5 in crypto.subtle)
 */
function md5(string) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX, lY) {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function f(x, y, z) {
    return (x & y) | (~x & z);
  }
  function g(x, y, z) {
    return (x & z) | (y & ~z);
  }
  function h(x, y, z) {
    return x ^ y ^ z;
  }
  function i(x, y, z) {
    return y ^ (x | ~z);
  }

  function ff(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function gg(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function hh(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ii(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(string) {
    let lWordCount;
    const lMessageLength = string.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue) {
    let wordToHexValue = '',
      wordToHexValue_temp = '',
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = '0' + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  }

  function utf8Encode(string) {
    string = string.replace(/\r\n/g, '\n');
    let utftext = '';
    for (let n = 0; n < string.length; n++) {
      const c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }

  let x = [];
  let k, AA, BB, CC, DD, a, b, c, d;
  const S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  const S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  const S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  const S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  string = utf8Encode(string);
  x = convertToWordArray(string);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;

  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

class NgaApi {
  static APP_ID = "1010";
  static SECRET = "392e916a6d1d8b7523e2701470000c30bc2165a1";
  static BASE_URL = "https://ngabbs.com/app_api.php";

  constructor(uid = "", token = "") {
    this.uid = uid;
    this.token = token;
  }

  /**
   * Make signature for API request
   */
  makeSign(signParams, t) {
    const raw = NgaApi.APP_ID + this.uid + this.token + signParams + t + NgaApi.SECRET;
    return md5(raw);
  }

  /**
   * Fetch subject list from forum
   */
  async fetchSubjectList(fid, page = 1, act = 'list', orderBy = 'postdatedesc') {
    const t = Math.floor(Date.now() / 1000);
    const signParams = String(fid);
    const sign = this.makeSign(signParams, t);

    // Base payload common to all acts
    const payload = {
      page: parseInt(page),
      __output: 14,
      __inchst: 'utf-8',
      app_id: NgaApi.APP_ID,
      access_uid: this.uid,
      access_token: this.token,
      t: t,
      sign: sign,
    };

    // Different acts use different parameter names for fid
    if (act === 'topped') {
      // Topped uses 'topped' parameter instead of 'fid'
      payload.topped = String(fid);
    } else {
      // List and hot use 'fid' parameter
      payload.fid = String(fid);
      if (act === 'list') {
        payload.order_by = orderBy;
      }
    }

    const url = `${NgaApi.BASE_URL}?__lib=subject&__act=${act}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://ngabbs.com/',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10.0; POCOPHONE F1 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.97 Mobile Safari/537.36',
          'X-USER-AGENT': 'Nga_Official/90954(Xiaomi POCOPHONE F1;Android 10.0)',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Search threads
   */
  async searchThreads(keyword, page = 1, fid = '', table = 7) {
    const t = Math.floor(Date.now() / 1000);
    const signParams = keyword;
    const sign = this.makeSign(signParams, t);

    const payload = {
      key: keyword,
      page: parseInt(page),
      table: parseInt(table), // 7 = thread search
      fid: fid,
      recommend: '',
      __output: 14,
      __inchst: 'utf-8',
      app_id: NgaApi.APP_ID,
      access_uid: this.uid,
      access_token: this.token,
      t: t,
      sign: sign,
    };

    const url = `${NgaApi.BASE_URL}?__lib=subject&__act=search`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://ngabbs.com/',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10.0; POCOPHONE F1 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.97 Mobile Safari/537.36',
          'X-USER-AGENT': 'Nga_Official/90954(Xiaomi POCOPHONE F1;Android 10.0)',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Search forums
   */
  async searchForums(keyword, page = 1) {
    const t = Math.floor(Date.now() / 1000);
    const signParams = keyword;
    const sign = this.makeSign(signParams, t);

    const payload = {
      key: keyword,
      page: parseInt(page),
      __output: 14,
      __inchst: 'utf-8',
      app_id: NgaApi.APP_ID,
      access_uid: this.uid,
      access_token: this.token,
      t: t,
      sign: sign,
    };

    const url = `${NgaApi.BASE_URL}?__lib=forum&__act=search`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://ngabbs.com/',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10.0; POCOPHONE F1 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.97 Mobile Safari/537.36',
          'X-USER-AGENT': 'Nga_Official/90954(Xiaomi POCOPHONE F1;Android 10.0)',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Fetch thread posts
   */
  async fetchThreadPosts(tid, page = 1) {
    const t = Math.floor(Date.now() / 1000);
    const signParams = String(tid);
    const sign = this.makeSign(signParams, t);

    const payload = {
      tid: String(tid),
      page: parseInt(page),
      __output: 14,
      __inchst: 'utf-8',
      app_id: NgaApi.APP_ID,
      access_uid: this.uid,
      access_token: this.token,
      t: t,
      sign: sign,
    };

    const url = `${NgaApi.BASE_URL}?__lib=post&__act=list`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://ngabbs.com/',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10.0; POCOPHONE F1 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.97 Mobile Safari/537.36',
          'X-USER-AGENT': 'Nga_Official/90954(Xiaomi POCOPHONE F1;Android 10.0)',
        },
        body: new URLSearchParams(payload).toString(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }
}

/**
 * Cloudflare Worker fetch handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Get credentials from query params or env variables
    const uid = url.searchParams.get('uid') || env.NGA_UID || '';
    const token = url.searchParams.get('token') || env.NGA_TOKEN || '';
    
    const api = new NgaApi(uid, token);

    try {
      let result;

      // RESTful Route: /api/forum/{fid}/threads
      const forumThreadsMatch = path.match(/^\/api\/forum\/([^\/]+)\/threads\/?$/);
      if (forumThreadsMatch) {
        const fid = forumThreadsMatch[1];
        const page = url.searchParams.get('page') || 1;
        const act = url.searchParams.get('act') || 'list';
        const orderBy = url.searchParams.get('order_by') || 'postdatedesc';

        result = await api.fetchSubjectList(fid, page, act, orderBy);
      }
      // RESTful Route: /api/thread/{tid}/posts
      else if (path.match(/^\/api\/thread\/([^\/]+)\/posts\/?$/)) {
        const threadPostsMatch = path.match(/^\/api\/thread\/([^\/]+)\/posts\/?$/);
        const tid = threadPostsMatch[1];
        const page = url.searchParams.get('page') || 1;

        result = await api.fetchThreadPosts(tid, page);
      }
      // RESTful Route: /api/search/threads
      else if (path === '/api/search/threads' || path === '/api/search/threads/') {
        const keyword = url.searchParams.get('keyword') || url.searchParams.get('q');
        const page = url.searchParams.get('page') || 1;
        const fid = url.searchParams.get('fid') || '';
        const table = url.searchParams.get('table') || 7;

        if (!keyword) {
          return new Response(JSON.stringify({ error: 'Missing keyword or q parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        result = await api.searchThreads(keyword, page, fid, table);
      }
      // RESTful Route: /api/search/forums
      else if (path === '/api/search/forums' || path === '/api/search/forums/') {
        const keyword = url.searchParams.get('keyword') || url.searchParams.get('q');
        const page = url.searchParams.get('page') || 1;

        if (!keyword) {
          return new Response(JSON.stringify({ error: 'Missing keyword or q parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        result = await api.searchForums(keyword, page);
      }
      // Legacy Route: /subject-list (backwards compatibility)
      else if (path === '/subject-list' || path === '/subject-list/') {
        const fid = url.searchParams.get('fid');
        const page = url.searchParams.get('page') || 1;
        const act = url.searchParams.get('act') || 'list';
        const orderBy = url.searchParams.get('order_by') || 'postdatedesc';

        if (!fid) {
          return new Response(JSON.stringify({ error: 'Missing fid parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        result = await api.fetchSubjectList(fid, page, act, orderBy);
      }
      // Legacy Route: /search-threads (backwards compatibility)
      else if (path === '/search-threads' || path === '/search-threads/') {
        const keyword = url.searchParams.get('keyword');
        const page = url.searchParams.get('page') || 1;
        const fid = url.searchParams.get('fid') || '';
        const table = url.searchParams.get('table') || 7;

        if (!keyword) {
          return new Response(JSON.stringify({ error: 'Missing keyword parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        result = await api.searchThreads(keyword, page, fid, table);
      }
      // Legacy Route: /search-forums (backwards compatibility)
      else if (path === '/search-forums' || path === '/search-forums/') {
        const keyword = url.searchParams.get('keyword');
        const page = url.searchParams.get('page') || 1;

        if (!keyword) {
          return new Response(JSON.stringify({ error: 'Missing keyword parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        result = await api.searchForums(keyword, page);
      }
      // Legacy Route: /thread-posts (backwards compatibility)
      else if (path === '/thread-posts' || path === '/thread-posts/') {
        const tid = url.searchParams.get('tid');
        const page = url.searchParams.get('page') || 1;

        if (!tid) {
          return new Response(JSON.stringify({ error: 'Missing tid parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        result = await api.fetchThreadPosts(tid, page);
      }
      // Route: / (home/help)
      else if (path === '/' || path === '') {
        const help = {
          message: 'NGA API Worker - RESTful & Legacy Endpoints',
          restful_endpoints: {
            'GET /api/forum/{fid}/threads': {
              description: 'Fetch subject list from forum (RESTful)',
              params: {
                page: 'Page number (default: 1)',
                act: 'Action: list, hot, topped (default: list)',
                order_by: 'Order by (default: postdatedesc)',
                uid: 'User ID (optional)',
                token: 'Access token (optional)',
              },
              examples: [
                '/api/forum/-7/threads?page=1',
                '/api/forum/123/threads?page=2&act=hot',
              ],
            },
            'GET /api/thread/{tid}/posts': {
              description: 'Fetch thread posts (RESTful)',
              params: {
                page: 'Page number (default: 1)',
                uid: 'User ID (optional)',
                token: 'Access token (optional)',
              },
              examples: [
                '/api/thread/45809037/posts?page=1',
                '/api/thread/37680782/posts',
              ],
            },
            'GET /api/search/threads': {
              description: 'Search threads (RESTful)',
              params: {
                keyword: 'Search keyword (required, or use q)',
                q: 'Alias for keyword',
                page: 'Page number (default: 1)',
                fid: 'Forum ID filter (optional)',
                table: 'Table type (default: 7)',
                uid: 'User ID (optional)',
                token: 'Access token (optional)',
              },
              examples: [
                '/api/search/threads?keyword=game&page=1',
                '/api/search/threads?q=test',
              ],
            },
            'GET /api/search/forums': {
              description: 'Search forums (RESTful)',
              params: {
                keyword: 'Search keyword (required, or use q)',
                q: 'Alias for keyword',
                page: 'Page number (default: 1)',
                uid: 'User ID (optional)',
                token: 'Access token (optional)',
              },
              examples: [
                '/api/search/forums?keyword=game',
                '/api/search/forums?q=test',
              ],
            },
          },
          legacy_endpoints: {
            'GET /subject-list': {
              description: 'Fetch subject list from forum (Legacy)',
              params: {
                fid: 'Forum ID (required)',
                page: 'Page number (default: 1)',
                act: 'Action: list, hot, topped (default: list)',
                order_by: 'Order by (default: postdatedesc)',
              },
              example: '/subject-list?fid=123&page=1&act=list',
            },
            'GET /thread-posts': {
              description: 'Fetch thread posts (Legacy)',
              params: {
                tid: 'Thread ID (required)',
                page: 'Page number (default: 1)',
              },
              example: '/thread-posts?tid=12345&page=1',
            },
            'GET /search-threads': {
              description: 'Search threads (Legacy)',
              params: {
                keyword: 'Search keyword (required)',
                page: 'Page number (default: 1)',
                fid: 'Forum ID filter (optional)',
                table: 'Table type (default: 7)',
              },
              example: '/search-threads?keyword=test&page=1',
            },
            'GET /search-forums': {
              description: 'Search forums (Legacy)',
              params: {
                keyword: 'Search keyword (required)',
                page: 'Page number (default: 1)',
              },
              example: '/search-forums?keyword=game',
            },
          },
        };

        return new Response(JSON.stringify(help, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      // 404 Not Found
      else {
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Return successful result
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

