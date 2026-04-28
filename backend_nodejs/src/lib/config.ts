function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const config = {
  keycloak: {
    serverUrl: required('KEYCLOAK_SERVER_URL').replace(/\/$/, ''),
    realm: required('KEYCLOAK_REALM'),
    issuer: required('KEYCLOAK_ISSUER').replace(/\/$/, ''),
    userClientId: required('KEYCLOAK_USER_CLIENT_ID'),
    adminTokenRealm: required('KEYCLOAK_ADMIN_TOKEN_REALM'),
    adminClientId: required('KEYCLOAK_ADMIN_CLIENT_ID'),
    adminUsername: required('KEYCLOAK_ADMIN_USERNAME'),
    adminPassword: required('KEYCLOAK_ADMIN_PASSWORD'),
  },
};

export function keycloakTokenUrl(realm: string): string {
  return `${config.keycloak.serverUrl}/realms/${realm}/protocol/openid-connect/token`;
}

export function keycloakAdminUsersUrl(): string {
  return `${config.keycloak.serverUrl}/admin/realms/${config.keycloak.realm}/users`;
}
