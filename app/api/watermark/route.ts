import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET() {
  return new Response(JSON.stringify({ error: 'Method GET not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
