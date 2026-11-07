export const isMovieId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
export const validPage = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 500;
export const validGenreId = value => Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) < 10000;
export const isTvEpisode = (season, episode) => Number.isInteger(Number(season)) && Number(season) >= 0 && Number(season) <= 100 && Number.isInteger(Number(episode)) && Number(episode) >= 1 && Number(episode) <= 1000;
