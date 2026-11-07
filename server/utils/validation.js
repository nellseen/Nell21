export const validMovieId = value => /^\d{1,10}$/.test(String(value)) && Number(value) > 0 && Number.isSafeInteger(Number(value));
export const validPage = value => /^\d{1,3}$/.test(String(value)) && Number(value) >= 1 && Number(value) <= 500;
export const validGenreId = value => /^\d{1,5}$/.test(String(value)) && Number(value) > 0;
export const validTvId = validMovieId;
export const validPersonId = validMovieId;
export const validSeasonNumber = value => /^\d{1,3}$/.test(String(value)) && Number(value) <= 100;
export const validEpisodeNumber = value => /^\d{1,4}$/.test(String(value)) && Number(value) >= 1 && Number(value) <= 1000;
