import { api } from '../api/client.js';
import { byId, element } from '../utils/dom.js';
import { renderCards } from './movies.js';
import { getWatchlist } from './watchlist.js';

let page = 0; let totalPages = 1; let requestSequence = 0; let watchlistMode = false; let mediaType = 'movie';
function setSortOptions() {
  const select = byId('sortFilter'); select.replaceChildren();
  const options = [['popularity.desc', 'Terpopuler'], ['vote_average.desc', 'Rating tertinggi'], [mediaType === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc', 'Terbaru']];
  for (const [value, label] of options) { const option = element('option', '', label); option.value = value; select.append(option); }
}
function updateControls() {
  const controls = document.querySelector('.browse-controls');
  controls.hidden = watchlistMode;
  document.querySelector('.media-tabs').hidden = watchlistMode;
  byId('browseMore').hidden = watchlistMode || page >= totalPages;
  byId('browseTitle').textContent = watchlistMode ? 'My List' : mediaType === 'tv' ? 'Jelajahi serial' : 'Jelajahi film';
}
function showWatchlist() {
  watchlistMode = true; page = 0; totalPages = 1; updateControls();
  const grid = byId('browseGrid'); grid.replaceChildren();
  const list = getWatchlist(); renderCards(grid, list, { allowMissingPoster: true });
  byId('browseMessage').textContent = list.length ? '' : 'Watchlist kamu masih kosong. Buka detail film lalu pilih “My List”.';
  byId('browseMore').hidden = true;
  byId('browseSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function loadPage(reset = false) {
  watchlistMode = false;
  const sequence = ++requestSequence;
  if (reset) { page = 0; totalPages = 1; byId('browseGrid').replaceChildren(); }
  updateControls();
  byId('browseMessage').textContent = 'Memuat film…';
  byId('browseMore').disabled = true;
  try {
    const requestedPage = reset ? 1 : page + 1;
    const result = await api.discover(byId('genreFilter').value, requestedPage, byId('sortFilter').value, mediaType);
    if (sequence !== requestSequence) return;
    const grid = byId('browseGrid');
    if (reset) grid.replaceChildren();
    renderCards(grid, result.results || [], { append: true, mediaType });
    page = Number(result.page) || requestedPage; totalPages = Math.min(Number(result.total_pages) || page, 500);
    byId('browseMessage').textContent = grid.children.length ? '' : 'Tidak ada film untuk filter ini.';
    byId('browseMore').hidden = page >= totalPages;
  } catch (error) {
    if (sequence === requestSequence) byId('browseMessage').textContent = error.message || 'Gagal memuat film.';
  } finally {
    if (sequence === requestSequence) byId('browseMore').disabled = false;
  }
}
export async function initBrowse(genresPromise) {
  async function loadGenres(promise) {
    byId('genreFilter').replaceChildren(element('option', '', 'Semua genre'));
    byId('genreFilter').firstElementChild.value = '';
    try {
      const data = await promise;
      for (const genre of data.genres || []) { const option = element('option', '', genre.name); option.value = String(genre.id); byId('genreFilter').append(option); }
    } catch { byId('browseMessage').textContent = 'Daftar genre belum dapat dimuat.'; }
  }
  await loadGenres(genresPromise);
  document.querySelectorAll('[data-media-tab]').forEach(tab => tab.addEventListener('click', async () => {
    mediaType = tab.dataset.mediaTab;
    document.querySelectorAll('[data-media-tab]').forEach(item => { const active = item === tab; item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active)); });
    watchlistMode = false; setSortOptions(); await loadGenres(api.genres(mediaType)); await loadPage(true);
  }));
  byId('genreFilter').addEventListener('change', () => { watchlistMode = false; loadPage(true); });
  byId('sortFilter').addEventListener('change', () => { watchlistMode = false; loadPage(true); });
  byId('browseMore').addEventListener('click', () => { if (page < totalPages) loadPage(false); });
  byId('browseNav').addEventListener('click', () => { if (watchlistMode) loadPage(true); });
  byId('watchlistNav').addEventListener('click', showWatchlist);
  window.addEventListener('watchlistchange', () => { if (watchlistMode) showWatchlist(); });
  await loadPage(true);
}
