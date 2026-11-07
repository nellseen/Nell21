import { api } from '../api/client.js';
import { byId, element } from '../utils/dom.js';
import { renderCards } from './movies.js';
import { getWatchlist } from './watchlist.js';

let page = 0; let totalPages = 1; let requestSequence = 0; let watchlistMode = false; let mediaType = 'movie';
function setActiveMediaTab(type) {
  document.querySelectorAll('[data-media-tab]').forEach(item => {
    const active = item.dataset.mediaTab === type;
    item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active));
  });
}
function setActiveSidebar(action, genreId = '') {
  document.querySelectorAll('[data-side-action], [data-sidebar-genre]').forEach(item => {
    const active = genreId ? item.dataset.sidebarGenre === genreId : item.dataset.sideAction === action;
    item.classList.toggle('active', active);
  });
}
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
      const genres = data.genres || [];
      for (const genre of genres) { const option = element('option', '', genre.name); option.value = String(genre.id); byId('genreFilter').append(option); }
      const host = byId('sidebarGenres'); host.replaceChildren(); host.dataset.mediaType = mediaType;
      for (const genre of genres) {
        const button = element('button', '', genre.name); button.type = 'button'; button.dataset.sidebarGenre = String(genre.id); button.dataset.sidebarMediaType = mediaType; host.append(button);
      }
    } catch { byId('browseMessage').textContent = 'Daftar genre belum dapat dimuat.'; byId('sidebarGenres').replaceChildren(element('span', 'sidebar-hint', 'Genre belum tersedia.')); }
  }
  async function selectMediaType(type, genreId = '') {
    mediaType = type === 'tv' ? 'tv' : 'movie';
    watchlistMode = false; setSortOptions(); setActiveMediaTab(mediaType);
    await loadGenres(api.genres(mediaType));
    byId('genreFilter').value = genreId;
    await loadPage(true);
  }
  function scrollTo(target) { document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  await loadGenres(genresPromise);
  document.querySelectorAll('[data-media-tab]').forEach(tab => tab.addEventListener('click', () => selectMediaType(tab.dataset.mediaTab)));
  byId('genreFilter').addEventListener('change', () => { watchlistMode = false; loadPage(true); });
  byId('sortFilter').addEventListener('change', () => { watchlistMode = false; loadPage(true); });
  byId('browseMore').addEventListener('click', () => { if (page < totalPages) loadPage(false); });
  byId('appSidebar').addEventListener('click', event => {
    const genre = event.target.closest('[data-sidebar-genre]');
    if (genre) {
      const genreId = genre.dataset.sidebarGenre;
      selectMediaType(genre.dataset.sidebarMediaType, genreId).then(() => { setActiveSidebar('', genreId); scrollTo('#browseSection'); });
      return;
    }
    const action = event.target.closest('[data-side-action]')?.dataset.sideAction;
    if (!action) return;
    setActiveSidebar(action);
    if (action === 'home') scrollTo('#hero');
    if (action === 'trending') scrollTo('#trending');
    if (action === 'movies' || action === 'tv') {
      selectMediaType(action === 'tv' ? 'tv' : 'movie').then(() => scrollTo('#browseSection'));
    }
    if (action === 'genres') { scrollTo('#browseSection'); byId('genreFilter').focus({ preventScroll: true }); }
    if (action === 'watchlist') { showWatchlist(); setActiveSidebar('watchlist'); }
    if (action === 'search') { byId('searchToggle').click(); }
  });
  byId('watchlistNav').addEventListener('click', () => { showWatchlist(); setActiveSidebar('watchlist'); });
  window.addEventListener('watchlistchange', () => { if (watchlistMode) showWatchlist(); });
  await loadPage(true);
}
