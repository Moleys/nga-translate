NGA Translate Flutter – summary of recent changes

Features
- Direct NGA API client (signing like app/NgaApi.php); no backend URL needed; uses nga_access_uid/token.
- Local translation engine (translate-server dictionaries) with caching + glossary; offline, no HTTP.
- BBCode -> HTML rendering for posts; inline images tappable for on-device ML Kit OCR + copy; jieba segmentation in OCR screen.
- Forum catalog from assets (forum-list.js) with favorites; quick access on dashboard; manual FID still supported.
- Login screen to enter/validate NGA credentials; bookmarks/history/glossary/favorites stored locally.
- Optional translation toggle in search/thread views; translations cached.

Build & Deploy (example)
- flutter build apk --debug
- adb install -r build/app/outputs/flutter-apk/app-debug.apk
- adb shell monkey -p com.nga.translate.nga_translate_flutter -c android.intent.category.LAUNCHER 1

Notes
- Translation dictionaries: assets/data/*.txt (Names, Names2, VietPhrase, ChinesePhienAmWords).
- OCR: google_mlkit_text_recognition; segmentation: jieba_flutter.
- Forum list: assets/forums.json (converted from public/assets/js/forum-list.js).