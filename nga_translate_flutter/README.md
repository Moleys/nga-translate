# NGA Translate Flutter (Material 3)

Flutter Material 3 client for the NGA Translate backend. Ships with a bottom navigation shell (overview, forums, search, bookmarks, history), NGA credential storage, and light theming that matches the existing PWA color (#5A9D8A).

## Run

```bash
cd nga_translate_flutter
flutter run                       # mobile/desktop
flutter run -d chrome             # web

# Override backend URL if not using localhost:8000
flutter run --dart-define=BACKEND_URL=http://your-host:8000
```

## Features

- Material 3 theme (Work Sans typography, seed color #5A9D8A)
- Configure `nga_access_uid` and `nga_access_token` (persisted locally)
- Forum browser: list / hot / topped with thread cards
- Thread reader with pagination and bookmarking
- Forum catalog (built-in NGA list) with search + manual FID entry
- Search threads (optional FID filter) with optional translation
- Local bookmarks + reading history (persisted), local glossary
- OCR screen using Google ML Kit (camera or gallery)
- Optional translation using bundled VietPhrase dictionaries + local glossary (no network)
  - Dictionaries sourced from `translate-server/data` and loaded in-app

## Notes

- API calls expect the PHP backend from the root project. Auth is sent via `Cookie: nga_access_uid/nga_access_token`.
- Minimal smoke test: `flutter test`.

### OCR (ML Kit)

- Uses `google_mlkit_text_recognition` on-device (Chinese/LATIN).  
- Permissions: camera + photos (Android manifest + iOS Info.plist already configured).  
- Access via Dashboard → “OCR (ML Kit)”, pick an image or use the camera, then copy recognized text.

### Translation (VietPhrase)
- Dashboard → Glossary to add `raw` → `meaning` pairs (stored locally).
- Enable “Translate” on search or thread pages to translate titles/posts using the glossary + VietPhrase API.
