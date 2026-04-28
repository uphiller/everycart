/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** 예: http://localhost:8180/realms/everycart */
  readonly VITE_OIDC_AUTHORITY?: string;
  /** Keycloak public client (Standard flow, PKCE) */
  readonly VITE_OIDC_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
