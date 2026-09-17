
import {state} from "../state.js";
import {escapeHTML} from "../library/filters.js";

export function removeTranslationPopover(){
  document.querySelector("#translation-popover")?.remove();
}

export async function showTranslationPopover(text){
  removeTranslationPopover();
  const pop=document.createElement("div");
  pop.id="translation-popover";
  pop.className="translation-popover";
  const target=state.readerSettings.translationTarget||"es";
  pop.innerHTML=`<div class="translation-head"><strong>Translation</strong><button type="button" data-close-translation>×</button></div>
    <div class="translation-source">${escapeHTML(text.slice(0,500))}</div>
    <div class="translation-result">Translating…</div>
    <div class="translation-meta">Target: ${escapeHTML(target.toUpperCase())}</div>`;
  document.body.appendChild(pop);
  pop.querySelector("[data-close-translation]").onclick=removeTranslationPopover;

  try{
    const translated=await translateText(text,target);
    const result=pop.querySelector(".translation-result");
    if(result)result.textContent=translated;
  }catch(err){
    const result=pop.querySelector(".translation-result");
    if(result)result.innerHTML=`Translation service unavailable.<br><span class="translation-error">${escapeHTML(err.message||String(err))}</span>`;
  }
}

async function translateText(text,target){
  if(window.Translator?.create){
    const translator=await window.Translator.create({sourceLanguage:"en",targetLanguage:target});
    return await translator.translate(text);
  }

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const url=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text.slice(0,3000))}`;
    const res=await fetch(url,{signal:controller.signal});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    const translated=(data?.[0]||[]).map(x=>x?.[0]||"").join("").trim();
    if(!translated)throw new Error("No translation returned");
    return translated;
  }finally{
    clearTimeout(timer);
  }
}
