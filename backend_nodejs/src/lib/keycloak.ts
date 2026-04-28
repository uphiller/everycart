import { config, keycloakAdminUsersUrl, keycloakTokenUrl } from './config';

export type TokenIssueResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string;
};

function toTokenIssueResponse(raw: any): TokenIssueResponse {
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token ?? null,
    expiresIn: typeof raw.expires_in === 'number' ? raw.expires_in : null,
    tokenType: raw.token_type ?? 'Bearer',
  };
}

export async function issuePasswordToken(username: string, password: string): Promise<TokenIssueResponse> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: config.keycloak.userClientId,
    username,
    password,
  });

  const res = await fetch(keycloakTokenUrl(config.keycloak.realm), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('KEYCLOAK_TOKEN_FAILED');
  }

  const json = await res.json();
  if (!json?.access_token) {
    throw new Error('KEYCLOAK_TOKEN_EMPTY');
  }
  return toTokenIssueResponse(json);
}

export async function refreshToken(refreshToken: string): Promise<TokenIssueResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.keycloak.userClientId,
    refresh_token: refreshToken,
  });

  const res = await fetch(keycloakTokenUrl(config.keycloak.realm), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('KEYCLOAK_TOKEN_FAILED');
  }

  const json = await res.json();
  if (!json?.access_token) {
    throw new Error('KEYCLOAK_TOKEN_EMPTY');
  }
  return toTokenIssueResponse(json);
}

async function fetchAdminAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: config.keycloak.adminClientId,
    username: config.keycloak.adminUsername,
    password: config.keycloak.adminPassword,
  });

  const res = await fetch(keycloakTokenUrl(config.keycloak.adminTokenRealm), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('KEYCLOAK_ADMIN_LOGIN_FAILED');
  }
  const json = await res.json();
  if (!json?.access_token) {
    throw new Error('KEYCLOAK_ADMIN_TOKEN_EMPTY');
  }
  return json.access_token as string;
}

export type RegisterResult = {
  id: string;
  username: string;
  email: string;
};

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const adminToken = await fetchAdminAccessToken();

  const res = await fetch(keycloakAdminUsersUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      enabled: true,
      credentials: [
        {
          type: 'password',
          value: input.password,
          temporary: false,
        },
      ],
    }),
    cache: 'no-store',
  });

  if (res.status === 409) {
    throw new Error('CONFLICT');
  }
  if (!res.ok) {
    throw new Error('KEYCLOAK_REGISTER_FAILED');
  }

  const location = res.headers.get('location');
  if (!location) {
    throw new Error('KEYCLOAK_REGISTER_NO_LOCATION');
  }
  const id = location.substring(location.lastIndexOf('/') + 1);
  return {
    id,
    username: input.username,
    email: input.email,
  };
}
