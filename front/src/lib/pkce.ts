/** RFC 7636: PKCE code_verifier / code_challenge (S256) */

const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

function randomVerifier(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CHARSET[array[i] % CHARSET.length];
  }
  return out;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 43~128자 ASCII code_verifier
 */
export function createCodeVerifier(): string {
  return randomVerifier(64);
}

/**
 * S256 code_challenge
 */
export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}
