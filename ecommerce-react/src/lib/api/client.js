/**
 * Minimal HTTP client built on native fetch.
 *
 * Replaces axios (~14 KB gz) with ~2 KB and adds the three things this app
 * actually needs against a cold-starting serverless API:
 *
 *   1. in-flight de-duplication  — a burst of identical GETs costs one request
 *   2. stale-while-revalidate    — cached data paints instantly, refreshes behind
 *   3. bounded retry with backoff — a cold lambda's first 502 is not a failure
 */

/**
 * Empty in development so requests stay same-origin and ride the Vite proxy;
 * the deployed origin is injected at build time from .env.production.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

const TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;
/** How long a cached GET is served without a background refresh. */
const FRESH_MS = 30_000;

/** @type {Map<string, {data: unknown, at: number}>} */
const cache = new Map();
/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

export class ApiError extends Error {
  constructor(message, status, path) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 5xx and network-level failures are worth another shot; 4xx never is. */
const isRetryable = (error) => !(error instanceof ApiError) || error.status >= 500;

async function execute(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new ApiError(detail?.error || `Request failed (${response.status})`, response.status, path);
    }

    // 204 No Content — DELETE returns this.
    if (response.status === 204) return null;
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function withRetry(path, options) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await execute(path, options);
    } catch (error) {
      // A caller-cancelled request is not an error worth retrying or reporting.
      if (options?.signal?.aborted) throw error;
      lastError = error;
      if (attempt === MAX_RETRIES || !isRetryable(error)) break;
      await sleep(2 ** attempt * 300);
    }
  }
  throw lastError;
}

/**
 * Cached GET.
 * @param {string} path
 * @param {{ signal?: AbortSignal, revalidate?: boolean }} [options]
 * @returns {{ cached: unknown | undefined, promise: Promise<unknown> }}
 */
export function get(path, { signal, revalidate = true } = {}) {
  const entry = cache.get(path);
  const isFresh = entry && Date.now() - entry.at < FRESH_MS;

  if (isFresh && !revalidate) {
    return { cached: entry.data, promise: Promise.resolve(entry.data) };
  }

  let promise = inflight.get(path);
  if (!promise) {
    promise = withRetry(path, { signal })
      .then((data) => {
        cache.set(path, { data, at: Date.now() });
        return data;
      })
      .finally(() => inflight.delete(path));
    inflight.set(path, promise);
  }

  return { cached: entry?.data, promise };
}

/** Uncached GET that always resolves to data — for one-shot reads. */
export const fetchJson = (path, options) => get(path, options).promise;

/** Any write invalidates the reads it could have changed. */
function invalidate(prefixes) {
  for (const key of cache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) cache.delete(key);
  }
}

const mutate = (method) => (path, body) =>
  withRetry(path, { method, body }).then((data) => {
    invalidate(['/api/cart-items', '/api/payment-summary', '/api/orders']);
    return data;
  });

export const post = mutate('POST');
export const put = mutate('PUT');
export const del = mutate('DELETE');

/** Warm the cache before React asks for it — called from the entry module. */
export function prefetch(path) {
  if (!cache.has(path) && !inflight.has(path)) get(path);
}

export const __testing = { cache, inflight };
