import { z } from 'zod';
import { error, json } from '@/lib/http';
import { refreshToken } from '@/lib/keycloak';

const bodySchema = z.object({
  refreshToken: z.string().trim().min(1).max(8192),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return error(400, '요청값이 올바르지 않습니다.');
    }

    const token = await refreshToken(parsed.data.refreshToken);
    return json(token);
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      return error(401, '리프레시 토큰이 유효하지 않거나 만료되었습니다.');
    }
    return error(502, 'Keycloak 토큰 발급에 실패했습니다.');
  }
}
