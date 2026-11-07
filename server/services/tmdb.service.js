const API_BASE = 'https://api.themoviedb.org/3/';
const cache = new Map();
const TTL_MS = 60_000;

export class UpstreamError extends Error { constructor(status, message) { super(message); this.status = status; } }

export async function tmdbRequest(path, params, config) {
  const url = new URL(String(path).replace(/^\/+/, ''), API_BASE);
  for (const [key, value] of Object.entries(params || {})) if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  if (!config.tmdbAccessToken) url.searchParams.set('api_key', config.tmdbApiKey);
  const cacheKey = url.href;
  const saved = cache.get(cacheKey);
  if (saved && saved.expires > Date.now()) return saved.value;
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json', ...(config.tmdbAccessToken ? { Authorization: `Bearer ${config.tmdbAccessToken}` } : {}) }, signal: controller.signal });
    if (!response.ok) throw new UpstreamError(response.status === 404 ? 404 : 502, response.status === 404 ? 'Konten tidak ditemukan.' : 'Layanan katalog sedang bermasalah.');
    const data = await response.json();
    cache.set(cacheKey, { value: data, expires: Date.now() + TTL_MS });
    if (cache.size > 300) cache.delete(cache.keys().next().value);
    return data;
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (error.name === 'AbortError') throw new UpstreamError(504, 'Layanan katalog terlalu lama merespons.');
    throw new UpstreamError(502, 'Tidak dapat menghubungi layanan katalog.');
  } finally { clearTimeout(timeout); }
}
