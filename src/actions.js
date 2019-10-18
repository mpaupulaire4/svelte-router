import { route } from './Router.svelte'

export function active(node, className = 'active') {
  function ActiveActionSubscriber(route) {
    const url = new URL(node.getAttribute('href'));
    if (url.pathname === route) {
      node.classList.add(this.className)
    } else {
      node.classList.remove(this.className)
    }
  }
  ActiveActionSubscriber.className = className
  const destroy = route.subscribe(ActiveActionSubscriber)
  return {
    destroy,
    update: (className) => {
      ActiveActionSubscriber.className = className
    }
  }
}