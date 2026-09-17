const base = new URL('.', import.meta.url);
const parts = await Promise.all([
  'src/app.part01.txt',
  'src/app.part02.txt',
  'src/app.part03.txt',
  'src/app.part04.txt',
  'src/app.part05.txt',
  'src/app.part06.txt'
].map(async path => {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.text();
}));

let source = parts.join('');
source = source
  .replace('from "./db.js"', `from "${new URL('./db.js', base).href}"`)
  .replace('from "./reader.js"', `from "${new URL('./reader.js', base).href}"`);

const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
