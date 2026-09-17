
export const NAV_ITEMS = [
  ["reading","Reading Now","clock"],
  ["all","Books & documents","books"],
  ["favorites","Favorites","star"],
  ["to-read","To Read","clock"],
  ["read","Have Read","check"],
  ["authors","Authors","person"],
  ["series","Series","tag"],
  ["collections","Collections","books"],
  ["formats","Formats","stack"],
  ["folders","Folders","folder"],
  ["downloads","Downloads","download"],
  ["trash","Trash","trash"]
];

export const DEFAULT_SELECTION_MENU = [
  {id:"highlight",visible:true},
  {id:"translate",visible:true},
  {id:"quote",visible:true},
  {id:"note",visible:true},
  {id:"copy",visible:false}
];

export const SELECTION_ACTIONS = {
  highlight:{label:"Highlight"},
  translate:{label:"Translate"},
  quote:{label:"Quote"},
  note:{label:"Note"},
  copy:{label:"Copy"}
};

export const DEFAULT_READER_SETTINGS = {
  theme:"sepia",
  font:"Georgia, serif",
  size:20,
  line:1.65,
  weight:400,
  width:780,
  margin:44,
  align:"left",
  highlightColor:"#f4d35e",
  translationTarget:"es"
};

export const demoBooks = [
  {
    id:"demo-atlas", title:"The Atlas of Quiet Machines", author:"Mara Vale", format:"EPUB", size:"1.2 MB",
    progress:34, favorite:true, status:"reading", series:"Quiet Machines", collections:["Science Fiction"], addedAt:1, updatedAt:Date.now()-40000,
    palette:["#aa4f31","#3b1d21"], description:"A reflective science-fiction travelogue about abandoned machines, orbital stations, and the people who keep listening to their signals.",
    toc:[{title:"A City That Hums",anchor:"atlas-1"},{title:"The Long Receiver",anchor:"atlas-2"},{title:"Night Maintenance",anchor:"atlas-3"}],
    content:`<h1 id="atlas-1">A City That Hums</h1><p>The city did not wake in the morning. It simply changed frequency. At dawn, the ventilation towers exhaled warm air and every window on the eastern arc became a pale square of gold.</p><p>Mira kept a notebook of those changes. She wrote down the things that were too small for the municipal archives: the elevator that sang one note sharp, the public clock that lost exactly four seconds every Tuesday, and the old relay beneath Market Street that answered questions no one had asked.</p><h2 id="atlas-2">The Long Receiver</h2><p>Beyond the final tram station stood a field of antennas. Their metal ribs were black against the afternoon sky. Engineers called it the Long Receiver, though its official name filled three lines on a maintenance form.</p><p>It listened to storms, freight beacons, distant satellites, and sometimes to nothing at all. Mira preferred those empty hours. Silence, she had learned, was rarely empty.</p><h2 id="atlas-3">Night Maintenance</h2><p>At midnight the station lights dimmed to a soft blue. The machines continued their work with the patience of tides. Mira moved between them, checking temperatures and replacing filters, while the city slept behind the glass.</p>`
  },
  {
    id:"demo-dawn", title:"Signals at Dawn", author:"Elias Rowe", format:"PDF", size:"3.8 MB",
    progress:72, favorite:false, status:"reading", series:"", collections:["Research"], addedAt:2, updatedAt:Date.now()-900000,
    palette:["#1e6677","#15293d"], description:"Field notes from a fictional radio observatory, presented as a clean technical document for testing the reader UI.",
    content:`<h1>Signals at Dawn</h1><p>This demo entry uses flowing text inside the browser reader. Import a real PDF to use the browser's native PDF view.</p><h2>Observation 01</h2><p>The first signal arrived twelve minutes before sunrise. It was narrow, stable, and too orderly to be dismissed as ordinary atmospheric noise.</p><h2>Observation 02</h2><p>By the third morning, the team had learned to expect the sequence. What they could not explain was why the source appeared to move when every instrument said it was fixed.</p>`
  },
  {
    id:"demo-ink", title:"Ink & Memory", author:"Nadia Ker", format:"DOCX", size:"648 KB",
    progress:0, favorite:true, status:"to-read", series:"", collections:["Essays"], addedAt:3, updatedAt:Date.now()-2500000,
    palette:["#7b6b4a","#2b302c"], description:"A collection of short essays about reading, annotation, and the memory of physical books.",
    content:`<h1>Ink &amp; Memory</h1><p>Every reader builds a second book around the first one: a book made from pauses, remembered sentences, folded corners, and thoughts written in margins.</p><p>Digital reading changes the material, but not the habit. We still return to passages because they have changed after we have changed.</p>`
  },
  {
    id:"demo-orbit", title:"The Small Orbit", author:"Jun Aster", format:"MOBI", size:"894 KB",
    progress:100, favorite:false, status:"read", series:"Orbit Notes", collections:["Science Fiction"], addedAt:4, updatedAt:Date.now()-9400000,
    palette:["#675596","#27233f"], description:"A compact speculative story designed to demonstrate completed-book states and series grouping.",
    content:`<h1>The Small Orbit</h1><p>On the smallest moon, every journey eventually passed the same crater. It became a landmark, then a meeting place, then a town.</p><p>People who grew up there found the rest of the solar system unsettling. Nothing else came back around so quickly.</p>`
  },
  {
    id:"demo-garden", title:"A Garden in Winter", author:"Clara North", format:"EPUB", size:"1.7 MB",
    progress:15, favorite:false, status:"reading", series:"Seasons", collections:["Fiction"], addedAt:5, updatedAt:Date.now()-12000000,
    palette:["#55725e","#1e3f36"], description:"A quiet novel about a greenhouse kept alive through a long northern winter.",
    content:`<h1>A Garden in Winter</h1><p>Snow covered the roof by November, but inside the greenhouse the lemon tree had new leaves.</p><p>Every morning Ana cleared the glass one panel at a time. By noon there was enough light for the seedlings to turn toward the sun.</p>`
  },
  {
    id:"demo-map", title:"Maps for Places That Move", author:"Ivo Sen", format:"TXT", size:"94 KB",
    progress:0, favorite:false, status:"to-read", series:"", collections:["Design"], addedAt:6, updatedAt:Date.now()-25000000,
    palette:["#b25b49","#552d2c"], description:"Notes on interface design, navigation, and systems whose structure changes while you use them.",
    content:`<h1>Maps for Places That Move</h1><p>A useful map is not a picture of a place. It is an agreement between the traveler and the person who drew it.</p><p>When the place itself can change, the map becomes part of the system. It must explain not only where things are, but what will happen when they move.</p>`
  }
];

export const state = {
  books:[], view:"all", display:"list", query:"", sort:"recent", mobileNav:false,
  modal:null, menu:null, reader:null,
  readerSettings:{...DEFAULT_READER_SETTINGS},
  selectionMenu:DEFAULT_SELECTION_MENU.map(x=>({...x})),
  sidePanel:null, sideTab:"toc", visibleCount:60, importing:false
};
