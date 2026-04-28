import { NextRequest, NextResponse } from 'next/server';

function allowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return ['http://localhost:5173'];
  }
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const allowList = allowedOrigins();
  const isAllowed = allowList.includes(origin);

  if (request.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      preflight.headers.set('Access-Control-Allow-Origin', origin);
      preflight.headers.set('Vary', 'Origin');
    }
    preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    preflight.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    preflight.headers.set('Access-Control-Max-Age', '86400');
    return preflight;
  }

  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
