import crypto from 'node:crypto';
import type {VercelRequest, VercelResponse} from '@vercel/node';
import {sql} from '@vercel/postgres';

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

  const shop = request.headers['x-shopify-shop-domain'];
  if (typeof shop !== 'string') return response.status(400).json({error: 'Missing shop domain'});

  const order = JSON.parse(body.toString()) as {id?: number | string; created_at?: string};
  if (order.id == null) return response.status(400).json({error: 'Missing order id'});

  const createdAt = order.created_at ? new Date(order.created_at) : new Date();
  const month = createdAt.toISOString().slice(0, 7);
  const inserted = await sql`
    insert into processed_orders (shop_domain, order_id, created_at)
    values (${shop}, ${String(order.id)}, ${createdAt.toISOString()})
    on conflict (shop_domain, order_id) do nothing
    returning order_id
  `;

  if (inserted.rows.length) {
    await sql`
      insert into monthly_order_usage (shop_domain, billing_month, order_count)
      values (${shop}, ${month}, 1)
      on conflict (shop_domain, billing_month)
      do update set order_count = monthly_order_usage.order_count + 1
    `;
  }

  return response.status(200).json({ok: true, counted: inserted.rows.length === 1});
}
