import { handleRequest } from '../server/index.mjs';

export default async function handler(request, response) {
  return handleRequest(request, response);
}
