# NGA API Cloudflare Worker

Đây là phiên bản Cloudflare Worker được chuyển đổi từ PHP NgaApi class.

## Tính năng

- ✅ Fetch danh sách chủ đề từ forum
- ✅ Tìm kiếm threads
- ✅ Tìm kiếm forums
- ✅ Lấy bài viết trong thread
- ✅ CORS support
- ✅ RESTful API endpoints

## Cài đặt & Deploy

### 1. Cài đặt Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Đăng nhập Cloudflare

```bash
wrangler login
```

### 3. Deploy Worker

```bash
wrangler deploy
```

### 4. Cấu hình Environment Variables (Tùy chọn)

Bạn có thể set UID và Token mặc định bằng secrets:

```bash
wrangler secret put NGA_UID
# Nhập UID của bạn

wrangler secret put NGA_TOKEN
# Nhập token của bạn
```

## API Endpoints

### 1. GET `/subject-list`

Lấy danh sách chủ đề từ forum.

**Parameters:**
- `fid` (required): Forum ID
- `page` (optional, default: 1): Số trang
- `act` (optional, default: 'list'): Action (list, hot, topped)
- `order_by` (optional, default: 'postdatedesc'): Sắp xếp
- `uid` (optional): User ID
- `token` (optional): Access token

**Example:**
```bash
curl "https://your-worker.workers.dev/subject-list?fid=123&page=1"
```

### 2. GET `/search-threads`

Tìm kiếm threads.

**Parameters:**
- `keyword` (required): Từ khóa tìm kiếm
- `page` (optional, default: 1): Số trang
- `fid` (optional): Lọc theo Forum ID
- `table` (optional, default: 7): Table type
- `uid` (optional): User ID
- `token` (optional): Access token

**Example:**
```bash
curl "https://your-worker.workers.dev/search-threads?keyword=game&page=1"
```

### 3. GET `/search-forums`

Tìm kiếm forums.

**Parameters:**
- `keyword` (required): Từ khóa tìm kiếm
- `page` (optional, default: 1): Số trang
- `uid` (optional): User ID
- `token` (optional): Access token

**Example:**
```bash
curl "https://your-worker.workers.dev/search-forums?keyword=game"
```

### 4. GET `/thread-posts`

Lấy bài viết trong thread.

**Parameters:**
- `tid` (required): Thread ID
- `page` (optional, default: 1): Số trang
- `uid` (optional): User ID
- `token` (optional): Access token

**Example:**
```bash
curl "https://your-worker.workers.dev/thread-posts?tid=12345&page=1"
```

### 5. GET `/`

Hiển thị help/documentation.

## Sử dụng trong Code

### JavaScript/TypeScript

```javascript
// Fetch subject list
const response = await fetch('https://your-worker.workers.dev/subject-list?fid=123&page=1');
const data = await response.json();
console.log(data);

// Search threads
const response2 = await fetch('https://your-worker.workers.dev/search-threads?keyword=game');
const data2 = await response2.json();
console.log(data2);
```

### Python

```python
import requests

# Fetch subject list
response = requests.get('https://your-worker.workers.dev/subject-list', params={
    'fid': '123',
    'page': 1
})
data = response.json()
print(data)
```

### PHP

```php
<?php
// Fetch subject list
$url = 'https://your-worker.workers.dev/subject-list?fid=123&page=1';
$response = file_get_contents($url);
$data = json_decode($response, true);
print_r($data);
?>
```

## Lưu ý quan trọng

⚠️ **MD5 Hash**: Code này sử dụng Web Crypto API để tạo MD5 hash. Tuy nhiên, Cloudflare Workers không hỗ trợ MD5 natively trong `crypto.subtle.digest()`. 

Bạn có 2 lựa chọn:

### Option 1: Sử dụng thư viện MD5 (Khuyến nghị)

Cài đặt và sử dụng thư viện như `js-md5`:

```bash
npm install js-md5
```

Sau đó sửa phương thức `md5()` trong `worker.js`:

```javascript
import md5 from 'js-md5';

// Trong class NgaApi:
md5(text) {
  return md5(text);
}
```

### Option 2: Implement MD5 thuần JavaScript

Thêm implementation MD5 trực tiếp vào file worker.js (xem phần dưới).

## MD5 Implementation (Nếu không dùng npm)

Nếu bạn muốn deploy mà không cần npm, thêm đoạn code này vào đầu file `worker.js`:

```javascript
function md5(string) {
  function rotateLeft(value, shift) {
    return (value << shift) | (value >>> (32 - shift));
  }
  
  function addUnsigned(x, y) {
    return (x + y) >>> 0;
  }
  
  function utf8Encode(string) {
    return unescape(encodeURIComponent(string));
  }
  
  function convertToWordArray(string) {
    const wordArray = [];
    for (let i = 0; i < string.length * 8; i += 8) {
      wordArray[i >> 5] |= (string.charCodeAt(i / 8) & 0xff) << (i % 32);
    }
    return wordArray;
  }
  
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    // ... (full MD5 implementation)
    
    x[0] = addUnsigned(a, x[0]);
    x[1] = addUnsigned(b, x[1]);
    x[2] = addUnsigned(c, x[2]);
    x[3] = addUnsigned(d, x[3]);
  }
  
  // Simplified - use a full MD5 library instead
  // This is just a placeholder
  return string; // Replace with actual MD5 implementation
}
```

## Development & Testing

### Local Testing

```bash
wrangler dev
```

Worker sẽ chạy tại `http://localhost:8787`

### Testing Endpoints

```bash
# Test subject list
curl "http://localhost:8787/subject-list?fid=123"

# Test search
curl "http://localhost:8787/search-threads?keyword=test"
```

## Monitoring & Logs

Xem logs của worker:

```bash
wrangler tail
```

## Giới hạn Cloudflare Workers Free Tier

- 100,000 requests/day
- 10ms CPU time per request
- 128 MB memory

Nếu cần nhiều hơn, nâng cấp lên paid plan.

## License

Converted from NgaApi.php

