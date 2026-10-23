import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import { MAX_JSON_BODY_BYTES, readJson } from '../apps/forge-api/request-json.mjs';

function request(chunks) {
  return Readable.from(chunks);
}

describe('Forge JSON API request bounds', () => {
  it('accepts ordinary JSON and empty request bodies', async () => {
    expect(await readJson(request([Buffer.from('{"ok":true}')]))).toEqual({ ok: true });
    expect(await readJson(request([]))).toEqual({});
  });

  it('accepts a valid JSON document at the exact byte ceiling', async () => {
    const prefix = '{"data":"';
    const suffix = '"}';
    const body = prefix + 'a'.repeat(MAX_JSON_BODY_BYTES - prefix.length - suffix.length) + suffix;
    expect(Buffer.byteLength(body)).toBe(MAX_JSON_BODY_BYTES);
    const parsed = await readJson(request([Buffer.from(body)]));
    expect(parsed.data.length).toBe(MAX_JSON_BODY_BYTES - prefix.length - suffix.length);
  });

  it('rejects an oversized body delivered in one chunk with HTTP 413', async () => {
    await expect(readJson(request([Buffer.alloc(MAX_JSON_BODY_BYTES + 1, 32)])))
      .rejects.toMatchObject({ statusCode: 413, message: 'request-body-too-large' });
  });

  it('rejects an oversized body delivered across multiple chunks', async () => {
    await expect(readJson(request([Buffer.alloc(MAX_JSON_BODY_BYTES, 32), Buffer.from(' ')])))
      .rejects.toMatchObject({ statusCode: 413, message: 'request-body-too-large' });
  });

  it('returns a client error for malformed JSON rather than an internal error', async () => {
    await expect(readJson(request([Buffer.from('{invalid')])))
      .rejects.toMatchObject({ statusCode: 400, message: 'invalid-json' });
  });
});
