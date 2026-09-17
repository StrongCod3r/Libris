
import {escapeHTML} from "../library/filters.js";
import {applyPDFHighlightsToPage} from "./highlights.js";

export async function renderPDF(book){
  const host=document.querySelector("#pdf-pages");
  if(!host||!book?.blob)return;

  if(!window.pdfjsLib){
    host.innerHTML='<div class="pdf-error"><strong>PDF.js could not be loaded.</strong><br>Check the connection to the PDF.js CDN, or bundle PDF.js locally for a fully offline build.</div>';
    return;
  }

  try{
    window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const data=new Uint8Array(await book.blob.arrayBuffer());
    const pdf=await window.pdfjsLib.getDocument({data}).promise;
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
      if(rendered.has(pageNumber))return;
      rendered.add(pageNumber);

      try{
        const page=pageNumber===1?first:await pdf.getPage(pageNumber);
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

        const hasOfficialBuilder=!!window.pdfjsViewer?.TextLayerBuilder;
        const textLayerBuilder=hasOfficialBuilder?new window.pdfjsViewer.TextLayerBuilder({}):null;
        const textLayer=textLayerBuilder?.div||document.createElement("div");
        textLayer.classList.add("textLayer","pdf-text-layer");
        textLayer.dataset.page=pageNumber;
        textLayer.style.width=`${cssViewport.width}px`;
        textLayer.style.height=`${cssViewport.height}px`;
        textLayer.style.setProperty("--scale-factor",String(cssViewport.scale));
        textLayer.setAttribute("aria-label",`Selectable text for PDF page ${pageNumber}`);

        pageEl.style.aspectRatio="auto";
        pageEl.style.width=`${cssViewport.width}px`;
        pageEl.style.height=`${cssViewport.height}px`;
        pageEl.style.setProperty("--scale-factor",String(cssViewport.scale));
        pageEl.replaceChildren(canvas,highlightLayer,textLayer);

        const ctx=canvas.getContext("2d",{alpha:false});
        await page.render({canvasContext:ctx,viewport:renderViewport}).promise;
        await renderPDFTextLayer(page,textLayerBuilder,textLayer,cssViewport);
        applyPDFHighlightsToPage(book,pageEl,pageNumber);
      }catch(err){
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
      pageNodes.forEach(node=>observer.observe(node));
    }else{
      for(const node of pageNodes.slice(0,8))await renderPage(node);
    }

    for(const node of pageNodes.slice(0,3))renderPage(node);
  }catch(err){
    console.error("PDF load error",err);
    host.innerHTML=`<div class="pdf-error"><strong>Could not open this PDF.</strong><br>${escapeHTML(err.message||String(err))}</div>`;
  }
}

async function renderPDFTextLayer(page,builder,container,viewport){
  if(builder?.setTextContentSource&&typeof builder.render==="function"){
    const stream=page.streamTextContent({includeMarkedContent:true,disableNormalization:true});
    builder.setTextContentSource(stream);
    await builder.render(viewport);
    return;
  }

  container.replaceChildren();
  const task=window.pdfjsLib.renderTextLayer({
    textContentSource:page.streamTextContent({includeMarkedContent:true,disableNormalization:true}),
    container,viewport,textDivs:[]
  });
  await task.promise;

  const end=document.createElement("div");
  end.className="endOfContent";
  container.append(end);

  container.addEventListener("mousedown",evt=>{
    const marker=container.querySelector(".endOfContent");
    if(!marker)return;
    if(evt.target!==container){
      const bounds=container.getBoundingClientRect();
      const ratio=Math.max(0,(evt.pageY-bounds.top)/Math.max(1,bounds.height));
      marker.style.top=`${(ratio*100).toFixed(2)}%`;
    }
    marker.classList.add("active");
  });

  container.addEventListener("mouseup",()=>{
    const marker=container.querySelector(".endOfContent");
    if(!marker)return;
    marker.style.top="";
    marker.classList.remove("active");
  });
}
