
const icons = {
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m4 13 4 4L20 5"/><path d="m9 13 3 3 7-8"/>',
  books:'<path d="M5 4h4v16H5zM10 4h4v16h-4zM15 6h4v14h-4z"/>',
  person:'<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-4 3-6 7-6s6.2 2 7 6"/>',
  tag:'<path d="M3 12V5h7l11 11-5 5z"/><circle cx="7.5" cy="8.5" r="1"/>',
  stack:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  folder:'<path d="M3 6h7l2 2h9v11H3z"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M4 20h16"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.6-.7-1.6 1-1.8-2.1-2.1-1.8 1-1.6-.7-.6-2h-3l-.6 2-1.6.7-1.8-1L2.1 6.5l1 1.8-.7 1.6-2 .6v3l2 .6.7 1.6-1 1.8 2.1 2.1 1.8-1 1.6.7.6 2h3l.6-2 1.6-.7 1.8 1 2.1-2.1-1-1.8.7-1.6z"/>',
  more:'<circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>',
  grid:'<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 20h16"/>',
  bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
  quote:'<path d="M5 7h6v6H7c0 2 1 3 3 4M14 7h6v6h-4c0 2 1 3 3 4"/>',
  speaker:'<path d="M4 10v4h4l5 4V6l-5 4z"/><path d="M16 9c1 1 1 5 0 6M19 7c3 3 3 7 0 10"/>',
  back:'<path d="m15 5-7 7 7 7"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  tune:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7h.01"/>',
  read:'<path d="M3 6c4-2 7-1 9 1v13c-2-2-5-3-9-1zM21 6c-4-2-7-1-9 1v13c2-2 5-3 9-1z"/>',
  chevron:'<path d="m9 6 6 6-6 6"/>',
  sort:'<path d="M8 6h12M8 12h8M8 18h4M4 4v16"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',
  stop:'<rect x="6" y="6" width="12" height="12"/>',
  edit:'<path d="m4 20 4.5-1 10-10-3.5-3.5-10 10zM14 6.5l3.5 3.5"/>'
};
export function icon(name,cls=""){
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.books}</svg>`;
}
