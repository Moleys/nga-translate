# NGA Forums Reader

A modern Progressive Web App (PWA) for browsing NGA forums with Vietnamese translation, built with Flight PHP, Latte templating, and Bootstrap 5.

## ✨ Features

### Core Functionality
- 🌐 **Vietnamese Translation** - Automatic Chinese to Vietnamese translation using VietPhrase API
- 📱 **Progressive Web App** - Install as native app on mobile/desktop
- 🔌 **Offline Support** - Browse cached content without internet
- 🔖 **Bookmarks** - Save favorite threads for later
- 📚 **Reading History** - Track visited threads (last 60)
- 🔍 **Smart Search** - Search threads and forums with NGA URL detection
- 🎨 **Modern UI** - Sage green theme with responsive design
- 🌙 **BBCode Support** - Full rendering of NGA BBCode tags
- 🖼️ **Image Optimization** - Lazy loading and thumbnail resizing

### Technical Features
- ⚡ **Fast Loading** - Smart caching strategies
- 🔒 **Secure** - XSS protection with input sanitization
- 📊 **Infinite Scroll** - Seamless content loading
- 🎯 **Thread Filtering** - Latest, Topped, Hot threads
- 🏷️ **Title Colors** - Support for colored thread titles
- 📱 **Mobile-First** - Responsive design for all devices

## 🚀 Installation

### Prerequisites
- PHP >= 7.4
- Composer

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/nga-translate.git
cd nga-translate
```

2. **Install PHP dependencies:**
```bash
composer install
```


5. **Start development server:**
```bash
php -S localhost:8000 -t public
```

6. **Visit the app:**
```
http://localhost:8000
```

## 📁 Project Structure

```
nga-translate/
├── app/
│   ├── controllers/           # Controller classes (unused - using routes)
│   └── views/                 # Latte templates
│       ├── layout.latte       # Main layout with PWA support
│       ├── home.latte         # Homepage with favorites
│       ├── forum-list.latte   # All forums list
│       ├── forum.latte        # Forum threads view
│       ├── read.latte         # Thread reading page
│       ├── search.latte       # Search results
│       ├── bookmarks.latte    # Bookmarks page
│       ├── history.latte      # Reading history
│       └── login.latte        # NGA authentication
├── config/                    # Configuration files
├── public/                    # Public web directory
│   ├── index.php              # Application entry point & routes
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css      # Custom styles (sage green theme)
│   │   ├── js/
│   │   │   ├── config.js      # Centralized configuration
│   │   │   ├── utils.js       # Shared utility functions
│   │   │   ├── pwa.js         # PWA registration
│   │   │   ├── auth.js        # NGA authentication
│   │   │   ├── translate.js   # Translation integration
│   │   │   ├── main.js        # Global scripts
│   │   │   ├── forum.js       # Forum page logic
│   │   │   ├── read.js        # Thread reading logic
│   │   │   ├── search.js      # Search functionality
│   │   │   ├── bookmarks-page.js
│   │   │   ├── history-page.js
│   │   │   ├── favorite-forums.js
│   │   │   ├── forum-page.js
│   │   │   ├── forum-list.js
│   │   │   └── emoticons.js   # NGA emoticon support
│   │   └── images/
│   │       ├── icon.png       # Source icon (512x512)
│   │       └── icons/         # Generated PWA icons
├── temp/                      # Latte template cache
├── translate-server/          # VietPhrase translation server
├── generate_icons.py          # Icon generator script
├── PWA_README.md             # PWA documentation
└── README.md                  # This file
```

## 🎯 Usage

### Basic Navigation

1. **Home Page** (`/`)
   - View favorite forums
   - See recently viewed threads
   - Quick search

2. **Forums List** (`/forums`)
   - Browse all NGA forums by category
   - Mark forums as favorites

3. **Forum View** (`/forum/{fid}`)
   - Filter threads: Latest / Topped / Hot
   - Infinite scroll pagination
   - Thread thumbnails

4. **Thread Reading** (`/thread/{tid}`)
   - Automatic translation
   - BBCode rendering
   - Pagination
   - Bookmark threads
   - Auto-save to history

5. **Search** (`/search?q=keyword`)
   - Search threads and forums
   - NGA URL detection (paste thread URL)
   - Infinite scroll results

6. **Bookmarks** (`/bookmarks`)
   - Manage saved threads
   - View bookmark timestamps

7. **History** (`/history`)
   - Last 60 visited threads
   - Chronological order

### NGA Authentication

1. Visit `/login`
2. Enter `nga_access_uid` and `nga_access_token` from NGA cookies
3. Credentials stored in browser cookies
4. Auto-injected into API requests

### Installing as PWA

**Desktop (Chrome/Edge):**
- Click install icon in address bar
- Or click "Install App" button

**Android:**
- Chrome menu → "Install app"

**iOS (Safari):**
- Share → "Add to Home Screen"

### Offline Usage

1. Visit pages online (they get cached)
2. Go offline
3. Browse cached content
4. New pages won't load until online

## 🔧 Configuration

### Translation API

Edit `public/assets/js/config.js`:

```javascript
const CONFIG = {
    TRANSLATION_API_URL: 'http://localhost:5005/translate2',
    TRANSLATION_SOURCE_LANG: 'zh-Hans',
    TRANSLATION_TARGET_LANG: 'vi',
    // ...
};
```

### Cache Limits

Edit `public/sw.js`:

```javascript
const MAX_DYNAMIC_ITEMS = 50;  // API cache
const MAX_IMAGE_ITEMS = 100;   // Image cache
```

### PWA Theme

Edit `public/manifest.json`:

```json
{
  "theme_color": "#5a9d8a",
  "background_color": "#f8fbfa"
}
```

## 📡 API Endpoints

### Backend Routes

- `GET /` - Homepage
- `GET /forums` - Forums list
- `GET /forum/{fid}` - Forum view
- `GET /thread/{tid}` - Thread view
- `GET /search` - Search page
- `GET /bookmarks` - Bookmarks page
- `GET /history` - History page
- `GET /login` - Login page

### AJAX API

- `GET /api/forum/{fid}/threads?act={list|topped|hot}&page={n}` - Forum threads
- `GET /api/thread/{tid}?page={n}` - Thread posts
- `GET /api/search/threads?q={keyword}&page={n}` - Search threads
- `GET /api/search/forums?q={keyword}&page={n}` - Search forums

### NGA API (Proxied)

All requests include authentication headers from cookies.

## 🛠️ Development

### Code Quality Principles

This project follows **SOLID, DRY, KISS, YAGNI** principles:

- **DRY**: Shared utilities in `utils.js`, `config.js`
- **KISS**: Simple, readable code over clever complexity
- **YAGNI**: Only features that are actually used
- **SOLID**: Single responsibility functions

### Recent Optimizations

## Glossary + OCR

The app supports a complete glossary editing flow and in‑place OCR for images inside posts.

### Glossary Editing

- Per‑line raw text: each rendered line has a matching `data-raw` built by splitting original API `content` at `<br/>` and stripping BBCode/HTML, emoticons, and standalone URLs.
- Click‑to‑edit: click any line to open a modal to add/update a glossary entry for that raw text. Entries are saved to `localStorage` under `nga_glossary` as an array of `{ raw, mean }`.
- Global page: visit `/glossary` to bulk edit (format: `Raw=Meaning` per line), import/export, or clear.
- Translation requests: the client sends the glossary with each request; the translation server applies this glossary BEFORE built‑in dictionaries.

### Image OCR in Comments

- Click any image in a post to open the OCR modal. Images are proxied via `https://wsrv.nl/?url=` for consistent fetching.
- OCR: Tesseract.js, Chinese (Simplified, `chi_sim`) with a progress bar.
- After OCR, the app auto‑translates the text using the same VietPhrase API. You can re‑translate, copy text, copy translation, or fix line breaks.
- Fix Line Breaks: merges short lines until punctuation for better readability.

Details: see `docs/GLOSSARY_OCR.md`.

✅ Consolidated duplicate `escapeHtml()` functions (eliminated 35 lines)
✅ Created central `CONFIG` constants (no magic numbers)
✅ Fixed XSS vulnerability in BBCode parser (CSS injection)
✅ Added CSS sanitization for color/size/align values

### Adding New Features

1. Update routes in `public/index.php`
2. Create Latte template in `app/views/`
3. Add JS logic in `public/assets/js/`
4. Update Service Worker cache if needed

### Debugging

**Browser DevTools:**
- Application tab → Manifest, Service Workers, Cache
- Network tab → Check API calls
- Console → Check for JS errors

**PHP Errors:**
```bash
# Enable error reporting
php -S localhost:8000 -t public 2>&1 | tee server.log
```

## 🔒 Security

### XSS Protection

✅ All user input escaped via `Utils.escapeHtml()`
✅ BBCode values sanitized with regex validation
✅ CSS injection prevented with whitelists

### Implemented Sanitizers

```javascript
Utils.sanitizeColor(color)   // Hex, rgb, rgba, hsl, named colors
Utils.sanitizeSize(size)     // px, em, rem, %, pt only
Utils.sanitizeAlign(align)   // left, center, right, justify only
```

### HTTPS Requirement

PWA features require HTTPS in production (localhost exempt).

## 📊 Performance

### Metrics

- **First Load**: ~2s (includes Bootstrap CDN)
- **Cached Load**: ~200ms
- **Offline Load**: Instant (from cache)

### Caching Strategy

| Resource | Strategy | Cache Duration |
|----------|----------|----------------|
| HTML pages | Network-First | Session |
| CSS/JS | Cache-First | Until version change |
| Images | Cache-First | Persistent |
| API calls | Network-First | 50 items max |

### Bundle Sizes

- CSS: ~15KB (minified)
- JS (all): ~85KB (unminified)
- Icons: 208KB (lazy-loaded)

## 🧪 Testing

### Manual Testing Checklist

- [ ] Install as PWA on desktop
- [ ] Install as PWA on mobile
- [ ] Test offline mode
- [ ] Verify caching works
- [ ] Test search functionality
- [ ] Test bookmarks save/delete
- [ ] Test history tracking
- [ ] Test translation works
- [ ] Test BBCode rendering
- [ ] Test responsive design

### Lighthouse Audit

```bash
# Open DevTools → Lighthouse → PWA
# Expected score: 90+ (100 with HTTPS)
```

## 🚢 Deployment

### Production Checklist

1. **Enable HTTPS** (Let's Encrypt recommended)
2. **Update Service Worker version**
   ```javascript
   const CACHE_VERSION = 'nga-forums-v2';
   ```
3. **Configure translation server URL**
4. **Set up error logging**
5. **Test on real devices**
6. **Monitor cache sizes**

### Hosting Options

- **VPS**: DigitalOcean, Linode, Vultr
- **Shared Hosting**: PHP 7.4+ support required
- **Cloudflare**: Free SSL + CDN

## 🤝 Contributing

Contributions welcome! Please:

1. Follow existing code style
2. Test your changes
3. Update documentation
4. Submit PR with description

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

- **NGA Forums** - Original content source
- **Flight PHP** - Micro-framework
- **Latte** - Templating engine
- **Bootstrap** - UI framework
- **VietPhrase** - Translation API
- **Pillow** - Image processing

## 📞 Support



**Built with ❤️ by the NGA Forums community**
