import { error, json, parseBearerToken } from '@/lib/http';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = parseBearerToken(request.headers.get('authorization'));
    if (!token) {
      return error(401, '토큰 없음 또는 유효하지 않음');
    }

    const user = await verifyAccessToken(token);
    return json({
      subject: user.sub,
      preferredUsername: user.preferredUsername,
      email: user.email,
      realmRoles: user.realmRoles,
    });
  } catch {
    return error(401, '토큰 없음 또는 유효하지 않음');
  }
}
