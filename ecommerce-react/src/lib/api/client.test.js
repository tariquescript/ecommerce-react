import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __testing, get, peek, prefetch, seed } from './client.js';

const json = (body, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('api client cache', () => {
  let fetchMock;

  beforeEach(() => {
    __testing.cache.clear();
    __testing.inflight.clear();
    fetchMock = vi.fn(() => json([{ id: 'fresh' }]));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('peek reads the cache without ever touching the network', () => {
    expect(peek('/api/products')).toBeUndefined();
    seed('/api/products', [{ id: 'snapshot' }]);
    expect(peek('/api/products')).toEqual([{ id: 'snapshot' }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves a seeded snapshot instantly and revalidates it', async () => {
    seed('/api/products', [{ id: 'snapshot' }]);

    const { cached, promise } = get('/api/products');
    expect(cached).toEqual([{ id: 'snapshot' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(promise).resolves.toEqual([{ id: 'fresh' }]);
    expect(peek('/api/products')).toEqual([{ id: 'fresh' }]);
  });

  it('never overwrites real data with a later seed', async () => {
    await get('/api/products').promise;
    seed('/api/products', [{ id: 'snapshot' }]);
    expect(peek('/api/products')).toEqual([{ id: 'fresh' }]);
  });

  it('de-duplicates concurrent reads into one request', () => {
    prefetch('/api/products');
    get('/api/products');
    get('/api/products');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lets a failed prefetch fail quietly, leaving the error to the reader', async () => {
    fetchMock.mockImplementation(() => json({ error: 'Not found' }, 404));

    // An unhandled rejection here would fail the run.
    prefetch('/api/products');
    await flush();

    await expect(get('/api/products').promise).rejects.toThrow('Not found');
  });
});
