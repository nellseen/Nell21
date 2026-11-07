import rateLimit from 'express-rate-limit';
export const apiRateLimit = rateLimit({ windowMs: 60_000, limit: 90, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' } });
