// Bound JSON API request memory independently of Git smart HTTP RPC streams.
export const MAX_JSON_BODY_BYTES = 1024 * 1024;

export class JsonRequestError extends Error {
  constructor(statusCode, code) {
    super(code);
    this.statusCode = statusCode;
  }
}

export async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.length;
    if (total > MAX_JSON_BODY_BYTES) {
      throw new JsonRequestError(413, 'request-body-too-large');
    }
    chunks.push(bytes);
  }
  const text = Buffer.concat(chunks, total).toString('utf8');
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new JsonRequestError(400, 'invalid-json');
  }
}
