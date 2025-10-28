# Changelog

## 2025-10-28 - Initial Release

### Features Added

✅ **Backend (PHP)**
- NgaApi class để tương tác với NGA forum API
- API endpoint: `/api/forum/{fid}/threads?act={list|hot|topped}&page={number}`
- Hỗ trợ 3 loại filter: list (latest), hot, topped

✅ **Frontend (Latte Templates)**
- Home page hiển thị danh sách forums
- Forum page với filter buttons và thread listing
- Responsive layout với Bootstrap 5

✅ **JavaScript Features**
- Dynamic thread loading với AJAX
- Pagination (cho filter Latest)
- Filter switching (Latest/Hot/Topped)
- Image thumbnails display
- Loading states & error handling
- Smooth scroll to top khi đổi trang

✅ **Thread Display**
- Thread title với link đến NGA
- Author và Last poster info
- Posted time và Last post time
- Reply count badge
- **Thumbnail images** (120x120px, responsive 80x80px trên mobile)
- Attachment count badge
- Image icon cho threads có ảnh

### Technical Details

**API Response Handling:**
- List filter: Object với pagination (`result.data`, `result.totalPage`)
- Hot/Topped filter: Array trực tiếp (`result`)
- Attachment prefix: `https://img.nga.178.com/attachments/`

**Styling:**
- Hover effects trên cards
- Rounded thumbnail với border
- Badge cho replies và attachments
- Responsive design cho mobile

### Known Issues
- Filter "Topped" cần authentication nên có thể lỗi
- Hot filter không có pagination (chỉ ~35 threads)

### Files Modified
- `public/assets/js/forum.js` - Thêm thumbnail support
- `app/views/forum.latte` - Thêm CSS cho thumbnails
- `app/NgaApi.php` - API integration
- `public/index.php` - Routes và endpoints
