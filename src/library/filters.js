
export function escapeHTML(str=""){
  return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
export function hashColors(text){
  let h=0; for(const c of text)h=(h*31+c.charCodeAt(0))>>>0;
  const hue=h%360,hue2=(hue+45+(h%70))%360;
  return [`hsl(${hue} 42% 46%)`,`hsl(${hue2} 45% 23%)`];
}
export function fmtDate(ts){return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date(ts));}
export function formatBytes(n){
  if(n<1024)return `${n} B`;
  if(n<1048576)return `${(n/1024).toFixed(0)} KB`;
  return `${(n/1048576).toFixed(1)} MB`;
}
export function getCounts(state){
  const active=state.books.filter(b=>!b.trashed);
  return {
    reading:active.filter(b=>b.status==="reading").length,
    all:active.length,
    favorites:active.filter(b=>b.favorite).length,
    "to-read":active.filter(b=>b.status==="to-read").length,
    read:active.filter(b=>b.status==="read").length,
    trash:state.books.filter(b=>b.trashed).length
  };
}
export function viewTitle(state){
  return ({
    reading:"Reading Now",all:"Books & documents",favorites:"Favorites","to-read":"To Read",read:"Have Read",
    authors:"Authors",series:"Series",collections:"Collections",formats:"Formats",folders:"Folders",downloads:"Downloads",trash:"Trash"
  })[state.view]||"Books & documents";
}
export function navFilter(state){
  let list=state.books.filter(b=>state.view==="trash"?b.trashed:!b.trashed);
  if(state.view==="reading")list=list.filter(b=>b.status==="reading");
  if(state.view==="favorites")list=list.filter(b=>b.favorite);
  if(state.view==="to-read")list=list.filter(b=>b.status==="to-read");
  if(state.view==="read")list=list.filter(b=>b.status==="read");
  if(state.query.trim()){
    const q=state.query.trim().toLowerCase();
    list=list.filter(b=>[b.title,b.author,b.format,b.series,(b.collections||[]).join(" ")].join(" ").toLowerCase().includes(q));
  }
  list.sort((a,b)=>{
    if(state.sort==="title")return a.title.localeCompare(b.title);
    if(state.sort==="author")return (a.author||"").localeCompare(b.author||"");
    if(state.sort==="progress")return (b.progress||0)-(a.progress||0);
    return (b.updatedAt||0)-(a.updatedAt||0);
  });
  return list;
}
export function statusText(book){
  if(book.status==="read")return "Finished";
  if(book.status==="to-read")return "To read";
  return book.progress?"Reading":"Not started";
}
export function groupBy(arr,fn){
  const map=new Map();
  for(const item of arr){const key=fn(item);if(!map.has(key))map.set(key,[]);map.get(key).push(item);}
  return map;
}
