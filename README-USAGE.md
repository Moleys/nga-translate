# Hướng dẫn sử dụng NGA Forums Viewer

## Khởi động server

```bash
php -S localhost:8000 -t public
```

## Truy cập ứng dụng

1. **Trang chủ**: http://localhost:8000
   - Hiển thị danh sách forums (Whirlpool Academy)
   
2. **Trang forum**: http://localhost:8000/forum/524
   - Hiển thị danh sách threads
   - 3 filters: Latest, Topped, Hot
   - Pagination (chỉ có ở filter Latest)

3. **Test API**: http://localhost:8000/test-api.html
   - Debug và test các API endpoints

## Các filters

- **Latest (list)**: Hiển thị threads mới nhất, có phân trang (8430 pages)
- **Hot**: Hiển thị threads hot nhất (~35 threads, không có phân trang)
- **Topped**: Hiển thị threads được pin (cần authentication, có thể lỗi)

## Cấu trúc API Response

### Filter: list
```json
{
  "code": 0,
  "result": {
    "data": [...],
    "currentPage": 1,
    "totalPage": 8430,
    "perPage": 35
  }
}
```

### Filter: hot/topped
```json
{
  "code": 0,
  "result": [...]  // Array trực tiếp
}
```

## Debug

Mở Browser Console (F12) để xem logs:
- `updatePagination called:` - Kiểm tra pagination có được gọi không
- Kiểm tra network tab để xem API responses

## Troubleshooting

### Không thấy pagination:
1. Đảm bảo đang ở filter "Latest" (list)
2. Mở Console và kiểm tra logs
3. Kiểm tra `totalPage > 1` trong API response

### Không thấy threads ở filter Hot:
1. Kiểm tra Console có lỗi không
2. Test API trực tiếp: http://localhost:8000/api/forum/524/threads?act=hot
3. Xem logs để debug

### Filter Topped bị lỗi:
- NGA API yêu cầu authentication cho topped filter
- Sẽ trả về `{"code":5,"msg":"签名错误"}`
