import { clearAuth, getAccessToken } from '../lib/authStorage';

const baseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8080';

export type CartItemDto = {
  productId: string;
  quantity: number;
};

export type CartResponse = {
  items: CartItemDto[];
  totalQuantity: number;
};

function requireAccessToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }
  return token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = requireAccessToken();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    clearAuth();
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '장바구니 요청에 실패했습니다.');
  }

  return (await res.json()) as T;
}

export function fetchCart(): Promise<CartResponse> {
  return request<CartResponse>('/api/cart');
}

export function addCartItem(productId: string, quantity: number): Promise<CartResponse> {
  return request<CartResponse>('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateCartItemQuantity(
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  return request<CartResponse>(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(productId: string): Promise<CartResponse> {
  return request<CartResponse>(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

export function clearCartItems(): Promise<CartResponse> {
  return request<CartResponse>('/api/cart', {
    method: 'DELETE',
  });
}
