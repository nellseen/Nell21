import { createApp } from './server/index.js';
import { readConfig } from './server/config/env.js';

const app = createApp(readConfig());

export default app;
