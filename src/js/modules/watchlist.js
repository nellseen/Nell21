import { isMovieId } from '../utils/validators.js';
const STORAGE_KEY = 'tianetflix.watchlist.v1';
function readList() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(movie => movie && isMovieId(movie.id) && typeof movie.title === 'string' && typeof movie.poster_path === 'string' && ['movie', 'tv'].includes(movie.mediaType || 'movie')).slice(0, 500);
  } catch { return []; }
}
export function getWatchlist() { return readList(); }
export function hasSavedMovie(id) { return hasSavedMedia('movie', id); }
export function hasSavedMedia(mediaType, id) { return readList().some(movie => Number(movie.id) === Number(id) && (movie.mediaType || 'movie') === mediaType); }
export function toggleWatchlist(movie, mediaType = 'movie') {
  if (!movie || !isMovieId(movie.id)) throw new TypeError('Film tidak valid.');
  const list = readList(); const index = list.findIndex(item => Number(item.id) === Number(movie.id) && (item.mediaType || 'movie') === mediaType);
  let saved;
  if (index >= 0) { list.splice(index, 1); saved = false; }
  else {
    list.unshift({ id: Number(movie.id), mediaType, title: String(movie.title || movie.name || 'Untitled').slice(0, 240), poster_path: String(movie.poster_path || ''), backdrop_path: String(movie.backdrop_path || ''), release_date: String(movie.release_date || movie.first_air_date || ''), vote_average: Number(movie.vote_average) || 0, overview: String(movie.overview || '').slice(0, 1000), genre_ids: Array.isArray(movie.genres) ? movie.genres.map(genre => Number(genre.id)).filter(Number.isInteger) : (Array.isArray(movie.genre_ids) ? movie.genre_ids.filter(Number.isInteger) : []) });
    saved = true;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { throw new Error('Watchlist tidak dapat disimpan di perangkat ini.'); }
  window.dispatchEvent(new CustomEvent('watchlistchange', { detail: { id: Number(movie.id), mediaType, saved } }));
  return saved;
}
