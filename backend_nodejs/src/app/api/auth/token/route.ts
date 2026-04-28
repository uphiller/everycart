import { z } from 'zod';
import { error, json } from '@/lib/http';
import { issuePasswordToken } from '@/lib/keycloak';

const bodySchema = z.object({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return error(400, '요청값이 올바르지 않습니다.');
    }

    const token = await issuePasswordToken(parsed.data.username, parsed.data.password);
    return json(token);
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      return error(401, '아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    return error(502, 'Keycloak 토큰 발급에 실패했습니다.');
  }
}
