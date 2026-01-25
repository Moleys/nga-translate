# 🚀 Quick Start Guide

Hướng dẫn nhanh để deploy NGA API lên Cloudflare Workers.

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

Hoặc cài đặt wrangler global:

```bash
npm install -g wrangler
```

## Bước 2: Đăng nhập Cloudflare

```bash
wrangler login
```

Trình duyệt sẽ mở và yêu cầu bạn đăng nhập vào Cloudflare.

## Bước 3: Deploy Worker

```bash
npm run deploy
```

Hoặc:

```bash
wrangler deploy
```

Sau khi deploy thành công, bạn sẽ nhận được URL như:

```
https://nga-api-worker.your-subdomain.workers.dev
```

## Bước 4: Test Worker

### Test bằng cURL

```bash
# Test subject list
curl "https://nga-api-worker.your-subdomain.workers.dev/subject-list?fid=-7&page=1"

# Test search threads
curl "https://nga-api-worker.your-subdomain.workers.dev/search-threads?keyword=game"

# Test thread posts
curl "https://nga-api-worker.your-subdomain.workers.dev/thread-posts?tid=37680782"
```

### Test bằng Browser

Mở file `test-worker.html` trong trình duyệt, nhập Worker URL của bạn và test các endpoint.

## Bước 5: Cấu hình Environment Variables (Optional)

Nếu muốn set UID và Token mặc định:

```bash
wrangler secret put NGA_UID
# Nhập UID

wrangler secret put NGA_TOKEN  
# Nhập Token
```

Hoặc truyền trong query params:

```bash
curl "https://nga-api-worker.your-subdomain.workers.dev/subject-list?fid=123&uid=YOUR_UID&token=YOUR_TOKEN"
```

## Development Mode

Để test local trước khi deploy:

```bash
npm run dev
```

Worker sẽ chạy tại `http://localhost:8787`

Mở `test-worker.html` và đổi Worker URL thành `http://localhost:8787`

## Troubleshooting

### Lỗi: "No wrangler.toml file found"

Đảm bảo file `wrangler.toml` tồn tại trong thư mục hiện tại.

### Lỗi: "Authentication error"

Chạy lại `wrangler login` để đăng nhập lại.

### Worker không hoạt động

1. Check logs: `wrangler tail`
2. Kiểm tra response từ NGA API
3. Verify parameters đúng format

## API Endpoints

| Endpoint | Method | Parameters | Description |
|----------|--------|------------|-------------|
| `/subject-list` | GET | fid, page, act, order_by | Lấy danh sách chủ đề |
| `/search-threads` | GET | keyword, page, fid, table | Tìm kiếm threads |
| `/search-forums` | GET | keyword, page | Tìm kiếm forums |
| `/thread-posts` | GET | tid, page | Lấy bài viết trong thread |
| `/` | GET | - | Help/Documentation |

## Next Steps

- ✅ Deploy thành công
- 📝 Tích hợp vào ứng dụng của bạn
- 🔒 Bảo mật với Cloudflare Access (nếu cần)
- 📊 Monitor với Cloudflare Analytics
- 🚀 Scale tự động theo traffic

## Support

- 📖 Full documentation: `README_WORKER.md`
- 🐛 Report issues tại GitHub
- 💬 NGA API documentation: https://ngabbs.com

---

Chúc bạn code vui vẻ! 🎉

