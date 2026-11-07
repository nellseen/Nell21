async function request(path, { signal } = {}) {
  const response = await fetch(path, { headers: { Accept: 'application/json' }, signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Permintaan gagal. Coba lagi sebentar.');
  return body;
}
export const api = {
  trending: (mediaType = 'movie') => request(`/api/${mediaType === 'tv' ? 'tv' : 'movies'}/trending`),
  popular: () => request('/api/movies/popular'),
  topRated: () => request('/api/movies/top-rated'),
  trendingMovies: () => request('/api/movies/trending'),
  trendingTv: () => request('/api/tv/trending'),
  popularTv: () => request('/api/tv/popular'),
  topRatedTv: () => request('/api/tv/top-rated'),
  onAirTv: () => request('/api/tv/on-the-air'),
  discover: (genre, page = 1, sort = 'popularity.desc', mediaType = 'movie') => request(`/api/${mediaType === 'tv' ? 'tv' : 'movies'}/discover?${genre ? `genre=${encodeURIComponent(genre)}&` : ''}page=${page}&sort=${encodeURIComponent(sort)}`),
  genres: (mediaType = 'movie') => request(`/api/${mediaType === 'tv' ? 'tv/genres' : 'genres'}`),
  videos: (id, mediaType = 'movie') => request(`/api/${mediaType === 'tv' ? 'tv' : 'movies'}/${id}/videos`),
  details: (id, mediaType = 'movie') => request(`/api/${mediaType === 'tv' ? 'tv' : 'movies'}/${id}`),
  season: (id, season) => request(`/api/tv/${id}/season/${season}`),
  episode: (id, season, episode) => request(`/api/tv/${id}/season/${season}/episode/${episode}`),
  search: (query, signal) => request(`/api/search/multi?q=${encodeURIComponent(query)}`, { signal }),
  person: id => request(`/api/people/${id}`),
};
