import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../index.js';
import { readConfig } from '../config/env.js';

async function withServer(config, run) {
  const server = createApp(config).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base); } finally { await new Promise(resolve => server.close(resolve)); }
}
const config = (extra = {}) => ({ port: 3000, nodeEnv: 'test', tmdbApiKey: 'test-key-not-a-secret', tmdbAccessToken: undefined, clientOrigins: ['http://localhost:5173'], ...extra });

test('startup requires one TMDB credential', () => {
  assert.throws(() => readConfig({ PORT: '3000' }), /TMDB_API_KEY atau TMDB_ACCESS_TOKEN/);
  assert.equal(readConfig({ TMDB_API_KEY: 'key' }).tmdbApiKey, 'key');
  assert.equal(readConfig({ TMDB_ACCESS_TOKEN: 'token' }).tmdbAccessToken, 'token');
});

test('API validates input, calls fixed TMDB routes, and never echoes credentials', async () => {
  const originalFetch = globalThis.fetch; const requested = [];
  globalThis.fetch = async (url, options) => {
    if (new URL(String(url)).hostname !== 'api.themoviedb.org') return originalFetch(url, options);
    requested.push({ url: String(url), options }); return Response.json({ results: [{ id: 786892, title: 'Movie' }], page: 1, total_pages: 2 });
  };
  try {
    await withServer(config(), async base => {
      let response = await fetch(`${base}/api/movies/discover?genre=28&page=2&sort=vote_average.desc`);
      assert.equal(response.status, 200); assert.deepEqual((await response.json()).results[0].id, 786892);
      assert.match(requested[0].url, /discover\/movie/); assert.match(requested[0].url, /api_key=test-key-not-a-secret/); assert.match(requested[0].url, /with_genres=28/);
      assert.match(requested[0].url, /sort_by=vote_average.desc/);
      response = await fetch(`${base}/api/search/movies?q=x`); assert.equal(response.status, 400);
      response = await fetch(`${base}/api/movies/discover?sort=somewhere`); assert.equal(response.status, 400);
      response = await fetch(`${base}/api/movies/../../configuration`); assert.notEqual(response.status, 200);
      response = await fetch(`${base}/api/movies/786892/videos`); assert.equal(response.status, 200);
      assert.equal(requested[1].url, 'https://api.themoviedb.org/3/movie/786892/videos?api_key=test-key-not-a-secret');
      assert.equal(JSON.stringify(await response.json()).includes('test-key-not-a-secret'), false);
      response = await fetch(`${base}/api/movies/popular`, { headers: { Origin: 'https://evil.example' } });
      assert.equal(response.headers.get('access-control-allow-origin'), null);
    });
  } finally { globalThis.fetch = originalFetch; }
});

test('TMDB access token uses Bearer header rather than API-key query', async () => {
  const originalFetch = globalThis.fetch; let seen;
  globalThis.fetch = async (url, options) => {
    if (new URL(String(url)).hostname !== 'api.themoviedb.org') return originalFetch(url, options);
    seen = { url: String(url), options }; return Response.json({ genres: [] });
  };
  try {
    await withServer(config({ tmdbApiKey: undefined, tmdbAccessToken: 'test-token-only' }), async base => {
      const response = await fetch(`${base}/api/genres`); assert.equal(response.status, 200);
      assert.equal(new URL(seen.url).searchParams.has('api_key'), false);
      assert.equal(seen.options.headers.Authorization, 'Bearer test-token-only');
    });
  } finally { globalThis.fetch = originalFetch; }
});

test('TV catalogue, multi search, and episode endpoints use validated TMDB routes', async () => {
  const originalFetch = globalThis.fetch; const requested = [];
  globalThis.fetch = async (url, options) => {
    if (new URL(String(url)).hostname !== 'api.themoviedb.org') return originalFetch(url, options);
    requested.push(String(url));
    const result = new URL(String(url)).pathname.endsWith('/search/multi') ? { results: [{ id: 555, media_type: 'tv', name: 'Agent Kim Reactivated' }] } : { results: [], episodes: [] };
    return Response.json(result);
  };
  try {
    await withServer(config(), async base => {
      let response = await fetch(`${base}/api/tv/discover?genre=18&page=2&sort=first_air_date.desc`);
      assert.equal(response.status, 200); assert.match(requested[0], /discover\/tv/); assert.match(requested[0], /with_genres=18/); assert.match(requested[0], /sort_by=first_air_date.desc/);
      response = await fetch(`${base}/api/search/multi?q=Agent%20Kim`); assert.equal(response.status, 200); assert.equal((await response.json()).results[0].media_type, 'tv'); assert.match(requested[1], /search\/multi/);
      response = await fetch(`${base}/api/tv/555/season/1/episode/2`); assert.equal(response.status, 200); assert.match(requested[2], /tv\/555\/season\/1\/episode\/2/);
      response = await fetch(`${base}/api/tv/555/season/-1/episode/2`); assert.equal(response.status, 400); assert.equal(requested.length, 3);
      response = await fetch(`${base}/api/tv/555`); assert.equal(response.status, 200); assert.match(requested[3], /\/3\/tv\/555\?/);
    });
  } finally { globalThis.fetch = originalFetch; }
});
