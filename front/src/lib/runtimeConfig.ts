declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      API_BASE_URL?: string;
    };
  }
}

function trimTrailingSlash(value: string | undefined): string | undefined {
  return value?.replace(/\/$/, '');
}

function runtimeValue(key: keyof NonNullable<Window['__RUNTIME_CONFIG__']>): string | undefined {
  const value = window.__RUNTIME_CONFIG__?.[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function viteValue(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export function apiBaseUrl(fallback = 'http://localhost:8080'): string {
  return (
    trimTrailingSlash(runtimeValue('API_BASE_URL')) ||
    trimTrailingSlash(viteValue('VITE_API_BASE_URL')) ||
    fallback
  );
}
