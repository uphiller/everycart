import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { config } from './config';

const jwks = createRemoteJWKSet(new URL(`${config.keycloak.issuer}/protocol/openid-connect/certs`));

export type AuthUser = {
  sub: string;
  preferredUsername: string | null;
  email: string | null;
  realmRoles: string[];
  payload: JWTPayload;
};

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.keycloak.issuer,
  });

  const sub = typeof payload.sub === 'string' ? payload.sub : null;
  if (!sub) {
    throw new Error('INVALID_TOKEN_SUB');
  }

  const preferredUsername =
    typeof payload.preferred_username === 'string' ? payload.preferred_username : null;
  const email = typeof payload.email === 'string' ? payload.email : null;

  const realmAccess = payload.realm_access as { roles?: unknown } | undefined;
  const roles = Array.isArray(realmAccess?.roles)
    ? realmAccess!.roles.filter((r): r is string => typeof r === 'string')
    : [];

  return {
    sub,
    preferredUsername,
    email,
    realmRoles: roles,
    payload,
  };
}
