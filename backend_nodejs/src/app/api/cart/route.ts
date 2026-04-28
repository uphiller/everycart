import { z } from 'zod';
import { parseBearerToken, error, json } from '@/lib/http';
import { verifyAccessToken } from '@/lib/auth';
import { clearCart, getCart } from '@/lib/cart';

const emptySchema = z.object({}).passthrough();

async function resolveUserSub(request: Request): Promise<string | null> {
  const token = parseBearerToken(request.headers.get('authorization'));
  if (!token) return null;
  try {
    const user = await verifyAccessToken(token);
    return user.sub;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const sub = await resolveUserSub(request);
  if (!sub) {
    return error(401, '토큰 없음 또는 유효하지 않음');
  }
  const cart = await getCart(sub);
  return json(cart);
}

export async function DELETE(request: Request) {
  const sub = await resolveUserSub(request);
  if (!sub) {
    return error(401, '토큰 없음 또는 유효하지 않음');
  }

  // Keep parity with other endpoints' JSON body handling semantics.
  if (request.headers.get('content-type')?.includes('application/json')) {
    const body = await request.json().catch(() => null);
    if (body && !emptySchema.safeParse(body).success) {
      return error(400, '요청값이 올바르지 않습니다.');
    }
  }

  const cart = await clearCart(sub);
  return json(cart);
}
