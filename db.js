
const DB_NAME = "readera-web-db";
const DB_VERSION = 1;
const BOOK_STORE = "books";
const KV_STORE = "kv";

let dbPromise;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(BOOK_STORE)){
        const books = db.createObjectStore(BOOK_STORE,{keyPath:"id"});
        books.createIndex("updatedAt","updatedAt");
        books.createIndex("author","author");
      }
      if(!db.objectStoreNames.contains(KV_STORE)){
        db.createObjectStore(KV_STORE,{keyPath:"key"});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function txDone(tx){
  return new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
}

export async function getBooks(){
  const db = await openDB();
  const tx = db.transaction(BOOK_STORE,"readonly");
  const req = tx.objectStore(BOOK_STORE).getAll();
  return new Promise((resolve,reject)=>{
    req.onsuccess=()=>resolve(req.result || []);
    req.onerror=()=>reject(req.error);
  });
}

export async function putBook(book){
  const db = await openDB();
  const tx = db.transaction(BOOK_STORE,"readwrite");
  tx.objectStore(BOOK_STORE).put(book);
  await txDone(tx);
  return book;
}

export async function putBooks(books){
  const db = await openDB();
  const tx = db.transaction(BOOK_STORE,"readwrite");
  const store = tx.objectStore(BOOK_STORE);
  for(const book of books) store.put(book);
  await txDone(tx);
}

export async function deleteBook(id){
  const db = await openDB();
  const tx = db.transaction(BOOK_STORE,"readwrite");
  tx.objectStore(BOOK_STORE).delete(id);
  await txDone(tx);
}

export async function setKV(key,value){
  const db = await openDB();
  const tx = db.transaction(KV_STORE,"readwrite");
  tx.objectStore(KV_STORE).put({key,value});
  await txDone(tx);
}

export async function getKV(key,fallback=null){
  const db = await openDB();
  const tx = db.transaction(KV_STORE,"readonly");
  const req = tx.objectStore(KV_STORE).get(key);
  return new Promise((resolve,reject)=>{
    req.onsuccess=()=>resolve(req.result?.value ?? fallback);
    req.onerror=()=>reject(req.error);
  });
}
