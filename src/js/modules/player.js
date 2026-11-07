import { byId } from '../utils/dom.js';
import { isMovieId, isTvEpisode } from '../utils/validators.js';
import { setMediaOverlay } from '../utils/media-overlays.js';
const VIDLINK_ORIGIN = 'https://vidlink.pro';
let frameTimer;
const subtitleSettings = new Map();
let activeSubtitleKey = null;

function addPlayerOptions(url, subtitles) {
  url.searchParams.set('primaryColor', '007AFF');
  url.searchParams.set('secondaryColor', '1D1D1F');
  url.searchParams.set('iconColor', 'FFFFFF');
  url.searchParams.set('icons', 'default');
  url.searchParams.set('title', 'true');
  url.searchParams.set('poster', 'true');
  url.searchParams.set('autoplay', 'false');
  if (subtitles?.file) {
    url.searchParams.set('sub_file', subtitles.file);
    if (subtitles.label) url.searchParams.set('sub_label', subtitles.label);
  }
  return url.href;
}
export function moviePlayerUrl(tmdbId, subtitles = null) {
  if (!isMovieId(tmdbId)) throw new TypeError('ID film tidak valid.');
  return addPlayerOptions(new URL(`/movie/${Number(tmdbId)}`, VIDLINK_ORIGIN), subtitles);
}
export function tvPlayerUrl(tmdbId, season, episode, subtitles = null) {
  if (!isMovieId(tmdbId) || !isTvEpisode(season, episode)) throw new TypeError('ID serial, season, atau episode tidak valid.');
  return addPlayerOptions(new URL(`/tv/${Number(tmdbId)}/${Number(season)}/${Number(episode)}`, VIDLINK_ORIGIN), subtitles);
}
export function getSubtitleSettings() { return activeSubtitleKey ? subtitleSettings.get(activeSubtitleKey) || null : null; }
export function selectSubtitleTarget(mediaType, id, season, episode) {
  if (!isMovieId(id)) return;
  if (mediaType === 'tv' && !isTvEpisode(season, episode)) return;
  activeSubtitleKey = mediaType === 'tv' ? `tv:${Number(id)}:${Number(season)}:${Number(episode)}` : `movie:${Number(id)}`;
  const saved = getSubtitleSettings();
  for (const [urlId, labelId] of [['subtitleUrl', 'subtitleLabel'], ['detailSubtitleUrl', 'detailSubtitleLabel']]) {
    const url = byId(urlId); const label = byId(labelId);
    if (url) url.value = saved?.file || '';
    if (label) label.value = saved?.label || '';
  }
}
export function validateSubtitleInput(rawUrl, rawLabel = '') {
  const cleanedUrl = String(rawUrl || '').trim();
  const label = String(rawLabel || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
  if (!cleanedUrl && !label) return null;
  const url = new URL(cleanedUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048 || !/\.vtt$/i.test(url.pathname)) throw new TypeError('Link subtitle harus HTTPS dan berakhir dengan .vtt.');
  return { file: url.href, label: label || 'External Subtitle' };
}
export function selectSubtitleMovie(movieId) { selectSubtitleTarget('movie', movieId); }
export function applySubtitleSettings(urlId = 'subtitleUrl', labelId = 'subtitleLabel', feedbackId = 'subtitleFeedback') {
  const feedback = byId(feedbackId);
  try {
    if (!activeSubtitleKey) throw new TypeError('Pilih film atau episode terlebih dahulu.');
    const settings = validateSubtitleInput(byId(urlId).value, byId(labelId).value);
    if (settings) subtitleSettings.set(activeSubtitleKey, settings); else subtitleSettings.delete(activeSubtitleKey);
    feedback.textContent = settings ? 'Subtitle disimpan untuk pemutaran berikutnya.' : 'Subtitle eksternal dinonaktifkan.';
    return settings;
  } catch (error) { feedback.textContent = 'Gunakan URL HTTPS langsung ke file .vtt. Link tidak disimpan.'; throw error; }
}
function openPlayerUrl(targetKey, source) {
  const modal = byId('watchModal');
  const frame = byId('watchIframe');
  activeSubtitleKey = targetKey;
  const saved = getSubtitleSettings();
  if (byId('subtitleUrl')) byId('subtitleUrl').value = saved?.file || '';
  if (byId('subtitleLabel')) byId('subtitleLabel').value = saved?.label || '';
  byId('player-error').hidden = true;
  byId('player-loading').classList.remove('done');
  frame.onload = () => { clearTimeout(frameTimer); byId('player-loading').classList.add('done'); };
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  setMediaOverlay('player', true);
  document.body.style.overflow = 'hidden';
  clearTimeout(frameTimer);
  frameTimer = setTimeout(() => { if (modal.classList.contains('open')) { byId('player-loading').classList.add('done'); byId('player-error').hidden = false; } }, 15000);
  frame.src = source;
  byId('watchModalContent').focus?.();
}
export function openPlayer(movieId, subtitles) {
  if (!isMovieId(movieId)) { byId('player-error').hidden = false; return; }
  selectSubtitleTarget('movie', movieId);
  try { openPlayerUrl(activeSubtitleKey, moviePlayerUrl(movieId, subtitles === undefined ? getSubtitleSettings() : subtitles)); }
  catch { byId('player-error').hidden = false; }
}
export function openTvPlayer(tvId, season, episode, subtitles) {
  if (!isMovieId(tvId) || !isTvEpisode(season, episode)) { byId('player-error').hidden = false; return; }
  selectSubtitleTarget('tv', tvId, season, episode);
  try { openPlayerUrl(activeSubtitleKey, tvPlayerUrl(tvId, season, episode, subtitles === undefined ? getSubtitleSettings() : subtitles)); }
  catch { byId('player-error').hidden = false; }
}
export function closePlayer() {
  const modal = byId('watchModal');
  modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
  setMediaOverlay('player', false);
  byId('watchIframe').src = 'about:blank';
  byId('player-loading').classList.remove('done'); byId('player-error').hidden = true;
  clearTimeout(frameTimer);
  document.body.style.overflow = '';
}
export function handlePlayerMessage(event) {
  if (event.origin !== VIDLINK_ORIGIN || !event.data || typeof event.data !== 'object' || Array.isArray(event.data)) return;
  const { type, data } = event.data;
  if (type !== 'PLAYER_EVENT' || !data || typeof data !== 'object') return;
  if (typeof data.event !== 'string' || !['play', 'pause', 'seeked', 'ended', 'timeupdate'].includes(data.event)) return;
  if (typeof data.currentTime !== 'number' || !Number.isFinite(data.currentTime) || typeof data.duration !== 'number' || !Number.isFinite(data.duration)) return;
  // Player telemetry is deliberately not persisted or used to control the application.
}
