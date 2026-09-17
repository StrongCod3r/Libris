
import {state} from "../state.js";
import {putBook,setKV} from "../storage/db.js";
import {renderSelectionMenu,selectionMenuRowHTML} from "../ui/selection-menu.js";
import {findHighlightForSelection,refreshPDFHighlightsInPlace} from "./highlights.js";
import {showTranslationPopover,removeTranslationPopover} from "./translation.js";

let deps={render:()=>{},toast:()=>{},setReaderSidePanel:()=>{}};
let currentSelectionContext=null;
let selectionMoreOpen=false;
let listenersAbort=null;

export function configureSelection(next){deps={...deps,...next};}

export function removeSelectionTools(){
  document.querySelector("#selection-tools")?.remove();
  selectionMoreOpen=false;
}

export function attachSelectionTools(){
  listenersAbort?.abort();
  listenersAbort=new AbortController();
  const {signal}=listenersAbort;

  const host=document.querySelector("#reader-page")||document.querySelector("#pdf-pages");
  if(!host)return;

  let selectionTimer=null;
  let lastPointerType="mouse";
  let pointerDown=false;

  const schedule=(delay=null)=>{
    clearTimeout(selectionTimer);
    const wait=delay??((lastPointerType==="touch"||lastPointerType==="pen")?220:55);
    selectionTimer=setTimeout(()=>{
      if(pointerDown)return;
      const sel=getSelection();
      const text=sel?.toString().trim();
      removeSelectionTools();
      if(!text||text.length<2||!sel.rangeCount)return;

      const range=sel.getRangeAt(0);
      if(!selectionBelongsToHost(range,host))return;
      const rect=getSelectionVisualRect(range);
      if(!rect||(!rect.width&&!rect.height))return;

      currentSelectionContext=buildSelectionContext(range,text,host);
      currentSelectionContext.existingHighlight=findHighlightForSelection(currentSelectionContext);

      const div=document.createElement("div");
      div.className="selection-tools";
      div.id="selection-tools";
      renderSelectionMenu(div,currentSelectionContext,selectionMoreOpen);
      document.body.appendChild(div);

      // Position only after the menu is in the DOM, so its real dimensions
      // are available. This keeps it anchored above the complete selection
      // instead of overlapping one of the selected lines.
      positionSelectionMenu(div,rect,lastPointerType);

      div.addEventListener("pointerdown",ev=>{ev.preventDefault();ev.stopPropagation();},{signal});
      div.addEventListener("click",ev=>{
        const btn=ev.target.closest("[data-sel],[data-selection-more],[data-customize-menu]");
        if(!btn)return;
        if(btn.dataset.selectionMore!==undefined){
          selectionMoreOpen=!selectionMoreOpen;
          renderSelectionMenu(div,currentSelectionContext,selectionMoreOpen);
          return;
        }
        if(btn.dataset.customizeMenu!==undefined){
          removeSelectionTools();
          removeTranslationPopover();
          deps.setReaderSidePanel("menu-customize");
          return;
        }
        if(btn.dataset.sel)selectionAction(btn.dataset.sel,currentSelectionContext);
      },{signal});
    },wait);
  };

  host.addEventListener("pointerdown",ev=>{
    pointerDown=true;
    lastPointerType=ev.pointerType||"mouse";
    removeSelectionTools();
  },{passive:true,signal});

  host.addEventListener("pointerup",ev=>{
    pointerDown=false;
    lastPointerType=ev.pointerType||lastPointerType;
    schedule();
  },{passive:true,signal});

  host.addEventListener("pointercancel",ev=>{
    pointerDown=false;
    lastPointerType=ev.pointerType||lastPointerType;
    schedule(260);
  },{passive:true,signal});

  host.addEventListener("keyup",ev=>{
    if(ev.shiftKey||["Shift","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(ev.key))schedule(60);
  },{signal});

  document.addEventListener("selectionchange",()=>{
    const sel=getSelection();
    if(!sel?.rangeCount||sel.isCollapsed){removeSelectionTools();return;}
    const range=sel.getRangeAt(0);
    if(!selectionBelongsToHost(range,host))return;
    if(!pointerDown)schedule((lastPointerType==="touch"||lastPointerType==="pen")?260:90);
  },{signal});
}

function getSelectionVisualRect(range){
  const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
  if(!rects.length)return range.getBoundingClientRect();

  // Anchor to the complete visual selection, not to the last selected line.
  // Multi-line PDF selections often consist of many individual span rects.
  const left=Math.min(...rects.map(r=>r.left));
  const right=Math.max(...rects.map(r=>r.right));
  const top=Math.min(...rects.map(r=>r.top));
  const bottom=Math.max(...rects.map(r=>r.bottom));

  return {
    left,
    right,
    top,
    bottom,
    width:right-left,
    height:bottom-top
  };
}

function positionSelectionMenu(menu,rect,pointerType){
  const gap=10;
  const margin=8;
  const viewport=window.visualViewport;
  const viewportLeft=viewport?.offsetLeft||0;
  const viewportTop=viewport?.offsetTop||0;
  const viewportWidth=viewport?.width||innerWidth;
  const viewportHeight=viewport?.height||innerHeight;
  const viewportRight=viewportLeft+viewportWidth;
  const viewportBottom=viewportTop+viewportHeight;

  const menuRect=menu.getBoundingClientRect();
  const menuWidth=menuRect.width;
  const menuHeight=menuRect.height;

  // Center the toolbar above the entire selection.
  const selectionCenter=rect.left+(rect.width/2);
  let left=selectionCenter-(menuWidth/2);
  left=Math.max(
    viewportLeft+margin,
    Math.min(viewportRight-menuWidth-margin,left)
  );

  let top=rect.top-menuHeight-gap;

  // Above is the preferred position. Only move below when there is genuinely
  // not enough viewport space, rather than forcing the toolbar into the text.
  if(top<viewportTop+margin){
    top=rect.bottom+gap;
  }

  // Keep the fallback position visible on very small/mobile viewports.
  if(top+menuHeight>viewportBottom-margin){
    top=Math.max(viewportTop+margin,viewportBottom-menuHeight-margin);
  }

  menu.style.left=`${Math.round(left)}px`;
  menu.style.top=`${Math.round(top)}px`;
  menu.dataset.pointerType=pointerType||"mouse";
}

function buildSelectionContext(range,text,host){
  const progress=getSelectionProgress(range);
  if(host.id==="reader-page"){
    const offsets=getRangeTextOffsets(host,range);
    return {kind:"reflow",text,progress,rangeStart:offsets.start,rangeEnd:offsets.end};
  }
  const rects=getPDFSelectionRects(range);
  return {kind:"pdf",text,progress,rects,pages:[...new Set(rects.map(r=>r.page))]};
}

function getRangeTextOffsets(host,range){
  const pre=document.createRange();
  pre.selectNodeContents(host);
  pre.setEnd(range.startContainer,range.startOffset);
  const start=pre.toString().length;
  return {start,end:start+range.toString().length};
}

function getPDFSelectionRects(range){
  const pages=[...document.querySelectorAll(".pdf-page")].map(page=>({page,box:page.getBoundingClientRect()}));
  const result=[];
  for(const rect of range.getClientRects()){
    if(rect.width<1||rect.height<1)continue;
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const match=pages.find(x=>cx>=x.box.left-1&&cx<=x.box.right+1&&cy>=x.box.top-1&&cy<=x.box.bottom+1);
    if(!match)continue;
    result.push({
      page:+match.page.dataset.page,
      x:(rect.left-match.box.left)/match.box.width,
      y:(rect.top-match.box.top)/match.box.height,
      w:rect.width/match.box.width,
      h:rect.height/match.box.height
    });
  }
  return result;
}

function selectionBelongsToHost(range,host){
  const node=range.commonAncestorContainer.nodeType===Node.ELEMENT_NODE
    ?range.commonAncestorContainer
    :range.commonAncestorContainer.parentElement;
  return !!node&&host.contains(node);
}

function getSelectionProgress(range){
  const book=state.books.find(x=>x.id===state.reader?.id);
  const fallback=book?.progress||0;
  const node=range.commonAncestorContainer.nodeType===Node.ELEMENT_NODE
    ?range.commonAncestorContainer
    :range.commonAncestorContainer.parentElement;
  const page=node?.closest?.(".pdf-page");
  const host=document.querySelector("#pdf-pages");
  const total=Number(host?.dataset.pdfPages||0);
  if(page&&total>0){
    const n=Number(page.dataset.page||1);
    return Math.max(0,Math.min(100,((n-.5)/total)*100));
  }
  return fallback;
}

async function selectionAction(action,ctx){
  const book=state.books.find(x=>x.id===state.reader?.id);
  if(!book||!ctx)return;

  if(action==="highlight"){
    book.highlights=book.highlights||[];
    const existing=findHighlightForSelection(ctx);
    if(existing){
      book.highlights=book.highlights.filter(h=>h.id!==existing.id);
      await putBook(book);
      deps.toast("Highlight removed");
    }else{
      const highlight={
        id:crypto.randomUUID(),kind:ctx.kind,text:ctx.text.slice(0,1500),
        progress:ctx.progress,color:state.readerSettings.highlightColor||"#f4d35e",createdAt:Date.now()
      };
      if(ctx.kind==="reflow"){highlight.start=ctx.rangeStart;highlight.end=ctx.rangeEnd;}
      else highlight.rects=ctx.rects;
      book.highlights.push(highlight);
      await putBook(book);
      deps.toast("Highlighted");
    }

    getSelection()?.removeAllRanges();
    removeSelectionTools();
    if(ctx.kind==="pdf")refreshPDFHighlightsInPlace(book);
    else deps.render(true);
    return;
  }

  if(action==="translate"){
    showTranslationPopover(ctx.text);
    removeSelectionTools();
    return;
  }

  if(action==="copy"){
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(ctx.text);
      else throw new Error("Clipboard API unavailable");
      deps.toast("Copied");
    }catch{
      deps.toast("Text selected — use Ctrl/Cmd+C to copy");
    }
    removeSelectionTools();
    return;
  }

  let note="";
  if(action==="note")note=prompt("Add note:")||"";
  book.quotes=book.quotes||[];
  book.quotes.push({text:ctx.text.slice(0,700),note,progress:ctx.progress,createdAt:Date.now()});
  await putBook(book);
  deps.toast(action==="note"?"Note saved":"Quote saved");
  getSelection()?.removeAllRanges();
  removeSelectionTools();
}

async function saveSelectionMenu(){await setKV("selectionMenu",state.selectionMenu);}

export async function setSelectionMenuVisibility(id,visible){
  const item=state.selectionMenu.find(x=>x.id===id);
  if(!item)return;
  item.visible=visible;
  await saveSelectionMenu();
  refreshSelectionMenuCustomizer();
  refreshFloatingSelectionMenu();
}

export async function moveSelectionMenuItem(id,direction){
  const index=state.selectionMenu.findIndex(x=>x.id===id);
  if(index<0)return;
  const next=Math.max(0,Math.min(state.selectionMenu.length-1,index+direction));
  if(next===index)return;
  const [item]=state.selectionMenu.splice(index,1);
  state.selectionMenu.splice(next,0,item);
  await saveSelectionMenu();
  refreshSelectionMenuCustomizer();
  refreshFloatingSelectionMenu();
}

function refreshSelectionMenuCustomizer(){
  if(state.sidePanel!=="menu-customize")return;
  const container=document.querySelector(".menu-customizer");
  if(!container)return;
  container.innerHTML=state.selectionMenu.map((item,index)=>selectionMenuRowHTML(item,index)).join("");
  container.querySelectorAll("[data-selection-visible]").forEach(el=>{
    el.onchange=()=>setSelectionMenuVisibility(el.dataset.selectionVisible,el.checked);
  });
  container.querySelectorAll("[data-selection-move]").forEach(el=>{
    el.onclick=()=>{const [id,dir]=el.dataset.selectionMove.split(":");moveSelectionMenuItem(id,+dir);};
  });
}

function refreshFloatingSelectionMenu(){
  const floating=document.getElementById("selection-tools");
  if(!floating||!currentSelectionContext)return;
  renderSelectionMenu(floating,currentSelectionContext,selectionMoreOpen);
}
