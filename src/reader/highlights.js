
import {state} from "../state.js";

export function findHighlightForSelection(ctx){
  const book=state.books.find(x=>x.id===state.reader?.id);
  if(!book)return null;
  const list=book.highlights||[];
  if(ctx.kind==="reflow"){
    return list.find(h=>h.kind==="reflow"&&h.start<ctx.rangeEnd&&h.end>ctx.rangeStart)||null;
  }
  return list.find(h=>h.kind==="pdf"&&pdfHighlightOverlaps(h,ctx.rects))||null;
}

function pdfHighlightOverlaps(highlight,rects){
  for(const a of highlight.rects||[]){
    for(const b of rects||[]){
      if(a.page!==b.page)continue;
      const ix=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
      const iy=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
      if(ix*iy>0.00002)return true;
    }
  }
  return false;
}

export function applyReflowHighlights(book){
  const host=document.querySelector("#reader-page");
  if(!host)return;
  const highlights=(book.highlights||[]).filter(h=>h.kind==="reflow").sort((a,b)=>b.start-a.start);
  for(const h of highlights)wrapTextRange(host,h.start,h.end,h);
}

function wrapTextRange(host,start,end,highlight){
  const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
  const nodes=[];
  let offset=0,node;
  while(node=walker.nextNode()){
    if(node.parentElement?.closest(".reader-highlight"))continue;
    const len=node.nodeValue.length;
    nodes.push({node,start:offset,end:offset+len});
    offset+=len;
  }
  const affected=nodes.filter(n=>n.end>start&&n.start<end);
  for(const entry of affected.reverse()){
    const localStart=Math.max(0,start-entry.start);
    const localEnd=Math.min(entry.node.nodeValue.length,end-entry.start);
    if(localEnd<=localStart)continue;
    const range=document.createRange();
    range.setStart(entry.node,localStart);
    range.setEnd(entry.node,localEnd);
    const mark=document.createElement("mark");
    mark.className="reader-highlight";
    mark.dataset.highlightId=highlight.id;
    mark.style.setProperty("--highlight-color",highlight.color||"#f4d35e");
    range.surroundContents(mark);
  }
}

export function applyPDFHighlightsToPage(book,pageEl,pageNumber){
  const layer=pageEl.querySelector(".pdf-highlight-layer");
  if(!layer)return;
  layer.replaceChildren();
  for(const h of (book.highlights||[]).filter(h=>h.kind==="pdf")){
    for(const r of (h.rects||[]).filter(r=>r.page===pageNumber)){
      const el=document.createElement("div");
      el.className="pdf-highlight-rect";
      el.dataset.highlightId=h.id;
      el.style.left=`${r.x*100}%`;
      el.style.top=`${r.y*100}%`;
      el.style.width=`${r.w*100}%`;
      el.style.height=`${r.h*100}%`;
      el.style.background=h.color||"#f4d35e";
      layer.appendChild(el);
    }
  }
}

export function refreshPDFHighlightsInPlace(book){
  document.querySelectorAll(".pdf-page").forEach(pageEl=>{
    if(!pageEl.querySelector(".pdf-highlight-layer"))return;
    const pageNumber=Number(pageEl.dataset.page||0);
    if(pageNumber>0)applyPDFHighlightsToPage(book,pageEl,pageNumber);
  });
}
