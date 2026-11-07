import rateLimit from 'express-rate-limit';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const LIMIT = 90;
const WINDOW_MS = 60_000;
const RATE_LIMIT_MESSAGE = { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' };

function createLocalLimiter() {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: LIMIT,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });
}

export function createApiRateLimit(config) {
  const localLimiter = createLocalLimiter();
  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
    if (config.isVercel) console.warn('Upstash belum dikonfigurasi; sementara memakai rate limit lokal per instance.');
    return localLimiter;
  }

  const redis = new Redis({ url: config.upstashRedisRestUrl, token: config.upstashRedisRestToken });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMIT, '1 m'),
    prefix: 'tianetflix:api:v1',
    analytics: false,
  });
  return createDistributedRateLimit(limiter, localLimiter);
}

export function createDistributedRateLimit(limiter, localLimiter, warn = message => console.warn(message)) {
  let warned = false;
  const warnOnce = message => { if (!warned) { warn(message); warned = true; } };

  return async (req, res, next) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    let timeout;
    try {
      const result = await Promise.race([
        limiter.limit(identifier),
        new Promise(resolve => { timeout = setTimeout(() => resolve(null), 1500); }),
      ]);
      if (!result) {
        warnOnce('Upstash melampaui timeout; memakai rate limit lokal sebagai fallback.');
        return localLimiter(req, res, next);
      }
      res.setHeader('RateLimit-Limit', String(result.limit));
      res.setHeader('RateLimit-Remaining', String(result.remaining));
      res.setHeader('RateLimit-Reset', String(Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))));
      if (!result.success) {
        res.setHeader('Retry-After', String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))));
        return res.status(429).json(RATE_LIMIT_MESSAGE);
      }
      return next();
    } catch {
      warnOnce('Upstash tidak tersedia; memakai rate limit lokal sebagai fallback.');
      return localLimiter(req, res, next);
    } finally { clearTimeout(timeout); }
  };
}
