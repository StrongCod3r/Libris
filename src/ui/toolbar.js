
import {state} from "../state.js";
import {icon} from "./icons.js";
import {viewTitle} from "../library/filters.js";

export function topbarHTML(){
  return `<header class="topbar">
    <button class="icon-btn mobile-menu" data-action="open-nav" title="Menu">${icon("menu")}</button>
    <div class="top-title">${viewTitle(state)}</div><div class="top-subtitle">${state.books.filter(b=>!b.trashed).length} items</div>
    <div class="top-spacer"></div>
    <button class="icon-btn" data-action="focus-search" title="Search">${icon("search")}</button>
    <button class="icon-btn" data-action="toggle-display" title="Change view">${icon(state.display==="list"?"grid":"list")}</button>
    <button class="icon-btn" data-action="cycle-sort" title="Sort">${icon("sort")}</button>
    <button class="icon-btn" data-action="app-settings" title="Settings">${icon("settings")}</button>
  </header>`;
}
