
import {state} from "../state.js";
import {putBook} from "../storage/db.js";
import {hashColors,formatBytes} from "./filters.js";
import {textToHTML,stripUnsafeHTML} from "../reader/reader.js";
import {parseEPUB} from "../reader/epub-reader.js";

export async function importFiles(files,{render,toast}){
  if(!files.length)return;
  state.importing=true;
  for(const file of files){
    try{
      const ext=file.name.split(".").pop().toLowerCase();
      let title=file.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim();
      let author="Unknown author",content="",coverData="",toc=[],blob=null;

      if(ext==="txt"||ext==="md")content=textToHTML(await file.text());
      else if(ext==="html"||ext==="htm")content=stripUnsafeHTML(await file.text());
      else if(ext==="epub"){
        const parsed=await parseEPUB(file);
        title=parsed.title; author=parsed.author; content=stripUnsafeHTML(parsed.html); coverData=parsed.coverData; toc=parsed.toc;
      }else blob=file;

      const book={
        id:`local-${crypto.randomUUID()}`,title,author,format:ext.toUpperCase(),size:formatBytes(file.size),
        progress:0,favorite:false,status:"to-read",series:"",collections:["Imported"],addedAt:Date.now(),updatedAt:Date.now(),
        imported:true,description:`Imported from ${file.name}. Stored locally in this browser.`,palette:hashColors(title),
        content,coverData,toc,blob,trashed:false,bookmarks:[],quotes:[],highlights:[]
      };

      state.books.push(book);
      await putBook(book);
      toast(`Imported: ${title}`);
    }catch(err){
      console.error(err);
      toast(`Could not import ${file.name}: ${err.message}`);
    }
  }
  state.importing=false;
  state.modal=null;
  state.view="all";
  render();
}
