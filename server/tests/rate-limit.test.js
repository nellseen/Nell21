import test from 'node:test';
import assert from 'node:assert/strict';
import { createDistributedRateLimit } from '../middleware/rate-limit.js';

function responseMock() {
  return {
    headers: {}, statusCode: 200, body: undefined,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('distributed limiter identifies client IP and rejects over-limit requests', async () => {
  let identified;
  const local = (_req, _res, next) => next();
  const middleware = createDistributedRateLimit({ limit: async ip => { identified = ip; return { success: false, limit: 90, remaining: 0, reset: Date.now() + 5000 }; } }, local, () => {});
  const res = responseMock(); let passed = false;
  await middleware({ ip: '203.0.113.10', socket: {} }, res, () => { passed = true; });
  assert.equal(identified, '203.0.113.10');
  assert.equal(passed, false);
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['RateLimit-Limit'], '90');
  assert.match(res.headers['Retry-After'], /^[1-5]$/);
  assert.match(res.headers['RateLimit-Reset'], /^[1-5]$/);
});

test('distributed limiter falls back locally when shared storage fails', async () => {
  let fallbackCalled = false; let warningCount = 0; let passed = false;
  const local = (_req, _res, next) => { fallbackCalled = true; next(); };
  const middleware = createDistributedRateLimit({ limit: async () => { throw new Error('private redis error'); } }, local, () => { warningCount++; });
  const req = { ip: '203.0.113.11', socket: {} };
  await middleware(req, responseMock(), () => { passed = true; });
  await middleware(req, responseMock(), () => { passed = true; });
  assert.equal(fallbackCalled, true);
  assert.equal(passed, true);
  assert.equal(warningCount, 1);
});
