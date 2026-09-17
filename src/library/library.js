
import {state} from "../state.js";
import {putBook} from "../storage/db.js";

export async function toggleFavorite(id,render){
  const book=state.books.find(x=>x.id===id); if(!book)return;
  book.favorite=!book.favorite; book.updatedAt=Date.now();
  await putBook(book); render();
}

export async function setStatus(id,status,render){
  const book=state.books.find(x=>x.id===id); if(!book)return;
  book.status=book.status===status?(book.progress>0?"reading":"to-read"):status;
  if(status==="read")book.progress=100;
  book.updatedAt=Date.now();
  await putBook(book); render();
}

export async function toggleTrash(id,render){
  const book=state.books.find(x=>x.id===id); if(!book)return;
  book.trashed=!book.trashed; book.updatedAt=Date.now();
  await putBook(book); state.menu=null; render();
}

export function openBook(id,render){
  const book=state.books.find(x=>x.id===id); if(!book)return;
  state.modal=null; state.menu=null; state.reader={id}; state.sidePanel=null;
  book.status=book.status==="to-read"?"reading":book.status;
  book.updatedAt=Date.now();
  putBook(book);
  render();
}
