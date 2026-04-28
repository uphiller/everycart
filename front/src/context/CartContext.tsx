import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  addCartItem,
  clearCartItems,
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
  type CartResponse,
} from '../api/cart';
import { useAuth } from './AuthContext';
import { products, type Product } from '../data/products';

const productMap = new Map(products.map((p) => [p.id, p] as const));

type CartContextValue = {
  lines: Array<{ product: Product; qty: number }>;
  addToCart: (product: Product, qty?: number) => Promise<void>;
  removeLine: (productId: string) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  reloadCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function toLines(response: CartResponse): Array<{ product: Product; qty: number }> {
  return response.items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      return { product, qty: item.quantity };
    })
    .filter((v): v is { product: Product; qty: number } => v !== null);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, ready } = useAuth();
  const [lines, setLines] = useState<Array<{ product: Product; qty: number }>>([]);

  const applyResponse = useCallback((response: CartResponse) => {
    setLines(toLines(response));
  }, []);

  const reloadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setLines([]);
      return;
    }
    const response = await fetchCart();
    applyResponse(response);
  }, [isAuthenticated, applyResponse]);

  useEffect(() => {
    if (!ready) return;
    void reloadCart().catch(() => {
      setLines([]);
    });
  }, [ready, reloadCart]);

  const addToCart = useCallback(
    async (product: Product, qty = 1) => {
      if (!isAuthenticated) {
        throw new Error('로그인이 필요합니다.');
      }
      const response = await addCartItem(product.id, qty);
      applyResponse(response);
    },
    [isAuthenticated, applyResponse],
  );

  const removeLine = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        throw new Error('로그인이 필요합니다.');
      }
      const response = await removeCartItem(productId);
      applyResponse(response);
    },
    [isAuthenticated, applyResponse],
  );

  const setQty = useCallback(
    async (productId: string, qty: number) => {
      if (!isAuthenticated) {
        throw new Error('로그인이 필요합니다.');
      }
      const response = await updateCartItemQuantity(productId, Math.max(0, qty));
      applyResponse(response);
    },
    [isAuthenticated, applyResponse],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('로그인이 필요합니다.');
    }
    const response = await clearCartItems();
    applyResponse(response);
  }, [isAuthenticated, applyResponse]);

  const { itemCount, subtotal } = useMemo(() => {
    return lines.reduce(
      (acc, line) => ({
        itemCount: acc.itemCount + line.qty,
        subtotal: acc.subtotal + line.product.price * line.qty,
      }),
      { itemCount: 0, subtotal: 0 },
    );
  }, [lines]);

  const value = useMemo(
    () => ({
      lines,
      addToCart,
      removeLine,
      setQty,
      clearCart,
      reloadCart,
      itemCount,
      subtotal,
    }),
    [lines, addToCart, removeLine, setQty, clearCart, reloadCart, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
