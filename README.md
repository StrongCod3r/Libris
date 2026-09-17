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
- PDF rendering with PDF.js 6.3.289 `PDFPageView` and lazy page rendering
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

- PDF pages are built by the official PDF.js 6.3.289 `PDFPageView`
- `PDFPageView` owns canvas rendering, PDF-to-CSS scaling, page dimensions and the `TextLayerBuilder`
- The text layer therefore uses the same geometry and global selection listener as Mozilla's component example
- PDF.js owns pointer/selection behavior, including dynamic `.endOfContent` repositioning across whitespace
- The official 6.3.289 `pdf_viewer.css` supplies page and text-layer geometry/selection styles
- Libris no longer positions or stretches PDF canvases/text layers manually; it only adds its persistent highlight overlay
- Custom PDF Range/sticky-selection manipulation remains removed; Libris only observes the final selection for its actions

## Repository layout

```text
Libris/
├── app.js
├── index.html
├── styles.css
├── styles/
│   ├── base.css
│   └── reader.css
└── src/
    ├── main.js
    ├── state.js
    ├── library/
    │   ├── filters.js
    │   ├── import.js
    │   └── library.js
    ├── reader/
    │   ├── epub-reader.js
    │   ├── highlights.js
    │   ├── pdf-reader.js
    │   ├── reader.js
    │   ├── selection.js
    │   └── translation.js
    ├── storage/
    │   └── db.js
    └── ui/
        ├── dialogs.js
        ├── icons.js
        ├── selection-menu.js
        ├── sidebar.js
        └── toolbar.js
```

The application now uses native ES modules. `app.js` is only the browser entry point and imports `src/main.js`; the old concatenated `app.partXX.txt` loader has been removed.

### Architecture

- **state**: shared application state and defaults
- **storage**: IndexedDB persistence
- **library**: filtering, importing and library mutations
- **reader**: reflowable reader, PDF.js integration, EPUB parsing, selection, highlights and translation
- **ui**: reusable HTML renderers and controls
- **main**: application orchestration, event binding and lifecycle
