
import {state,NAV_ITEMS} from "../state.js";
import {icon} from "./icons.js";
import {escapeHTML,fmtDate,getCounts,groupBy,hashColors,navFilter,statusText,viewTitle} from "../library/filters.js";

export function sidebarHTML(){
  const counts=getCounts(state);
  return `<aside class="sidebar ${state.mobileNav?"open":""}">
    <div class="brand"><div class="brand-mark"></div><div class="brand-copy"><strong>Libris</strong><span>browser reader</span></div></div>
    <div class="nav-scroll">
      <div class="nav-group">${NAV_ITEMS.slice(0,5).map(([id,label,ico])=>navItem(id,label,ico,counts[id])).join("")}</div>
      <div class="nav-group"><div class="nav-label">Library</div>${NAV_ITEMS.slice(5,10).map(([id,label,ico])=>navItem(id,label,ico,counts[id])).join("")}</div>
      <div class="nav-group"><div class="nav-label">Files</div>${NAV_ITEMS.slice(10).map(([id,label,ico])=>navItem(id,label,ico,counts[id])).join("")}</div>
    </div>
    <div class="sidebar-footer"><div class="storage"><div class="storage-row"><span>Local library</span><span>${state.books.filter(b=>!b.trashed).length} items</span></div><div class="storage-bar"><i></i></div></div></div>
  </aside>`;
}

function navItem(id,label,ico,count){
  return `<button class="nav-item ${state.view===id?"active":""}" data-nav="${id}">
    <span class="nav-icon">${icon(ico)}</span><span>${label}</span>${count!==undefined?`<span class="count">${count}</span>`:""}
  </button>`;
}

export function coverHTML(book){
  const palette=book.palette||hashColors(book.title);
  if(book.coverData)return `<div class="cover" style="background:#20373d"><img src="${book.coverData}" alt="" style="width:100%;height:100%;object-fit:cover"><span class="cover-badge">${escapeHTML(book.format)}</span></div>`;
  return `<div class="cover" style="--c1:${palette[0]};--c2:${palette[1]}">
    <span class="cover-badge">${escapeHTML(book.format||"BOOK")}</span>
    <div class="cover-title">${escapeHTML(book.title)}</div><div class="cover-author">${escapeHTML(book.author||"Unknown author")}</div>
  </div>`;
}

export function contentHTML(){
  if(["authors","series","collections","formats","folders","downloads"].includes(state.view))return groupedHTML();
  const list=navFilter(state);
  const reading=state.books.filter(b=>!b.trashed&&b.status==="reading").sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,8);
  const showShelf=state.view==="all"&&!state.query&&reading.length;
  return `
    ${showShelf?`<div class="section-head"><div><h2>Continue reading</h2><p>Pick up where you left off</p></div></div>
    <div class="shelf">${reading.map(miniBookHTML).join("")}</div>`:""}
    <div class="section-head"><div><h2>${state.view==="all"?"Library":viewTitle(state)}</h2><p>${list.length} ${list.length===1?"document":"documents"} · sorted by ${state.sort}</p></div><div class="grow"></div></div>
    <div class="search-strip">${icon("search")}<input id="library-search" autocomplete="off" placeholder="Search title, author, series or format…" value="${escapeHTML(state.query)}"><span class="kbd">/</span></div>
    ${state.display==="list"?`<div class="book-list">${list.slice(0,state.visibleCount).map(bookRowHTML).join("")}</div>`:`<div class="grid-books">${list.slice(0,state.visibleCount).map(gridBookHTML).join("")}</div>`}
    ${list.length===0?'<div class="empty"><div class="empty-icon">⌕</div><strong>No books found</strong><div>Try another filter or import a document.</div></div>':""}
    ${list.length>state.visibleCount?'<div class="empty"><button class="secondary-btn" data-action="load-more">Load more</button></div>':""}
  `;
}

function miniBookHTML(b){
  return `<article class="mini-book clickable" data-open="${b.id}">${coverHTML(b)}
    <div class="mini-title">${escapeHTML(b.title)}</div><div class="mini-meta">${escapeHTML(b.author||"Unknown")}</div>
    <div class="mini-progress"><i style="width:${b.progress||0}%"></i></div></article>`;
}
function bookRowHTML(b){
  return `<article class="book-row" data-id="${b.id}">
    <div class="clickable" data-open="${b.id}">${coverHTML(b)}</div>
    <div class="book-main clickable" data-open="${b.id}">
      <div class="book-title">${escapeHTML(b.title)}</div><div class="book-author">${escapeHTML(b.author||"Unknown author")}</div>
      <div class="book-meta">${escapeHTML(b.format||"BOOK")} · ${escapeHTML(b.size||"Local file")} · ${fmtDate(b.updatedAt||Date.now())}</div>
      <div class="progress-wrap"><div class="progress-label"><span>${statusText(b)}</span><span>${Math.round(b.progress||0)}%</span></div><div class="progress-line"><i style="width:${b.progress||0}%"></i></div></div>
    </div>
    <div class="book-actions">
      <button class="action-btn ${b.favorite?"active":""}" data-fav="${b.id}" title="Favorite">${icon("star")}</button>
      <button class="action-btn ${b.status==="to-read"?"active":""}" data-status="${b.id}:to-read" title="To read">${icon("clock")}</button>
      <button class="action-btn ${b.status==="read"?"active":""}" data-status="${b.id}:read" title="Have read">${icon("check")}</button>
      <button class="action-btn" data-menu="${b.id}" title="More">${icon("more")}</button>
    </div></article>`;
}
function gridBookHTML(b){
  return `<article class="grid-book" data-id="${b.id}">
    <div class="clickable" data-open="${b.id}">${coverHTML(b)}</div>
    <div class="book-title clickable" data-open="${b.id}">${escapeHTML(b.title)}</div>
    <div class="book-author">${escapeHTML(b.author||"Unknown author")}</div>
    <div class="progress-line"><i style="width:${b.progress||0}%"></i></div></article>`;
}
function groupedHTML(){
  const active=state.books.filter(b=>!b.trashed); let groups=[];
  if(state.view==="authors"){const m=groupBy(active,b=>b.author||"Unknown author");groups=[...m].map(([name,books])=>({name,subtitle:`${books.length} books`,books}));}
  else if(state.view==="series"){const m=groupBy(active.filter(b=>b.series),b=>b.series);groups=[...m].map(([name,books])=>({name,subtitle:`${books.length} titles`,books}));}
  else if(state.view==="collections"){
    const m=new Map(); active.forEach(b=>(b.collections||[]).forEach(c=>{if(!m.has(c))m.set(c,[]);m.get(c).push(b);}));
    groups=[...m].map(([name,books])=>({name,subtitle:`${books.length} items`,books}));
  } else if(state.view==="formats"){const m=groupBy(active,b=>b.format||"Unknown");groups=[...m].map(([name,books])=>({name,subtitle:`${books.length} files`,books}));}
  else if(state.view==="downloads"){const books=active.filter(b=>b.imported);groups=[{name:"Imported files",subtitle:`${books.length} items`,books}];}
  else groups=[{name:"Browser library",subtitle:"Files are stored locally in IndexedDB",books:active}];
  groups.sort((a,b)=>a.name.localeCompare(b.name));
  return `<div class="section-head"><div><h2>${viewTitle(state)}</h2><p>Organize and browse your library</p></div></div>
  <div class="book-list">${groups.length?groups.map(g=>`
    <article class="book-row clickable" style="min-height:96px;grid-template-columns:58px minmax(0,1fr) auto" data-group="${escapeHTML(g.name)}">
      <div style="width:58px;height:70px;border-radius:9px;background:#dceced;color:#136c78;display:grid;place-items:center">${icon(state.view==="authors"?"person":state.view==="formats"?"stack":"books")}</div>
      <div class="book-main"><div class="book-title">${escapeHTML(g.name)}</div><div class="book-author">${escapeHTML(g.subtitle)}</div><div class="book-meta">${g.books.slice(0,3).map(b=>escapeHTML(b.title)).join(" · ")}</div></div>
      <div class="book-actions">${icon("chevron")}</div>
    </article>`).join(""):'<div class="empty">No groups yet.</div>'}</div>`;
}
