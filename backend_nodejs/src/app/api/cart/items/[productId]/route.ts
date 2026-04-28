import { z } from 'zod';
import { removeCartItem, updateCartItem } from '@/lib/cart';
import { verifyAccessToken } from '@/lib/auth';
import { parseBearerToken, error, json } from '@/lib/http';

const bodySchema = z.object({
  quantity: z.number().int().min(0),
});

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

function validateProductId(productId: string) {
  return typeof productId === 'string' && productId.length > 0 && productId.length <= 64;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const sub = await resolveUserSub(request);
  if (!sub) {
    return error(401, '토큰 없음 또는 유효하지 않음');
  }

  const { productId } = await params;
  if (!validateProductId(productId)) {
    return error(400, '요청값이 올바르지 않습니다.');
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return error(400, '요청값이 올바르지 않습니다.');
  }

  const cart = await updateCartItem(sub, productId, parsed.data.quantity);
  return json(cart);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const sub = await resolveUserSub(request);
  if (!sub) {
    return error(401, '토큰 없음 또는 유효하지 않음');
  }

  const { productId } = await params;
  if (!validateProductId(productId)) {
    return error(400, '요청값이 올바르지 않습니다.');
  }

  const cart = await removeCartItem(sub, productId);
  return json(cart);
}
