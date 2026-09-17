# Libris (HTML / JavaScript)

A fast, dependency-light browser reader for ebooks, PDFs and local documents.

## Run

You can open `index.html` directly, but a tiny static server is recommended:

```bash
python -m http.server 8080
```

Then open:

http://localhost:8080

## Implemented

- Responsive library UI
- List/grid views, search and sorting
- Reading Now, Favorites, To Read, Have Read
- Authors, series, collections, formats, folders/download-style views
- Local browser persistence with IndexedDB
- Import TXT, Markdown, HTML, EPUB and PDF
- EPUB extraction through `fflate` loaded from jsDelivr
- PDF rendering with PDF.js and lazy-loaded canvas pages
- Selectable PDF text layer with Quote / Note / Copy actions
- Persistent highlights in reflowable ebooks and PDFs
- Configurable default highlight color
- Context-aware "Highlight" / "Remove highlight" selection action
- Inline translation popover with configurable target language
- Customizable floating selection menu: visibility, ordering, and overflow menu

- Book details and trash/restore
- Reader themes: day, night, sepia, twilight and console
- Font family, font size, weight, line spacing, text width, margins and alignment
- Reading progress with automatic save
- Bookmarks
- Table of contents
- Text selection → quote / note / copy
- Find in book
- Read aloud using Web Speech API
- Mobile drawer and desktop sidebar
- Keyboard shortcuts: `/` search, `Esc` close, arrows/PageUp/PageDown in reader
- Incremental library rendering (60 books at a time)

## Notes

Libris is an independent front-end browser reader prototype.

EPUB parsing needs the `fflate` CDN script to load. PDF rendering uses PDF.js from cdnjs. If you want a fully offline build, download fflate's UMD bundle and reference it locally.

Formats such as MOBI/AZW3/FB2/DOCX/CBR/CBZ can be catalogued, but this small browser build does not fully parse/render those binary formats. They normally require dedicated parsers/converters.

- Selection-menu customizer updates in-place without rebuilding the reader or PDF canvas

- Opening and closing the reader side panel is now DOM-local; it does not rebuild the reader/PDF canvas

- Opening Customize selection menu from the floating ⋯ menu is now fully DOM-local; no reader render or PDF canvas recomposition is triggered

- Text selection supports mouse, keyboard, touch, stylus/S-Pen/Apple Pencil via Pointer Events plus selectionchange handling

- PDF text selection now uses the official PDF.js `TextLayerBuilder` from `pdf_viewer.min.js`
- Custom PDF Range/sticky-selection manipulation was removed; PDF.js owns drag selection
- Official `.endOfContent` selection stabilizer and viewer text-layer CSS are used

## Repository layout

Because the GitHub connector has per-file payload limits, the large application source is stored in `src/app.part01.txt` … `src/app.part06.txt`. `app.js` loads and joins those fragments at runtime before importing them as a module. The stylesheet is split between `styles/base.css` and `styles/reader.css`, loaded by `styles.css`.
