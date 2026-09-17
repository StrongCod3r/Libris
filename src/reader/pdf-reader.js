import {escapeHTML} from "../library/filters.js";
import {applyPDFHighlightsToPage} from "./highlights.js";

const PDFJS_VERSION="6.3.289";
const PDFJS_CDN=`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
const PDFJS_DIST=`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;
const PDF_TO_CSS_UNITS=96/72;

let activeLoadingTask=null;
let activePdfDocument=null;
let activeObserver=null;
let pdfAbortController=null;
const activePageViews=new Set();

export function cleanupPDF(){
  try{activeObserver?.disconnect();}catch{}
  activeObserver=null;

  for(const pageView of activePageViews){
    try{pageView.destroy?.();}catch{}
  }
  activePageViews.clear();

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

  const {pdfjsLib,pdfjsViewer}=globalThis;
  if(!pdfjsLib?.getDocument||!pdfjsViewer?.PDFPageView||!pdfjsViewer?.EventBus){
    host.innerHTML='<div class="pdf-error"><strong>PDF.js viewer components could not be loaded.</strong><br>Reload Libris and check the PDF.js CDN connection.</div>';
    return;
  }

  pdfAbortController=new AbortController();
  const {signal}=pdfAbortController;

  try{
    pdfjsLib.GlobalWorkerOptions.workerSrc=`${PDFJS_CDN}/pdf.worker.min.mjs`;

    const data=new Uint8Array(await book.blob.arrayBuffer());
    activeLoadingTask=pdfjsLib.getDocument({
      data,
      cMapUrl:`${PDFJS_DIST}/cmaps/`,
      cMapPacked:true,
      standardFontDataUrl:`${PDFJS_DIST}/standard_fonts/`,
      wasmUrl:`${PDFJS_DIST}/wasm/`,
      enableXfa:true
    });

    const pdf=await activeLoadingTask.promise;
    if(signal.aborted)return;

    activePdfDocument=pdf;

    const firstPage=await pdf.getPage(1);
    if(signal.aborted)return;

    const firstViewport=firstPage.getViewport({scale:1});
    const firstRatio=firstViewport.width/Math.max(1,firstViewport.height);
    const eventBus=new pdfjsViewer.EventBus();

    host.innerHTML="";
    host.classList.add("pdfViewer");
    host.dataset.pdfPages=String(pdf.numPages);

    const shells=[];
    for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
      const shell=document.createElement("div");
      shell.className="pdf-page-shell";
      shell.dataset.page=String(pageNumber);
      shell.style.aspectRatio=String(firstRatio);
      shell.innerHTML=`<div class="pdf-page-loading">Page ${pageNumber}</div>`;
      host.appendChild(shell);
      shells.push(shell);
    }

    const rendered=new Set();

    const renderPage=async shell=>{
      const pageNumber=Number(shell.dataset.page);
      if(rendered.has(pageNumber)||signal.aborted)return;
      rendered.add(pageNumber);

      try{
        const page=pageNumber===1?firstPage:await pdf.getPage(pageNumber);
        if(signal.aborted)return;

        // PDFPageView internally multiplies its scale by PDF_TO_CSS_UNITS.
        // Compute the viewer scale from our desired CSS width so canvas and
        // text layer use the exact same geometry as Mozilla's generic viewer.
        const available=Math.max(280,Math.min(980,host.clientWidth||780));
        const unscaledViewport=page.getViewport({scale:1});
        const viewerScale=available/(unscaledViewport.width*PDF_TO_CSS_UNITS);

        shell.style.aspectRatio="auto";
        shell.style.minHeight=`${Math.round(unscaledViewport.height*viewerScale*PDF_TO_CSS_UNITS)}px`;

        const pageView=new pdfjsViewer.PDFPageView({
          container:shell,
          id:pageNumber,
          scale:viewerScale,
          defaultViewport:page.getViewport({scale:viewerScale}),
          eventBus,
          abortSignal:signal,
          enableAutoLinking:false
        });

        activePageViews.add(pageView);
        pageView.setPdfPage(page);

        pageView.div.classList.add("pdf-page");
        pageView.div.dataset.page=String(pageNumber);

        await pageView.draw();
        if(signal.aborted)return;

        shell.querySelector(".pdf-page-loading")?.remove();
        shell.style.minHeight="";

        const textLayer=pageView.div.querySelector(".textLayer");
        if(textLayer){
          textLayer.classList.add("pdf-text-layer");
          textLayer.dataset.page=String(pageNumber);
          textLayer.setAttribute("aria-label",`Selectable text for PDF page ${pageNumber}`);
        }

        // Libris adds only its persistent highlight layer. Canvas, viewport,
        // text layer, DPI scaling and selection behavior are all owned by
        // PDFPageView/TextLayerBuilder exactly as in the official viewer.
        const highlightLayer=document.createElement("div");
        highlightLayer.className="pdf-highlight-layer";
        highlightLayer.dataset.page=String(pageNumber);

        if(textLayer)textLayer.before(highlightLayer);
        else pageView.div.append(highlightLayer);

        applyPDFHighlightsToPage(book,pageView.div,pageNumber);
      }catch(err){
        if(signal.aborted)return;
        console.error("PDF page render error",err);
        shell.innerHTML=`<div class="pdf-error">Could not render page ${pageNumber}.</div>`;
      }
    };

    if("IntersectionObserver" in window){
      activeObserver=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(entry.isIntersecting){
            renderPage(entry.target);
            activeObserver?.unobserve(entry.target);
          }
        }
      },{
        root:document.querySelector("#pdf-scroll"),
        rootMargin:"900px 0px"
      });

      signal.addEventListener("abort",()=>activeObserver?.disconnect(),{once:true});
      shells.forEach(shell=>activeObserver.observe(shell));
    }else{
      for(const shell of shells.slice(0,8))await renderPage(shell);
    }

    for(const shell of shells.slice(0,3))renderPage(shell);
  }catch(err){
    if(pdfAbortController?.signal.aborted)return;
    console.error("PDF load error",err);
    host.innerHTML=`<div class="pdf-error"><strong>Could not open this PDF.</strong><br>${escapeHTML(err.message||String(err))}</div>`;
  }
}
