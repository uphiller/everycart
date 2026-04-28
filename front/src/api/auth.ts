import { clearAuth, saveAuth, type StoredAuth } from '../lib/authStorage';

const baseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8080';

export type TokenIssueResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string;
};

/** Spring AuthUserResponse — /api/auth/me */
export type AuthUserResponse = {
  subject: string;
  preferredUsername: string | null;
  email: string | null;
  realmRoles: string[];
};

/**
 * GET /api/auth/me
 * 401·403 시 `null` (호출 측에서 clearAuth·상태 정리)
 */
export async function fetchCurrentUser(
  accessToken: string,
): Promise<AuthUserResponse | null> {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    clearAuth();
    return null;
  }

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new Error(msg);
  }

  return (await res.json()) as AuthUserResponse;
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) {
    if (res.status === 401) return '아이디 또는 비밀번호가 올바르지 않습니다.';
    return '로그인에 실패했습니다.';
  }
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    const msg =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.detail === 'string' && data.detail) ||
      (typeof data.title === 'string' && data.title) ||
      (typeof data.error === 'string' && data.error);
    if (msg) return msg;
  } catch {
    /* not JSON */
  }
  if (res.status === 401) return '아이디 또는 비밀번호가 올바르지 않습니다.';
  return '로그인에 실패했습니다.';
}

/**
 * Keycloak password grant — POST /api/auth/token
 */
export async function loginWithPassword(
  username: string,
  password: string,
  remember: boolean,
): Promise<TokenIssueResponse> {
  const res = await fetch(`${baseUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  const data = (await res.json()) as TokenIssueResponse;
  const stored: StoredAuth = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
    tokenType: data.tokenType,
    expiresIn: data.expiresIn ?? null,
  };
  saveAuth(stored, remember);
  return data;
}
