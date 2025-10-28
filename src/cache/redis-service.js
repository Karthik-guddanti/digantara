/**
 * Redis shim for local development (no Redis required).
 * Uses ../database/job-cache.js exports when available, otherwise falls back
 * to an in-memory map with TTL support. Exposes a Redis-like API:
 *   default export: client
 *   named exports: connect, disconnect, get, set, del, exists
 */

import * as jobCache from '../database/job-cache.js';

const isFn = (v) => typeof v === 'function';

// In-memory fallback store with TTL
const store = new Map();
const timers = new Map();

function fallbackSet(key, value, ttlSeconds) {
  store.set(key, value);
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
    const t = setTimeout(() => {
      store.delete(key);
      timers.delete(key);
    }, ttlSeconds * 1000);
    timers.set(key, t);
  }
  return Promise.resolve('OK');
}

function fallbackGet(key) {
  return Promise.resolve(store.has(key) ? store.get(key) : null);
}

function fallbackDel(key) {
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  const removed = store.delete(key);
  return Promise.resolve(removed ? 1 : 0);
}

function noop() {
  return Promise.resolve();
}

// Build client by preferring jobCache functions when provided
const client = {
  connect: isFn(jobCache.connect) ? jobCache.connect.bind(jobCache) : noop,
  disconnect: isFn(jobCache.disconnect) ? jobCache.disconnect.bind(jobCache) : noop,

  get: isFn(jobCache.get) ? jobCache.get.bind(jobCache) : (key) => fallbackGet(key),
  set: isFn(jobCache.set)
    ? jobCache.set.bind(jobCache)
    : (key, value, ttlSeconds) => fallbackSet(key, value, ttlSeconds),
  del: isFn(jobCache.del) ? jobCache.del.bind(jobCache) : (key) => fallbackDel(key),

  exists: async (key) => {
    if (isFn(jobCache.exists)) return jobCache.exists(key);
    const v = await (isFn(jobCache.get) ? jobCache.get(key) : fallbackGet(key));
    return v == null ? 0 : 1;
  },

  // Re-export any other named exports from job-cache for compatibility
  ...jobCache
};

export default client;
export const connect = client.connect;
export const disconnect = client.disconnect;
export const get = client.get;
export const set = client.set;
export const del = client.del;
export const exists = client.exists;