import { element, safePoster } from '../utils/dom.js';
import { plainText } from '../utils/sanitize.js';
import { isMovieId } from '../utils/validators.js';

export function createMovieCard(movie, mediaType = 'movie') {
  if (!movie || !isMovieId(movie.id)) return null;
  const title = plainText(movie.title || movie.name, 240) || 'Untitled';
  const card = element('article', 'movie-card');
  card.dataset.movieId = String(Number(movie.id));
  card.dataset.mediaType = mediaType;
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Lihat detail ${mediaType === 'tv' ? 'serial' : 'film'} ${title}`);
  const posterWrap = element('div', 'poster-wrap');
  const image = element('img', 'movie-poster');
  image.src = safePoster(movie.poster_path);
  image.alt = `Poster ${title}`;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => { image.src = 'https://placehold.co/500x750?text=No+Image'; }, { once: true });
  const info = element('div', 'movie-info');
  info.append(element('strong', '', title));
  const rating = Number(movie.vote_average);
  const date = movie.release_date || movie.first_air_date;
  const year = typeof date === 'string' ? date.slice(0, 4) : '';
  info.append(element('span', '', `⭐ ${Number.isFinite(rating) && rating ? rating.toFixed(1) : 'N/A'}${year ? ` · ${year}` : ''}`));
  posterWrap.append(image, info);
  card.append(posterWrap);
  return card;
}

export function renderCards(row, movies, { append = false, allowMissingPoster = false, mediaType = row.dataset.mediaType || 'movie' } = {}) {
  if (!append) row.replaceChildren();
  for (const movie of movies) {
    const cardMediaType = movie?.mediaType === 'tv' ? 'tv' : mediaType;
    if ((!movie?.poster_path && !allowMissingPoster) || row.querySelector(`[data-movie-id="${Number(movie.id)}"][data-media-type="${cardMediaType}"]`)) continue;
    const card = createMovieCard(movie, cardMediaType);
    if (card) row.append(card);
  }
}
