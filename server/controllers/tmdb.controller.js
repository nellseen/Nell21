import { tmdbRequest } from '../services/tmdb.service.js';
import { validGenreId, validMovieId, validPage } from '../utils/validation.js';

const pageNumber = value => { if (value === undefined) return 1; if (!validPage(value)) { const error = new Error('Parameter page harus bilangan bulat antara 1 dan 500.'); error.status = 400; throw error; } return Number(value); };
export const listTrending = (req, res, next) => run(req, res, next, () => tmdbRequest('/trending/movie/day', { page: pageNumber(req.query.page) }, req.app.locals.config));
export const listPopular = (req, res, next) => run(req, res, next, () => tmdbRequest('/movie/popular', { page: pageNumber(req.query.page) }, req.app.locals.config));
export const listTopRated = (req, res, next) => run(req, res, next, () => tmdbRequest('/movie/top_rated', { page: pageNumber(req.query.page) }, req.app.locals.config));
export const discoverMovies = (req, res, next) => run(req, res, next, () => {
  if (req.query.genre !== undefined && !validGenreId(req.query.genre)) { const error = new Error('Parameter genre tidak valid.'); error.status = 400; throw error; }
  const sortBy = req.query.sort || 'popularity.desc';
  if (!['popularity.desc', 'vote_average.desc', 'primary_release_date.desc'].includes(sortBy)) { const error = new Error('Parameter sort tidak didukung.'); error.status = 400; throw error; }
  return tmdbRequest('/discover/movie', { page: pageNumber(req.query.page), sort_by: sortBy, with_genres: req.query.genre }, req.app.locals.config);
});
export const listGenres = (req, res, next) => run(req, res, next, () => tmdbRequest('/genre/movie/list', {}, req.app.locals.config));
export const searchMovies = (req, res, next) => run(req, res, next, () => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2 || query.length > 100) { const error = new Error('Query q harus berisi 2–100 karakter.'); error.status = 400; throw error; }
  return tmdbRequest('/search/movie', { query, page: pageNumber(req.query.page), include_adult: false }, req.app.locals.config);
});
export const movieDetails = (req, res, next) => run(req, res, next, () => {
  if (!validMovieId(req.params.id)) { const error = new Error('ID film tidak valid.'); error.status = 400; throw error; }
  return tmdbRequest(`/movie/${Number(req.params.id)}`, {}, req.app.locals.config);
});
export const movieVideos = (req, res, next) => run(req, res, next, () => {
  if (!validMovieId(req.params.id)) { const error = new Error('ID film tidak valid.'); error.status = 400; throw error; }
  return tmdbRequest(`/movie/${Number(req.params.id)}/videos`, {}, req.app.locals.config);
});
async function run(req, res, next, action) { try { res.json(await action()); } catch (error) { next(error); } }
