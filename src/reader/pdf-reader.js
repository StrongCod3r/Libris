import {escapeHTML} from "../library/filters.js";
import {applyPDFHighlightsToPage} from "./highlights.js";

const PDFJS_VERSION="6.3.289";
const PDFJS_CDN=`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
const PDFJS_DIST=`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;

let activeLoadingTask=null;
let activePdfDocument=null;
let activeTextLayerBuilders=new Set();
let pdfAbortController=null;

export function cleanupPDF(){
  for(const builder of activeTextLayerBuilders){
    try{builder.cancel?.();}catch{}
  }
  activeTextLayerBuilders.clear();

  try{pdfAbortController?.abort();}catch{}
  pdfAbortController=null;

  try{activeLoadingTask?.destroy?.();}catch{}
  activeLoadingTask=null;

  try{activePdfDocument?.destroy?.();}catch{}
  activePdfDocument=null;
}

export async function renderPDF(book){
  const host=document.querySelector("#pdf-pages");
  if(!host||!book?.blob)return;

  cleanupPDF();

  if(!window.pdfjsLib||!window.pdfjsViewer?.TextLayerBuilder){
    host.innerHTML='<div class="pdf-error"><strong>PDF.js could not be loaded.</strong><br>Check the PDF.js CDN connection and reload Libris.</div>';
    return;
  }

  pdfAbortController=new AbortController();

  try{
    window.pdfjsLib.GlobalWorkerOptions.workerSrc=`${PDFJS_CDN}/pdf.worker.min.mjs`;

    const data=new Uint8Array(await book.blob.arrayBuffer());
    activeLoadingTask=window.pdfjsLib.getDocument({
      data,
      cMapUrl:`${PDFJS_DIST}/cmaps/`,
      cMapPacked:true,
      standardFontDataUrl:`${PDFJS_DIST}/standard_fonts/`,
      wasmUrl:`${PDFJS_DIST}/wasm/`
    });

    const pdf=await activeLoadingTask.promise;
    activePdfDocument=pdf;

    const first=await pdf.getPage(1);
    const baseViewport=first.getViewport({scale:1});
    const ratio=baseViewport.height/Math.max(1,baseViewport.width);

    host.innerHTML="";
    host.dataset.pdfPages=String(pdf.numPages);
    const pageNodes=[];

    for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
      const pageEl=document.createElement("div");
      pageEl.className="pdf-page";
      pageEl.dataset.page=pageNumber;
      pageEl.style.aspectRatio=`1 / ${ratio}`;
      pageEl.innerHTML=`<div class="pdf-page-loading">Page ${pageNumber}</div>`;
      host.appendChild(pageEl);
      pageNodes.push(pageEl);
    }

    const rendered=new Set();

    const renderPage=async pageEl=>{
      const pageNumber=+pageEl.dataset.page;
      if(rendered.has(pageNumber)||pdfAbortController?.signal.aborted)return;
      rendered.add(pageNumber);

      try{
        const page=pageNumber===1?first:await pdf.getPage(pageNumber);
        if(pdfAbortController?.signal.aborted)return;

        const available=Math.max(280,Math.min(980,host.clientWidth||780));
        const base=page.getViewport({scale:1});
        const cssScale=available/base.width;
        const cssViewport=page.getViewport({scale:cssScale});
        const dpr=Math.min(window.devicePixelRatio||1,2);
        const renderViewport=page.getViewport({scale:cssScale*dpr});

        const canvas=document.createElement("canvas");
        canvas.width=Math.floor(renderViewport.width);
        canvas.height=Math.floor(renderViewport.height);
        canvas.setAttribute("aria-hidden","true");

        const highlightLayer=document.createElement("div");
        highlightLayer.className="pdf-highlight-layer";
        highlightLayer.dataset.page=pageNumber;

        // Use the same modern TextLayerBuilder used by the PDF.js viewer.
        // It installs PDF.js' document-level selectionchange/pointer handling,
        // including dynamic endOfContent repositioning over whitespace.
        const textLayerBuilder=new window.pdfjsViewer.TextLayerBuilder({
          pdfPage:page,
          abortSignal:pdfAbortController.signal
        });
        activeTextLayerBuilders.add(textLayerBuilder);

        const textLayer=textLayerBuilder.div;
        textLayer.classList.add("pdf-text-layer");
        textLayer.dataset.page=pageNumber;
        textLayer.setAttribute("aria-label",`Selectable text for PDF page ${pageNumber}`);

        pageEl.style.aspectRatio="auto";
        pageEl.style.width=`${cssViewport.width}px`;
        pageEl.style.height=`${cssViewport.height}px`;
        pageEl.replaceChildren(canvas,highlightLayer,textLayer);

        const ctx=canvas.getContext("2d",{alpha:false});

        await Promise.all([
          page.render({canvasContext:ctx,viewport:renderViewport}).promise,
          textLayerBuilder.render({
            viewport:cssViewport,
            images:null,
            textContentParams:{
              includeMarkedContent:true,
              disableNormalization:true
            }
          })
        ]);

        if(pdfAbortController?.signal.aborted)return;
        applyPDFHighlightsToPage(book,pageEl,pageNumber);
      }catch(err){
        if(pdfAbortController?.signal.aborted)return;
        console.error("PDF page render error",err);
        pageEl.innerHTML=`<div class="pdf-error">Could not render page ${pageNumber}.</div>`;
      }
    };

    if("IntersectionObserver" in window){
      const observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(entry.isIntersecting){
            renderPage(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },{root:document.querySelector("#pdf-scroll"),rootMargin:"900px 0px"});

      pdfAbortController.signal.addEventListener("abort",()=>observer.disconnect(),{once:true});
      pageNodes.forEach(node=>observer.observe(node));
    }else{
      for(const node of pageNodes.slice(0,8))await renderPage(node);
    }

    for(const node of pageNodes.slice(0,3))renderPage(node);
  }catch(err){
    if(pdfAbortController?.signal.aborted)return;
    console.error("PDF load error",err);
    host.innerHTML=`<div class="pdf-error"><strong>Could not open this PDF.</strong><br>${escapeHTML(err.message||String(err))}</div>`;
  }
}
