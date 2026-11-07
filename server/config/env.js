import 'dotenv/config';

export function readConfig(env = process.env) {
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT harus berupa bilangan bulat 1–65535.');
  const apiKey = env.TMDB_API_KEY?.trim();
  const accessToken = env.TMDB_ACCESS_TOKEN?.trim();
  if (!apiKey && !accessToken) throw new Error('Credential TMDB belum dikonfigurasi. Isi TMDB_API_KEY atau TMDB_ACCESS_TOKEN di .env.');
  const origins = (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean);
  const upstashUrl = env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (Boolean(upstashUrl) !== Boolean(upstashToken)) throw new Error('UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN harus diisi berpasangan.');
  if (upstashUrl) {
    let parsedUrl;
    try { parsedUrl = new URL(upstashUrl); } catch { throw new Error('UPSTASH_REDIS_REST_URL harus berupa URL HTTPS yang valid.'); }
    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) throw new Error('UPSTASH_REDIS_REST_URL harus berupa URL HTTPS tanpa credential di URL.');
  }
  return {
    port,
    nodeEnv: env.NODE_ENV || 'development',
    tmdbApiKey: apiKey,
    tmdbAccessToken: accessToken,
    clientOrigins: origins,
    upstashRedisRestUrl: upstashUrl,
    upstashRedisRestToken: upstashToken,
    trustProxy: env.VERCEL === '1' ? 1 : false,
    isVercel: env.VERCEL === '1',
  };
}
