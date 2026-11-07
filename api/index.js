import { createApp } from '../server/index.js';
import { readConfig } from '../server/config/env.js';

const app = createApp(readConfig());

export default function handler(req, res) {
  const incoming = new URL(req.url || '/', 'http://localhost');
  const route = incoming.searchParams.get('__route');
  incoming.searchParams.delete('__route');

  if (route) {
    incoming.pathname = `/api/${route.replace(/^\/+/, '')}`;
    req.url = `${incoming.pathname}${incoming.search}`;
  }

  return app(req, res);
}
