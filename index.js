import express from 'express';
import { createApp } from './server/index.js';
import { readConfig } from './server/config/env.js';

const app = createApp(readConfig(), express());

export default app;
