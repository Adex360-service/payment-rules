import crypto from 'node:crypto';
import type {VercelRequest, VercelResponse} from '@vercel/node';

export const config = {api: {bodyParser: false}};

async function rawBody(request: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function validHmac(body: Buffer, received: string | undefined) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret || !received) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).end();
  const body = await rawBody(request);
  if (!validHmac(body, request.headers['x-shopify-hmac-sha256'] as string | undefined)) {
    return response.status(401).json({error: 'Invalid webhook signature'});
  }

  return response.status(200).json({ok: true});
}
