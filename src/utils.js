import { parse } from 'qs';

export const qsparse = (search) => {
  return parse(search, {
    ignoreQueryPrefix: true,
    plainObjects: true
  })
}

function which(event) {
  return event.which === null ? event.button : event.which;
}

export function find_anchor(node) {
  while (node && node.nodeName.toUpperCase() !== 'A')
    node = node.parentNode; // SVG <a> elements have a lowercase name
  return node;
}

export function handle_click(event) {
  // Adapted from https://github.com/visionmedia/page.js
  // MIT license https://github.com/visionmedia/page.js#license
  if (which(event) !== 1) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (event.defaultPrevented) return;

  const a = find_anchor(event.target);
  if (!a) return;
  if (!a.href) return;

  // check if link is inside an svg
  // in this case, both href and target are always inside an object
  const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
  const href = String(svg ? (a).href.baseVal : a.href);

  if (href === location.href) {
    if (!location.hash) event.preventDefault();
    return;
  }

  // Ignore if tag has
  // 1. 'download' attribute
  // 2. rel='external' attribute
  if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;

  // Ignore if <a> has a target
  if (svg ? (a).target.baseVal : a.target) return;

  const url = new URL(href);

  // Don't handle hash changes, origin changes, or
  // routes outside specified root
  if (url.origin !== location.origin) return;
  if (!url.pathname.startsWith(this.base)) return;
  if (url.pathname === location.pathname && url.search === location.search) return;
  event.preventDefault();
  this.history.pushState({ route: url.pathname, search: url.search }, '', url.href);
  this.route.set(url.pathname)
  this.query.set(qsparse(url.search))
}

