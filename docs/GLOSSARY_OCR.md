# Glossary Editing and OCR

This document explains the glossary editing workflow and the image OCR modal available on thread pages.

## Glossary Editing

- Per‑line raw: Each displayed comment line is wrapped as a `.comment-line` element with a `data-raw` attribute (Chinese) built by:
  1. Splitting the original API `content` at `<br/>`.
  2. Stripping BBCode/HTML (including `[img]...[/img]`, `[flash]...[/flash]`, `[style]...[/style]` while keeping inner text), emoticons `[s:cat:name]`, and standalone URLs.

- Click‑to‑edit: Click any line to open the small “Edit Glossary” modal. Set the translation and Save. Data is persisted to `localStorage` under `nga_glossary` as an array of:

```json
[{ "raw": "这是一句中文", "mean": "Đây là một câu tiếng Trung" }]
```

- Global Glossary page: Visit `/glossary` to:
  - Edit in bulk using `Raw=Meaning` per line.
  - Import/Export `.txt`.
  - Remove duplicates or clear all.

- Translation requests: The client includes the glossary with each batch; the server uses this transient glossary trie FIRST, before Names2/Names/VietPhrase/ChinesePhienAm.

## OCR Modal in Comments

- Trigger: Click any image inside `.post-content` to open the OCR modal.
- Proxy: Images are fetched via `https://wsrv.nl/?url=` for consistent access.
- Engine: Tesseract.js with language `chi_sim` (Chinese Simplified).
- Progress: A progress bar reflects OCR progress.
- Output:
  - OCR Text: recognized text (normalized; spaces removed, lines trimmed).
  - Translate: auto‑translates to Vietnamese using the VietPhrase API; you can re‑translate.
  - Fix Line Breaks: heuristic merge of short lines until punctuation.
  - Copy buttons for OCR text and translation.

### Fix Line Breaks heuristic

```js
function fix_breaks(input, min_invalid = 15) {
  const lines = input.split(/\r\n?|\n/);
  let output = '';
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    output += line;
    if (is_full_line(line, min_invalid)) output += '\n';
  }
  return output;
}
```

Where `is_full_line` returns true if a line is short or ends with punctuation.

## Accessibility Notes

- Modals are opened via Bootstrap Modal when available. A fallback keeps `aria-hidden` and `aria-modal` in sync with a backdrop to avoid hiding focused descendants from assistive tech.

## Data & Privacy

- Glossary is stored locally in the browser (localStorage). OCR and translation requests are sent to the configured VietPhrase server.

