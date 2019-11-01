import { parse } from 'qs';
import { writable } from 'svelte/store';

export const qsparse = (search) => {
  return parse(search, {
    ignoreQueryPrefix: true,
    plainObjects: true
  })
}

export function which(event) {
  return event.which === null ? event.button : event.which;
}

export function find_anchor(node) {
  while (node && node.nodeName.toUpperCase() !== 'A')
    node = node.parentNode; // SVG <a> elements have a lowercase name
  return node;
}

export function debounce(callback, time = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => callback(...args), time)
  }
}

export function get_href(node) {
  // check if link is inside an svg
  // in this case, both href and target are always inside an object
  const svg = typeof node.href === 'object' && node.href.constructor.name === 'SVGAnimatedString';
  return String(svg ? (node).href.baseVal : node.href);
}
