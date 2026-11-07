export const imageUrl = (path, size = 'w500') => path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
export const categories = [
  { id: 'trending', title: 'Trending Movies', mediaType: 'movie', fetch: 'trendingMovies' },
  { id: 'popular', title: 'Popular Movies', mediaType: 'movie', fetch: 'popular' },
  { id: 'top_rated', title: 'Top Rated Movies', mediaType: 'movie', fetch: 'topRated' },
  { id: 'action', title: 'Action & Adventure', mediaType: 'movie', genre: 28 },
  { id: 'scifi', title: 'Sci-Fi Universe', mediaType: 'movie', genre: 878 },
  { id: 'comedy', title: 'Laugh Out Loud', mediaType: 'movie', genre: 35 },
  { id: 'horror', title: 'Late Night Chills', mediaType: 'movie', genre: 27 },
  { id: 'tv_trending', title: 'Trending Series', mediaType: 'tv', fetch: 'trendingTv' },
  { id: 'tv_popular', title: 'Popular Series', mediaType: 'tv', fetch: 'popularTv' },
  { id: 'tv_top_rated', title: 'Top Rated Series', mediaType: 'tv', fetch: 'topRatedTv' },
  { id: 'tv_onair', title: 'On The Air', mediaType: 'tv', fetch: 'onAirTv' },
];
