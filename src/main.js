
import {state,demoBooks,DEFAULT_READER_SETTINGS,DEFAULT_SELECTION_MENU,SELECTION_ACTIONS} from "./state.js";
import {getBooks,putBook,putBooks,getKV,setKV} from "./storage/db.js";
import {icon} from "./ui/icons.js";
import {sidebarHTML,contentHTML} from "./ui/sidebar.js";
import {topbarHTML} from "./ui/toolbar.js";
import {modalHTML,contextMenuHTML} from "./ui/dialogs.js";
import {readerHTML,readerSideHTML,applyReaderThemeLive,applyReaderSettingsLive,createSpeechController} from "./reader/reader.js";
import {cleanupPDF,renderPDF} from "./reader/pdf-reader.js";
import {applyReflowHighlights} from "./reader/highlights.js";
import {removeTranslationPopover} from "./reader/translation.js";
import {configureSelection,attachSelectionTools,removeSelectionTools,setSelectionMenuVisibility,moveSelectionMenuItem} from "./reader/selection.js";
import {toggleFavorite,setStatus,toggleTrash,openBook as openLibraryBook} from "./library/library.js";
import {importFiles} from "./library/import.js";
import {escapeHTML} from "./library/filters.js";

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const speech=createSpeechController();

let saveProgressTimer=null;
let ttsActive=false;

function shellHTML(){
  return `<div class="app-shell">
    ${sidebarHTML()}
    ${state.mobileNav?'<div class="scrim" data-action="close-nav"></div>':""}
    <main class="main">
      ${topbarHTML()}
      <section class="content">${contentHTML()}</section>
    </main>
    <button class="fab" data-action="import" title="Add books">${icon("plus")}</button>
    ${state.modal?modalHTML():""}
    ${state.menu?contextMenuHTML():""}
    ${state.reader?readerHTML():""}
    <div class="toast-stack" id="toast-stack"></div>
  </div>`;
}

export function render(preserveReaderScroll=false){
  cleanupPDF();
  let progress=0;
  const oldScroll=$("#reader-scroll")||$("#pdf-scroll");
  if(preserveReaderScroll&&oldScroll){
    progress=oldScroll.scrollTop/Math.max(1,oldScroll.scrollHeight-oldScroll.clientHeight);
  }

  document.getElementById("app").innerHTML=shellHTML();
  bindStatic();

  if(!state.reader)return;

  setTimeout(async()=>{
    const book=state.books.find(x=>x.id===state.reader?.id);
    if(!book)return;

    const scroll=$("#reader-scroll");
    if(scroll){
      applyReflowHighlights(book);
      const target=preserveReaderScroll?progress:(book.progress||0)/100;
      scroll.scrollTop=target*Math.max(0,scroll.scrollHeight-scroll.clientHeight);
      attachReaderScroll(scroll,book);
      return;
    }

    const pdfScroll=$("#pdf-scroll");
    if(pdfScroll&&book.blob){
      await renderPDF(book);
      const target=preserveReaderScroll?progress:(book.progress||0)/100;
      pdfScroll.scrollTop=target*Math.max(0,pdfScroll.scrollHeight-pdfScroll.clientHeight);
      attachReaderScroll(pdfScroll,book);
    }
  },0);
}

function bindStatic(){
  $$("#app [data-nav]").forEach(el=>el.onclick=()=>{
    state.view=el.dataset.nav;
    state.mobileNav=false;
    state.query="";
    state.visibleCount=60;
    render();
  });

  $$("[data-action]").forEach(el=>el.onclick=e=>handleAction(el.dataset.action,e));
  $$("[data-open]").forEach(el=>el.onclick=e=>{e.stopPropagation();openLibraryBook(el.dataset.open,render);});
  $$("[data-detail]").forEach(el=>el.onclick=()=>{state.menu=null;state.modal={type:"details",id:el.dataset.detail};render();});
  $$("[data-fav]").forEach(el=>el.onclick=e=>{e.stopPropagation();toggleFavorite(el.dataset.fav,render);});
  $$("[data-status]").forEach(el=>el.onclick=e=>{
    e.stopPropagation();
    const [id,status]=el.dataset.status.split(":");
    setStatus(id,status,render);
  });
  $$("[data-menu]").forEach(el=>el.onclick=e=>{
    e.stopPropagation();
    state.menu={id:el.dataset.menu,x:Math.min(e.clientX,innerWidth-205),y:Math.min(e.clientY,innerHeight-225)};
    render();
  });
  $$("[data-trash]").forEach(el=>el.onclick=()=>toggleTrash(el.dataset.trash,render));
  $$("[data-group]").forEach(el=>el.onclick=()=>{state.query=el.dataset.group;state.view="all";render();});

  bindReaderControls(document);

  const search=$("#library-search");
  if(search)search.oninput=()=>{state.query=search.value;state.visibleCount=60;softRenderLibrary();};

  const input=$("#file-input");
  if(input)input.onchange=()=>importFiles([...input.files],{render,toast});

  const drop=$("#import-drop");
  if(drop){
    ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag");}));
    ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag");}));
    drop.addEventListener("drop",e=>importFiles([...e.dataTransfer.files],{render,toast}));
  }

  const display=$("#default-display");
  if(display)display.onchange=()=>{state.display=display.value;setKV("display",state.display);render();};

  const sort=$("#default-sort");
  if(sort)sort.onchange=()=>{state.sort=sort.value;setKV("sort",state.sort);render();};

  const range=$("#reader-range");
  if(range)range.oninput=()=>jumpProgress(+range.value);

  document.onclick=e=>{
    if(state.menu&&!e.target.closest(".context-menu")&&!e.target.closest("[data-menu]")){
      state.menu=null;
      render();
    }
  };

  attachSelectionTools();
}

function bindReaderControls(root){
  root.querySelectorAll("[data-theme]").forEach(el=>el.onclick=()=>{
    state.readerSettings.theme=el.dataset.theme;
    saveReaderSettings();
    applyReaderThemeLive();
    refreshReaderSidePanel();
  });

  root.querySelectorAll("[data-side-tab]").forEach(el=>el.onclick=()=>{
    state.sideTab=el.dataset.sideTab;
    refreshReaderSidePanel();
  });

  root.querySelectorAll("[data-jump]").forEach(el=>el.onclick=()=>jumpProgress(+el.dataset.jump));
  root.querySelectorAll("[data-anchor]").forEach(el=>el.onclick=()=>jumpAnchor(el.dataset.anchor));

  root.querySelectorAll("[data-reader-setting]").forEach(el=>el.oninput=()=>{
    const key=el.dataset.readerSetting;
    let value=el.value;
    if(["size","weight","width","margin","line"].includes(key))value=+value;
    state.readerSettings[key]=value;
    saveReaderSettings();
    applyReaderSettingsLive();
    if(el.nextElementSibling?.tagName==="SPAN")el.nextElementSibling.textContent=value;
  });

  root.querySelectorAll("[data-selection-visible]").forEach(el=>{
    el.onchange=()=>setSelectionMenuVisibility(el.dataset.selectionVisible,el.checked);
  });

  root.querySelectorAll("[data-selection-move]").forEach(el=>el.onclick=()=>{
    const [id,dir]=el.dataset.selectionMove.split(":");
    moveSelectionMenuItem(id,+dir);
  });
}

function softRenderLibrary(){
  const content=$(".content");
  if(!content)return render();
  const scrollTop=content.scrollTop;
  content.innerHTML=contentHTML();
  content.scrollTop=scrollTop;
  bindContentOnly();
}

function bindContentOnly(){
  $$("[data-open]").forEach(el=>el.onclick=()=>openLibraryBook(el.dataset.open,render));
  $$("[data-fav]").forEach(el=>el.onclick=e=>{e.stopPropagation();toggleFavorite(el.dataset.fav,render);});
  $$("[data-status]").forEach(el=>el.onclick=e=>{
    e.stopPropagation();
    const [id,status]=el.dataset.status.split(":");
    setStatus(id,status,render);
  });
  $$("[data-menu]").forEach(el=>el.onclick=e=>{
    e.stopPropagation();
    state.menu={id:el.dataset.menu,x:Math.min(e.clientX,innerWidth-205),y:Math.min(e.clientY,innerHeight-225)};
    render();
  });
  const search=$("#library-search");
  if(search){
    search.focus();
    search.setSelectionRange(search.value.length,search.value.length);
    search.oninput=()=>{state.query=search.value;softRenderLibrary();};
  }
}

export function setReaderSidePanel(panel){
  state.sidePanel=panel;
  const wrap=document.querySelector(".reader-content-wrap");
  if(!wrap)return;

  const existing=wrap.querySelector(".reader-side");
  if(!panel){existing?.remove();return;}

  const book=state.books.find(x=>x.id===state.reader?.id);
  if(!book)return;

  const holder=document.createElement("div");
  holder.innerHTML=readerSideHTML(book).trim();
  const next=holder.firstElementChild;
  if(!next)return;

  if(existing)existing.replaceWith(next);
  else wrap.appendChild(next);

  next.querySelectorAll("[data-action]").forEach(el=>el.onclick=e=>handleAction(el.dataset.action,e));
  bindReaderControls(next);
}

function refreshReaderSidePanel(){
  if(!state.sidePanel)return;
  setReaderSidePanel(state.sidePanel);
}

function handleAction(action){
  if(action==="open-nav"){state.mobileNav=true;render();return;}
  if(action==="close-nav"){state.mobileNav=false;render();return;}
  if(action==="focus-search"){$("#library-search")?.focus();return;}
  if(action==="toggle-display"){
    state.display=state.display==="list"?"grid":"list";
    setKV("display",state.display);render();return;
  }
  if(action==="cycle-sort"){
    const opts=["recent","title","author","progress"];
    state.sort=opts[(opts.indexOf(state.sort)+1)%opts.length];
    setKV("sort",state.sort);toast(`Sorted by ${state.sort}`);render();return;
  }
  if(action==="import"){state.modal={type:"import"};render();return;}
  if(action==="close-modal"){state.modal=null;render();return;}
  if(action==="app-settings"){state.modal={type:"settings"};render();return;}
  if(action==="load-more"){state.visibleCount+=60;render();return;}
  if(action==="close-reader"){closeReader();return;}

  if(action==="reader-settings"){
    if(state.sidePanel==="menu-customize")setReaderSidePanel("settings");
    else setReaderSidePanel(state.sidePanel==="settings"?null:"settings");
    return;
  }

  if(action==="customize-selection-menu"){
    removeSelectionTools();
    removeTranslationPopover();
    setReaderSidePanel("menu-customize");
    return;
  }

  if(action==="reader-nav"){setReaderSidePanel(state.sidePanel==="nav"?null:"nav");return;}
  if(action==="close-side"){setReaderSidePanel(null);return;}
  if(action==="bookmark"){toggleBookmark();return;}
  if(action==="tts"){toggleTTS();return;}
  if(action==="reader-search"){readerSearch();}
}

function closeReader(){
  cleanupPDF();
  speech.stop();
  ttsActive=false;
  state.reader=null;
  state.sidePanel=null;
  removeSelectionTools();
  removeTranslationPopover();
  render();
}

function attachReaderScroll(scroll,book){
  scroll.addEventListener("scroll",()=>{
    const max=Math.max(1,scroll.scrollHeight-scroll.clientHeight);
    const progress=Math.max(0,Math.min(100,scroll.scrollTop/max*100));
    book.progress=progress;
    const range=$("#reader-range"); if(range)range.value=progress;
    const indicator=$(".page-indicator"); if(indicator)indicator.textContent=`${Math.round(progress)}%`;
    clearTimeout(saveProgressTimer);
    saveProgressTimer=setTimeout(()=>{book.updatedAt=Date.now();putBook(book);},400);
  },{passive:true});
}

function jumpProgress(progress){
  const book=state.books.find(x=>x.id===state.reader?.id);
  if(!book)return;
  book.progress=Math.max(0,Math.min(100,progress));
  const scroll=$("#reader-scroll")||$("#pdf-scroll");
  if(scroll)scroll.scrollTop=(book.progress/100)*Math.max(0,scroll.scrollHeight-scroll.clientHeight);
  putBook(book);
}

function jumpAnchor(id){
  setReaderSidePanel(null);
  setTimeout(()=>{
    if(id)document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
  },20);
}

async function toggleBookmark(){
  const book=state.books.find(x=>x.id===state.reader?.id);
  if(!book)return;
  const progress=Math.round(book.progress||0);
  book.bookmarks=book.bookmarks||[];
  const index=book.bookmarks.findIndex(x=>Math.abs(x.progress-progress)<=1);
  if(index>=0){book.bookmarks.splice(index,1);toast("Bookmark removed");}
  else{book.bookmarks.push({progress,label:`Position ${progress}%`,createdAt:Date.now()});toast("Bookmark added");}
  await putBook(book);
  render(true);
}

function toggleTTS(){
  if(ttsActive){speech.stop();ttsActive=false;toast("Read aloud stopped");return;}
  const page=$("#reader-page");
  if(!page){toast("Read aloud is currently available for reflowable text.");return;}
  speech.speak(page.innerText.slice(0,25000));
  ttsActive=true;
  toast("Reading aloud");
}

function readerSearch(){
  const term=prompt("Find in this book:");
  if(!term)return;
  const page=$("#reader-page");
  if(!page)return;

  const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
  const needle=term.toLowerCase();
  let node;
  while((node=walker.nextNode())){
    const index=node.nodeValue.toLowerCase().indexOf(needle);
    if(index<0)continue;
    const range=document.createRange();
    range.setStart(node,index);
    range.setEnd(node,index+term.length);
    const selection=getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    range.startContainer.parentElement?.scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  toast("No match found");
}

function saveReaderSettings(){setKV("readerSettings",state.readerSettings);}

export function toast(message){
  let stack=$("#toast-stack");
  if(!stack){
    stack=document.createElement("div");
    stack.className="toast-stack";
    stack.id="toast-stack";
    document.body.appendChild(stack);
  }
  const el=document.createElement("div");
  el.className="toast";
  el.textContent=message;
  stack.appendChild(el);
  setTimeout(()=>el.remove(),2400);
}

configureSelection({render,toast,setReaderSidePanel});

document.addEventListener("keydown",event=>{
  const editing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||"");
  if(event.key==="/"&&!editing){
    event.preventDefault();
    $("#library-search")?.focus();
  }

  if(event.key==="Escape"){
    if(state.reader){
      if(state.sidePanel)setReaderSidePanel(null);
      else closeReader();
    }else if(state.modal||state.menu||state.mobileNav){
      state.modal=null;state.menu=null;state.mobileNav=false;render();
    }
  }

  if(state.reader&&!editing){
    const scroll=$("#reader-scroll")||$("#pdf-scroll");
    if(event.key==="ArrowDown"||event.key==="PageDown")scroll?.scrollBy({top:innerHeight*.72,behavior:"smooth"});
    if(event.key==="ArrowUp"||event.key==="PageUp")scroll?.scrollBy({top:-innerHeight*.72,behavior:"smooth"});
  }
});

async function init(){
  state.display=await getKV("display","list");
  state.sort=await getKV("sort","recent");
  state.readerSettings={...DEFAULT_READER_SETTINGS,...(await getKV("readerSettings",{}))};

  const storedMenu=await getKV("selectionMenu",null);
  if(Array.isArray(storedMenu)){
    const byId=new Map(storedMenu.map(x=>[x.id,x]));
    state.selectionMenu=[
      ...storedMenu.filter(x=>SELECTION_ACTIONS[x.id]).map(x=>({id:x.id,visible:x.visible!==false})),
      ...DEFAULT_SELECTION_MENU.filter(x=>!byId.has(x.id)).map(x=>({...x}))
    ];
  }

  state.books=await getBooks();
  if(!state.books.length){
    await putBooks(demoBooks);
    state.books=await getBooks();
  }
  render();
}

init().catch(err=>{
  console.error(err);
  document.getElementById("app").innerHTML=`<div style="padding:30px;font-family:system-ui"><h2>Could not start the local library</h2><pre>${escapeHTML(err.stack||err.message)}</pre></div>`;
});
