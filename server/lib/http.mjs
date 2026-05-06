export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
}

export function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

export function notFound() {
  throw new HttpError(404, 'NOT_FOUND', 'Endpoint not found.');
}
