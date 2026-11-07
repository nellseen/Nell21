export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500 && req.app.locals.config.nodeEnv === 'production' ? 'Terjadi kesalahan pada server.' : (error.message || 'Terjadi kesalahan.');
  res.status(status).json({ error: message });
}
