
import {state,SELECTION_ACTIONS} from "../state.js";
import {escapeHTML} from "../library/filters.js";

export function selectionMenuRowHTML(item,index){
  const def=SELECTION_ACTIONS[item.id]||{label:item.id};
  return `<div class="menu-customizer-row">
    <label class="menu-visibility"><input type="checkbox" data-selection-visible="${item.id}" ${item.visible?"checked":""}><span>${escapeHTML(def.label)}</span></label>
    <div class="menu-order-actions">
      <button class="mini-order-btn" data-selection-move="${item.id}:-1" ${index===0?"disabled":""} title="Move up">↑</button>
      <button class="mini-order-btn" data-selection-move="${item.id}:1" ${index===state.selectionMenu.length-1?"disabled":""} title="Move down">↓</button>
    </div>
  </div>`;
}

export function renderSelectionMenu(container,ctx,moreOpen){
  const visible=state.selectionMenu.filter(x=>x.visible);
  const hidden=state.selectionMenu.filter(x=>!x.visible);
  const primary=visible.map(item=>selectionActionButton(item.id,ctx)).join("");
  const hiddenButtons=hidden.map(item=>selectionActionButton(item.id,ctx,true)).join("");
  container.innerHTML=`<div class="selection-primary">${primary}
    <button class="selection-more-btn ${moreOpen?"active":""}" data-selection-more title="More">•••</button>
  </div>
  ${moreOpen?`<div class="selection-more-menu">
    ${hiddenButtons||'<div class="selection-more-empty">All actions are already visible</div>'}
    <button class="selection-more-item customize" data-customize-menu>Customize menu…</button>
  </div>`:""}`;
}

function selectionActionButton(id,ctx,inMore=false){
  let label=SELECTION_ACTIONS[id]?.label||id;
  if(id==="highlight"&&ctx.existingHighlight)label="Remove highlight";
  return `<button class="${inMore?"selection-more-item":""}" data-sel="${id}">${escapeHTML(label)}</button>`;
}
