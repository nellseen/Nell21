import '../css/main.css';
import { initHome, initParticles, initScrollEffects, pauseAmbientEffects, playTrailer, resumeAmbientEffects } from './modules/home.js';
import { initSearch } from './modules/search.js';
import { initInfiniteScroll } from './modules/infinite-scroll.js';
import { applySubtitleSettings, closePlayer, handlePlayerMessage, openPlayer, togglePlayerMode } from './modules/player.js';
import { closeTrailer } from './modules/trailers.js';
import { byId } from './utils/dom.js';
import { bindDetailActions, closeDetails, showMovieDetails, showPersonDetails } from './modules/details.js';
import { initBrowse } from './modules/browse.js';
import { api } from './api/client.js';
import { setMediaOverlay } from './utils/media-overlays.js';

const activeMediaOverlays = new Set();
window.addEventListener('tianetflix:media-overlay', event => {
  const { id, active } = event.detail || {};
  if (typeof id !== 'string') return;
  if (active) { activeMediaOverlays.add(id); pauseAmbientEffects(); }
  else {
    activeMediaOverlays.delete(id);
    if (!activeMediaOverlays.size) requestAnimationFrame(() => { if (!activeMediaOverlays.size) resumeAmbientEffects(); });
  }
});

function closeModal(id) { if (id === 'watchModal') closePlayer(); if (id === 'trailerModal') closeTrailer(); if (id === 'movieModal') closeDetails(); }
function onMovieAction(event) {
  const person = event.target.closest('[data-person-id]');
  if (person) { showPersonDetails(Number(person.dataset.personId)); return; }
  const card = event.target.closest('[data-movie-id]');
  if (!card) return;
  const id = Number(card.dataset.movieId);
  if (!Number.isSafeInteger(id) || id <= 0) return;
  showMovieDetails(id, card.dataset.mediaType || 'movie');
}
function bindInteractions() {
  byId('movies-container').addEventListener('click', onMovieAction);
  byId('searchResults').addEventListener('click', onMovieAction);
  byId('movies-container').addEventListener('keydown', event => {
    if (event.target.matches('.movie-card') && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onMovieAction(event); }
  });
  byId('searchResults').addEventListener('keydown', event => {
    if (event.target.matches('.search-result') && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onMovieAction(event); }
  });
  document.addEventListener('click', event => { const closer = event.target.closest('[data-close-modal]'); if (closer) closeModal(closer.dataset.closeModal); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closePlayer(); closeTrailer(); closeDetails(); } });
  byId('btn-watch-hero').addEventListener('click', event => openPlayer(Number(event.currentTarget.dataset.movieId)));
  const searchWrap = document.querySelector('.search-wrap');
  const searchToggle = byId('searchToggle');
  searchToggle.addEventListener('click', () => {
    const expanded = searchWrap.classList.toggle('open');
    searchToggle.setAttribute('aria-expanded', String(expanded));
    if (expanded) byId('searchInput').focus(); else { byId('searchInput').value = ''; byId('searchInput').dispatchEvent(new Event('input')); }
  });
  document.addEventListener('click', event => {
    if (!searchWrap.contains(event.target)) { searchWrap.classList.remove('open'); searchToggle.setAttribute('aria-expanded', 'false'); }
  });
  byId('btn-trailer-hero').addEventListener('click', async event => {
    try { await playTrailer(Number(event.currentTarget.dataset.movieId)); }
    catch (error) { byId('page-message').textContent = error.message || 'Trailer tidak tersedia.'; }
  });
  byId('applySubtitle').addEventListener('click', () => { try { applySubtitleSettings(); } catch { /* Feedback is rendered beside the form. */ } });
  byId('playerModeToggle').addEventListener('click', togglePlayerMode);
  window.addEventListener('message', handlePlayerMessage);
}
document.addEventListener('DOMContentLoaded', async () => {
  bindInteractions(); bindDetailActions(); initScrollEffects(); initParticles(); initSearch(); initInfiniteScroll();
  const genresPromise = api.genres('movie');
  await Promise.all([initHome(genresPromise), initBrowse(genresPromise)]);
});
