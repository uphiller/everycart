import { z } from 'zod';
import { addCartItem } from '@/lib/cart';
import { verifyAccessToken } from '@/lib/auth';
import { parseBearerToken, error, json } from '@/lib/http';

const bodySchema = z.object({
  productId: z.string().trim().min(1).max(64),
  quantity: z.number().int().positive(),
});

export async function POST(request: Request) {
  const token = parseBearerToken(request.headers.get('authorization'));
  if (!token) {
    return error(401, '토큰 없음 또는 유효하지 않음');
  }

  try {
    const user = await verifyAccessToken(token);
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return error(400, '요청값이 올바르지 않습니다.');
    }

    const cart = await addCartItem(user.sub, parsed.data.productId, parsed.data.quantity);
    return json(cart);
  } catch {
    return error(401, '토큰 없음 또는 유효하지 않음');
  }
}
