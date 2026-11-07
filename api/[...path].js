import { createApp } from '../server/index.js';
import { readConfig } from '../server/config/env.js';

const app = createApp(readConfig());

export default function handler(req, res) {
  const requestPath = String(req.url || '/');
  const pathname = requestPath.split('?', 1)[0];
  if (!/^\/api(?:\/|$)/.test(pathname)) {
    req.url = `/api${requestPath.startsWith('/') ? requestPath : `/${requestPath}`}`;
  }
  return app(req, res);
}
