
function dirname(path){return path.includes("/")?path.slice(0,path.lastIndexOf("/")+1):"";}
function normalizePath(path){
  const out=[]; for(const part of path.split("/")){if(!part||part===".")continue;if(part==="..")out.pop();else out.push(part);} return out.join("/");
}
function joinPath(base,rel){return normalizePath(dirname(base)+rel);}
function bytesToText(bytes){return new TextDecoder("utf-8").decode(bytes);}
function bytesToDataURL(bytes,mime="application/octet-stream"){
  const chunk=0x8000; let binary="";
  for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return `data:${mime};base64,${btoa(binary)}`;
}
function mimeFromPath(path){
  const e=path.split(".").pop()?.toLowerCase();
  return ({jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",svg:"image/svg+xml",webp:"image/webp"})[e]||"application/octet-stream";
}
export async function parseEPUB(file){
  if(!window.fflate?.unzipSync)throw new Error("EPUB helper has not loaded yet. Check your internet connection and try again.");
  const zip=window.fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));
  const get=p=>zip[normalizePath(p)];
  const containerBytes=get("META-INF/container.xml");
  if(!containerBytes)throw new Error("Invalid EPUB: container.xml not found.");
  const container=new DOMParser().parseFromString(bytesToText(containerBytes),"application/xml");
  const opfPath=container.querySelector("rootfile")?.getAttribute("full-path");
  if(!opfPath||!get(opfPath))throw new Error("Invalid EPUB: package document not found.");
  const opf=new DOMParser().parseFromString(bytesToText(get(opfPath)),"application/xml");
  const title=opf.querySelector("metadata title, dc\\:title")?.textContent?.trim()||file.name.replace(/\.[^.]+$/,"");
  const author=opf.querySelector("metadata creator, dc\\:creator")?.textContent?.trim()||"Unknown author";
  const manifest={};
  opf.querySelectorAll("manifest item").forEach(item=>{
    manifest[item.getAttribute("id")]={href:item.getAttribute("href"),media:item.getAttribute("media-type"),properties:item.getAttribute("properties")||""};
  });
  const spine=[...opf.querySelectorAll("spine itemref")].map(x=>x.getAttribute("idref")).filter(Boolean);
  let coverData="";
  const coverItem=Object.values(manifest).find(x=>x.properties.includes("cover-image"));
  if(coverItem){const p=joinPath(opfPath,coverItem.href);if(get(p))coverData=bytesToDataURL(get(p),coverItem.media||mimeFromPath(p));}
  const toc=[],parts=[]; let chapterIndex=0;
  for(const id of spine){
    const item=manifest[id]; if(!item?.href)continue;
    const path=joinPath(opfPath,item.href.split("#")[0]); const bytes=get(path); if(!bytes)continue;
    const doc=new DOMParser().parseFromString(bytesToText(bytes),"text/html");
    doc.querySelectorAll("script,style,iframe,object,embed").forEach(el=>el.remove());
    doc.querySelectorAll("[src]").forEach(el=>{
      const src=el.getAttribute("src"); if(!src||/^data:|^https?:/i.test(src))return;
      const asset=joinPath(path,src.split("#")[0]); if(get(asset))el.setAttribute("src",bytesToDataURL(get(asset),mimeFromPath(asset)));
    });
    const heading=doc.querySelector("h1,h2,h3")?.textContent?.trim()||`Chapter ${chapterIndex+1}`;
    const anchor=`chapter-${chapterIndex}`; toc.push({title:heading,anchor});
    parts.push(`<section id="${anchor}" class="epub-chapter">${doc.body.innerHTML}</section>`); chapterIndex++;
  }
  return {title,author,html:parts.join(""),coverData,toc};
}
