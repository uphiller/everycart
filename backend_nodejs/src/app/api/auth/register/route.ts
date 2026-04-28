import { z } from 'zod';
import { error, json } from '@/lib/http';
import { registerUser } from '@/lib/keycloak';

const bodySchema = z.object({
  username: z.string().trim().min(3).max(64),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return error(400, '요청값이 올바르지 않습니다.');
    }

    const result = await registerUser(parsed.data);
    return json(result, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'CONFLICT') {
      return error(409, '이미 사용 중인 사용자 이름 또는 이메일입니다.');
    }
    return error(502, 'Keycloak 연동 실패');
  }
}
