import { tmdbRequest } from '../services/tmdb.service.js';
import { validEpisodeNumber, validGenreId, validPage, validPersonId, validSeasonNumber, validTvId } from '../utils/validation.js';

const pageNumber = value => { if (value === undefined) return 1; if (!validPage(value)) { const error = new Error('Parameter page harus bilangan bulat antara 1 dan 500.'); error.status = 400; throw error; } return Number(value); };
const fail = message => { const error = new Error(message); error.status = 400; throw error; };
const config = req => req.app.locals.config;
const run = (req, res, next, action) => Promise.resolve().then(action).then(data => res.json(data)).catch(next);
const validSort = (value, type) => {
  const allowed = type === 'tv' ? ['popularity.desc', 'vote_average.desc', 'first_air_date.desc', 'first_air_date.asc'] : ['popularity.desc', 'vote_average.desc', 'primary_release_date.desc'];
  if (!allowed.includes(value)) fail('Parameter sort tidak didukung.');
  return value;
};

export const listTvTrending = (req, res, next) => run(req, res, next, () => tmdbRequest(`/trending/tv/${req.query.window === 'week' ? 'week' : 'day'}`, { page: pageNumber(req.query.page) }, config(req)));
export const listTvPopular = (req, res, next) => run(req, res, next, () => tmdbRequest('/tv/popular', { page: pageNumber(req.query.page) }, config(req)));
export const listTvTopRated = (req, res, next) => run(req, res, next, () => tmdbRequest('/tv/top_rated', { page: pageNumber(req.query.page) }, config(req)));
export const listTvOnAir = (req, res, next) => run(req, res, next, () => tmdbRequest('/tv/on_the_air', { page: pageNumber(req.query.page) }, config(req)));
export const listTvAiringToday = (req, res, next) => run(req, res, next, () => tmdbRequest('/tv/airing_today', { page: pageNumber(req.query.page) }, config(req)));
export const listTvGenres = (req, res, next) => run(req, res, next, () => tmdbRequest('/genre/tv/list', {}, config(req)));
export const discoverTv = (req, res, next) => run(req, res, next, () => {
  if (req.query.genre !== undefined && !validGenreId(req.query.genre)) fail('Parameter genre tidak valid.');
  return tmdbRequest('/discover/tv', { page: pageNumber(req.query.page), sort_by: validSort(req.query.sort || 'popularity.desc', 'tv'), with_genres: req.query.genre, include_adult: false }, config(req));
});
export const multiSearch = (req, res, next) => run(req, res, next, () => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2 || query.length > 100) fail('Query q harus berisi 2–100 karakter.');
  return tmdbRequest('/search/multi', { query, page: pageNumber(req.query.page), include_adult: false }, config(req));
});
export const tvDetails = (req, res, next) => {
  if (!validTvId(req.params.id)) return run(req, res, next, () => fail('ID serial tidak valid.'));
  return run(req, res, next, () => tmdbRequest(`/tv/${Number(req.params.id)}`, {}, config(req)));
};
export const tvVideos = (req, res, next) => {
  if (!validTvId(req.params.id)) return run(req, res, next, () => fail('ID serial tidak valid.'));
  return run(req, res, next, () => tmdbRequest(`/tv/${Number(req.params.id)}/videos`, {}, config(req)));
};
export const tvSeason = (req, res, next) => {
  if (!validTvId(req.params.id) || !validSeasonNumber(req.params.season)) return run(req, res, next, () => fail('ID serial atau nomor season tidak valid.'));
  return run(req, res, next, () => tmdbRequest(`/tv/${Number(req.params.id)}/season/${Number(req.params.season)}`, {}, config(req)));
};
export const tvEpisode = (req, res, next) => {
  if (!validTvId(req.params.id) || !validSeasonNumber(req.params.season) || !validEpisodeNumber(req.params.episode)) return run(req, res, next, () => fail('ID serial, season, atau episode tidak valid.'));
  return run(req, res, next, () => tmdbRequest(`/tv/${Number(req.params.id)}/season/${Number(req.params.season)}/episode/${Number(req.params.episode)}`, {}, config(req)));
};
export const tvSeasonVideos = (req, res, next) => {
  if (!validTvId(req.params.id) || !validSeasonNumber(req.params.season)) return run(req, res, next, () => fail('ID serial atau nomor season tidak valid.'));
  return run(req, res, next, () => tmdbRequest(`/tv/${Number(req.params.id)}/season/${Number(req.params.season)}/videos`, {}, config(req)));
};
export const tvEpisodeVideos = (req, res, next) => {
  if (!validTvId(req.params.id) || !validSeasonNumber(req.params.season) || !validEpisodeNumber(req.params.episode)) return run(req, res, next, () => fail('ID serial, season, atau episode tidak valid.'));
  return run(req, res, next, () => tmdbRequest(`/tv/${Number(req.params.id)}/season/${Number(req.params.season)}/episode/${Number(req.params.episode)}/videos`, {}, config(req)));
};
export const personDetails = (req, res, next) => {
  if (!validPersonId(req.params.id)) return run(req, res, next, () => fail('ID orang tidak valid.'));
  return run(req, res, next, () => tmdbRequest(`/person/${Number(req.params.id)}`, { append_to_response: 'movie_credits,tv_credits' }, config(req)));
};
