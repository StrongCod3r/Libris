
import {state} from "../state.js";
import {icon} from "../ui/icons.js";
import {escapeHTML} from "../library/filters.js";
import {selectionMenuRowHTML} from "../ui/selection-menu.js";

export function textToHTML(text=""){
  const normalized=text.replace(/\r\n/g,"\n");
  return normalized.split(/\n{2,}/).map(block=>{
    const clean=escapeHTML(block.trim()).replace(/\n/g,"<br>");
    if(/^#{1,3}\s/.test(block)){
      const level=Math.min(3,(block.match(/^#+/)||["#"])[0].length);
      return `<h${level}>${clean.replace(/^#{1,3}\s*/,"")}</h${level}>`;
    }
    return clean?`<p>${clean}</p>`:"";
  }).join("");
}

export function stripUnsafeHTML(html=""){
  const doc=new DOMParser().parseFromString(html,"text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form,input,button,link,meta").forEach(el=>el.remove());
  doc.querySelectorAll("*").forEach(el=>{
    [...el.attributes].forEach(attr=>{
      if(/^on/i.test(attr.name))el.removeAttribute(attr.name);
      if(["src","href"].includes(attr.name)&&/^\s*javascript:/i.test(attr.value))el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
}

export function createSpeechController(){
  let utterance=null;
  return {
    speak(text,rate=1){
      speechSynthesis.cancel();
      utterance=new SpeechSynthesisUtterance(text);
      utterance.rate=rate;
      speechSynthesis.speak(utterance);
    },
    stop(){speechSynthesis.cancel();utterance=null;},
    pause(){speechSynthesis.pause();},
    resume(){speechSynthesis.resume();}
  };
}

export function readerHTML(){
  const book=state.books.find(x=>x.id===state.reader?.id);
  if(!book)return "";
  const s=state.readerSettings;
  const isPdf=!!book.blob&&(book.format||"").toUpperCase()==="PDF";
  return `<div class="reader reader-${s.theme}" data-reader-id="${book.id}">
    <div class="reader-toolbar">
      <button class="icon-btn" data-action="close-reader" title="Back">${icon("back")}</button>
      <div class="reader-title"><strong>${escapeHTML(book.title)}</strong><span>${escapeHTML(book.author||"Unknown author")}</span></div>
      <div class="reader-space"></div>
      <button class="icon-btn reader-hide-small" data-action="reader-search" title="Find">${icon("search")}</button>
      <button class="icon-btn" data-action="reader-nav" title="Contents & bookmarks">${icon("list")}</button>
      <button class="icon-btn" data-action="tts" title="Read aloud">${icon("speaker")}</button>
      <button class="icon-btn" data-action="reader-settings" title="Reading settings">${icon("tune")}</button>
      <button class="icon-btn ${hasBookmarkAt(book,Math.round(book.progress||0))?"active":""}" data-action="bookmark" title="Bookmark">${icon("bookmark")}</button>
    </div>
    <div class="reader-content-wrap">
      ${isPdf
        ? `<div class="pdf-scroll" id="pdf-scroll"><div class="pdf-pages" id="pdf-pages"><div class="pdf-error" style="color:#52666a">Loading PDF…</div></div></div>`
        : `<div class="reader-scroll" id="reader-scroll"><article class="reader-page" id="reader-page" style="--reader-width:${s.width}px;--reader-margin:${s.margin}px;--reader-font:${s.font};--reader-size:${s.size}px;--reader-line:${s.line};--reader-weight:${s.weight};--reader-align:${s.align}">${book.content||"<p>This format is stored in your library, but Libris does not yet extract its text.</p>"}</article></div>`}
      ${state.sidePanel?readerSideHTML(book):""}
    </div>
    <div class="reader-bottom"><span style="font-size:11px">0%</span><input id="reader-range" type="range" min="0" max="100" step=".1" value="${book.progress||0}"><span class="page-indicator">${Math.round(book.progress||0)}%</span></div>
  </div>`;
}

export function hasBookmarkAt(book,progress){
  return (book.bookmarks||[]).some(x=>Math.abs(x.progress-progress)<=1);
}

export function readerSideHTML(book){
  if(state.sidePanel==="settings"){
    const s=state.readerSettings;
    return `<aside class="reader-side"><div class="reader-side-head"><h3>Reading settings</h3><div class="top-spacer"></div><button class="icon-btn" data-action="close-side">${icon("close")}</button></div>
      <div class="reader-side-body">
        <div class="settings-section"><div class="settings-label">Color mode</div><div class="theme-row">${["day","night","sepia","twilight","console"].map(t=>`<button class="theme-dot t-${t} ${s.theme===t?"active":""}" data-theme="${t}" title="${t}"></button>`).join("")}</div></div>
        <div class="settings-section"><div class="settings-label">Typography</div>
          <div class="setting-row"><label>Font</label><select data-reader-setting="font"><option value="Georgia, serif" ${s.font.startsWith("Georgia")?"selected":""}>Georgia</option><option value="system-ui, sans-serif" ${s.font.startsWith("system")?"selected":""}>System</option><option value="'Trebuchet MS', sans-serif" ${s.font.startsWith("'Trebuchet")?"selected":""}>Trebuchet</option><option value="'Courier New', monospace" ${s.font.startsWith("'Courier")?"selected":""}>Courier</option></select></div>
          ${sliderSetting("size","Font size",s.size,13,36,1)}
          ${sliderSetting("weight","Thickness",s.weight,300,800,100)}
          ${sliderSetting("line","Line spacing",s.line,1.2,2.2,.05)}
        </div>
        <div class="settings-section"><div class="settings-label">Page</div>
          ${sliderSetting("width","Text width",s.width,480,1100,20)}
          ${sliderSetting("margin","Top margin",s.margin,18,100,2)}
          <div class="setting-row"><label>Alignment</label><select data-reader-setting="align"><option value="left" ${s.align==="left"?"selected":""}>Left</option><option value="justify" ${s.align==="justify"?"selected":""}>Justify</option><option value="center" ${s.align==="center"?"selected":""}>Center</option></select></div>
        </div>
        <div class="settings-section"><div class="settings-label">Selection tools</div>
          <div class="setting-row"><label>Highlight color</label><input class="highlight-color-input" type="color" value="${escapeHTML(s.highlightColor||"#f4d35e")}" data-reader-setting="highlightColor"><span class="color-value">${escapeHTML(s.highlightColor||"#f4d35e")}</span></div>
          <div class="setting-row"><label>Translate to</label><select data-reader-setting="translationTarget">
            <option value="es" ${s.translationTarget==="es"?"selected":""}>Spanish</option>
            <option value="en" ${s.translationTarget==="en"?"selected":""}>English</option>
            <option value="fr" ${s.translationTarget==="fr"?"selected":""}>French</option>
            <option value="de" ${s.translationTarget==="de"?"selected":""}>German</option>
            <option value="it" ${s.translationTarget==="it"?"selected":""}>Italian</option>
            <option value="pt" ${s.translationTarget==="pt"?"selected":""}>Portuguese</option>
          </select></div>
          <button class="secondary-btn" data-action="customize-selection-menu">${icon("more")} Customize selection menu</button>
        </div>
      </div></aside>`;
  }

  if(state.sidePanel==="menu-customize"){
    return `<aside class="reader-side"><div class="reader-side-head"><button class="icon-btn" data-action="reader-settings" title="Back">${icon("back")}</button><h3>Customize selection menu</h3><div class="top-spacer"></div><button class="icon-btn" data-action="close-side">${icon("close")}</button></div>
      <div class="reader-side-body">
        <p class="customize-help">Choose which actions are visible in the floating selection bar and change their order. Hidden actions remain available under the <strong>⋯</strong> menu.</p>
        <div class="menu-customizer">${state.selectionMenu.map((item,index)=>selectionMenuRowHTML(item,index)).join("")}</div>
        <div class="customize-more-note"><strong>⋯ More</strong> is always visible so hidden actions and menu customization remain accessible.</div>
      </div></aside>`;
  }

  return `<aside class="reader-side"><div class="reader-side-head"><h3>Navigation</h3><div class="top-spacer"></div><button class="icon-btn" data-action="close-side">${icon("close")}</button></div>
    <div class="reader-side-body">
      <div class="side-tabs"><button data-side-tab="toc" class="${state.sideTab==="toc"?"active":""}">Contents</button><button data-side-tab="bookmarks" class="${state.sideTab==="bookmarks"?"active":""}">Bookmarks</button><button data-side-tab="quotes" class="${state.sideTab==="quotes"?"active":""}">Quotes</button></div>
      ${sideTabHTML(book)}
    </div></aside>`;
}

function sliderSetting(key,label,val,min,max,step){
  return `<div class="setting-row"><label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-reader-setting="${key}"><span style="font-size:11px;min-width:34px;text-align:right">${val}</span></div>`;
}

function sideTabHTML(book){
  if(state.sideTab==="bookmarks"){
    const arr=book.bookmarks||[];
    return arr.length?arr.map(x=>`<button class="bookmark-item" style="width:100%;text-align:left" data-jump="${x.progress}"><strong>${Math.round(x.progress)}%</strong><span>${escapeHTML(x.label||"Bookmark")}</span></button>`).join(""):'<div class="empty">No bookmarks yet.</div>';
  }
  if(state.sideTab==="quotes"){
    const arr=book.quotes||[];
    return arr.length?arr.map(x=>`<div class="quote-item"><strong>“${escapeHTML(x.text)}”</strong><span>${Math.round(x.progress)}%${x.note?` · ${escapeHTML(x.note)}`:""}</span></div>`).join(""):'<div class="empty">Select text in the reader to save a quote.</div>';
  }
  const toc=book.toc?.length?book.toc:inferTOC(book.content);
  return toc.length?toc.map((x,i)=>`<button class="toc-item" style="width:100%;text-align:left" data-anchor="${escapeHTML(x.anchor||"")}"><strong>${escapeHTML(x.title)}</strong><span>Section ${i+1}</span></button>`).join(""):'<div class="empty">No table of contents found.</div>';
}

export function inferTOC(html=""){
  const doc=new DOMParser().parseFromString(html,"text/html");
  return [...doc.querySelectorAll("h1,h2")].map(h=>({title:h.textContent.trim(),anchor:h.id||""}));
}

export function applyReaderThemeLive(){
  const reader=document.querySelector(".reader");
  if(!reader)return;
  reader.classList.remove("reader-day","reader-night","reader-sepia","reader-twilight","reader-console");
  reader.classList.add(`reader-${state.readerSettings.theme}`);
}

export function applyReaderSettingsLive(){
  const page=document.querySelector("#reader-page");
  if(!page)return;
  const s=state.readerSettings;
  page.style.setProperty("--reader-width",`${s.width}px`);
  page.style.setProperty("--reader-margin",`${s.margin}px`);
  page.style.setProperty("--reader-font",s.font);
  page.style.setProperty("--reader-size",`${s.size}px`);
  page.style.setProperty("--reader-line",s.line);
  page.style.setProperty("--reader-weight",s.weight);
  page.style.setProperty("--reader-align",s.align);
}
