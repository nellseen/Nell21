export const byId = id => document.getElementById(id);
export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function safePoster(path, size = 'w500') {
  if (typeof path !== 'string' || !/^\/[\w.-]+$/.test(path)) return 'https://placehold.co/500x750?text=No+Image';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
