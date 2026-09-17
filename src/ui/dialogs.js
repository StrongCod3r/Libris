
import {state} from "../state.js";
import {icon} from "./icons.js";
import {coverHTML} from "./sidebar.js";
import {escapeHTML} from "../library/filters.js";

export function modalHTML(){
  if(!state.modal)return "";
  if(state.modal.type==="import")return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" onclick="event.stopPropagation()">
    <div class="modal-head"><h3>Import books & documents</h3><div class="top-spacer"></div><button class="icon-btn" data-action="close-modal">${icon("close")}</button></div>
    <div class="modal-body"><label class="import-drop" id="import-drop">
      ${icon("upload")}<strong>Drop files here or click to browse</strong>
      <p>Fast browser import for EPUB, PDF, TXT, MD and HTML. Other formats can be added to the library as file records.</p>
      <input id="file-input" type="file" multiple hidden accept=".epub,.pdf,.txt,.md,.html,.htm,.doc,.docx,.rtf,.odt,.mobi,.azw3,.fb2,.cbz,.cbr">
    </label><div class="import-list">Files remain in your browser storage. Nothing is uploaded to a server.</div></div></div></div>`;
  if(state.modal.type==="details"){
    const b=state.books.find(x=>x.id===state.modal.id); if(!b)return "";
    return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head"><h3>About document</h3><div class="top-spacer"></div><button class="icon-btn" data-action="close-modal">${icon("close")}</button></div>
      <div class="modal-body"><div class="details-grid">
        ${coverHTML(b)}
        <div class="details-info"><h2>${escapeHTML(b.title)}</h2><div class="author">${escapeHTML(b.author||"Unknown author")}</div><div class="book-meta" style="margin-top:10px">${escapeHTML(b.format||"BOOK")} · ${escapeHTML(b.size||"Local file")}</div>
          <div class="detail-actions"><button class="primary-btn" data-open="${b.id}">${icon("read")} Read</button><button class="secondary-btn" data-fav="${b.id}">${icon("star")} ${b.favorite?"Unfavorite":"Favorite"}</button></div>
        </div>
        <div class="details-desc">${escapeHTML(b.description||"Local document imported into the browser library.")}</div>
      </div></div></div></div>`;
  }
  if(state.modal.type==="settings")return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" onclick="event.stopPropagation()">
    <div class="modal-head"><h3>App settings</h3><div class="top-spacer"></div><button class="icon-btn" data-action="close-modal">${icon("close")}</button></div>
    <div class="modal-body"><div class="settings-section"><div class="settings-label">Library</div>
      <div class="setting-row"><label>Default view</label><select id="default-display"><option value="list" ${state.display==="list"?"selected":""}>List</option><option value="grid" ${state.display==="grid"?"selected":""}>Grid</option></select></div>
      <div class="setting-row"><label>Sort order</label><select id="default-sort"><option value="recent" ${state.sort==="recent"?"selected":""}>Recent</option><option value="title" ${state.sort==="title"?"selected":""}>Title</option><option value="author" ${state.sort==="author"?"selected":""}>Author</option><option value="progress" ${state.sort==="progress"?"selected":""}>Progress</option></select></div>
    </div><p style="font-size:12px;color:var(--muted)">Libris keeps library metadata, reading progress, bookmarks, notes, highlights, and imported documents in this browser.</p></div></div></div>`;
  return "";
}

export function contextMenuHTML(){
  const b=state.books.find(x=>x.id===state.menu?.id); if(!b)return "";
  return `<div class="context-menu" style="left:${state.menu.x}px;top:${state.menu.y}px">
    <button data-detail="${b.id}">${icon("info")} About document</button>
    <button data-open="${b.id}">${icon("read")} Read</button>
    <button data-status="${b.id}:to-read">${icon("clock")} To Read</button>
    <button data-status="${b.id}:read">${icon("check")} Have Read</button>
    <button data-trash="${b.id}">${icon("trash")} ${b.trashed?"Restore":"Move to Trash"}</button>
  </div>`;
}
