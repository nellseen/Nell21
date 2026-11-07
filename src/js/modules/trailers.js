import { api } from '../api/client.js';
import { byId } from '../utils/dom.js';
import { youtubeEmbed } from '../utils/sanitize.js';
import { setMediaOverlay } from '../utils/media-overlays.js';
export async function playTrailer(movieId, mediaType = 'movie') {
  const result = await api.videos(movieId, mediaType);
  const video = result.results?.find(item => item.site === 'YouTube' && item.type === 'Trailer') || result.results?.find(item => item.site === 'YouTube');
  const source = video && youtubeEmbed(video.key, true);
  if (!source) throw new Error('Trailer tidak tersedia.');
  byId('trailerIframe').src = source;
  const modal = byId('trailerModal'); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  setMediaOverlay('trailer', true);
  document.body.style.overflow = 'hidden';
}
export function closeTrailer() {
  const modal = byId('trailerModal'); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
  setMediaOverlay('trailer', false);
  byId('trailerIframe').src = 'about:blank'; document.body.style.overflow = '';
}
