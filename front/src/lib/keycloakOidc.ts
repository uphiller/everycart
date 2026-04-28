import { createCodeChallenge, createCodeVerifier } from './pkce';

const PKCE_STORAGE = 'everycart.oidc.pkce';
const REMEMBER_STORAGE = 'everycart.oidc.remember';

function authority(): string | undefined {
  return (import.meta.env.VITE_OIDC_AUTHORITY as string | undefined)?.replace(
    /\/$/,
    '',
  );
}

function clientId(): string | undefined {
  return import.meta.env.VITE_OIDC_CLIENT_ID as string | undefined;
}

export function redirectUri(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/callback`;
}

export function isGoogleLoginConfigured(): boolean {
  return Boolean(authority() && clientId());
}

/**
 * Google IdP (Keycloak 브로커) — kc_idp_hint=google
 */
export async function startGoogleLogin(remember: boolean): Promise<void> {
  const iss = authority();
  const cid = clientId();
  if (!iss || !cid) {
    throw new Error(
      'VITE_OIDC_AUTHORITY, VITE_OIDC_CLIENT_ID 환경 변수를 설정해 주세요.',
    );
  }

  const codeVerifier = createCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  sessionStorage.setItem(PKCE_STORAGE, codeVerifier);
  sessionStorage.setItem(REMEMBER_STORAGE, remember ? '1' : '0');

  const url = new URL(`${iss}/protocol/openid-connect/auth`);
  url.searchParams.set('client_id', cid);
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('kc_idp_hint', 'google');

  window.location.assign(url.toString());
}

export type OidcTokenPayload = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string;
  remember: boolean;
};

export async function exchangeCodeForTokens(code: string): Promise<OidcTokenPayload> {
  const iss = authority();
  const cid = clientId();
  if (!iss || !cid) {
    throw new Error('OIDC 설정이 없습니다.');
  }

  const codeVerifier = sessionStorage.getItem(PKCE_STORAGE);
  const remember = sessionStorage.getItem(REMEMBER_STORAGE) === '1';

  if (!codeVerifier) {
    throw new Error(
      '로그인 세션이 없습니다. 로그인 페이지에서 다시 시도해 주세요.',
    );
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cid,
    code,
    redirect_uri: redirectUri(),
    code_verifier: codeVerifier,
  });

  const res = await fetch(`${iss}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    let msg = '토큰을 받지 못했습니다.';
    try {
      const j = (await res.json()) as { error_description?: string; error?: string };
      if (j.error_description) msg = j.error_description;
      else if (j.error) msg = j.error;
    } catch {
      /* use default */
    }
    throw new Error(msg);
  }

  const j = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type: string;
  };

  sessionStorage.removeItem(PKCE_STORAGE);
  sessionStorage.removeItem(REMEMBER_STORAGE);

  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token ?? null,
    expiresIn: j.expires_in != null ? j.expires_in : null,
    tokenType: j.token_type,
    remember,
  };
}
