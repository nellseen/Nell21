export function plainText(value, max = 1000) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) : '';
}
export function youtubeEmbed(key, autoplay = false) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{6,20}$/.test(key)) return null;
  const url = new URL(`https://www.youtube-nocookie.com/embed/${key}`);
  if (autoplay) url.searchParams.set('autoplay', '1');
  return url.href;
}
