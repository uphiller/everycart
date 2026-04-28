import { prisma } from './prisma';

export type CartResponse = {
  items: Array<{ productId: string; quantity: number }>;
  totalQuantity: number;
};

function toResponse(items: Array<{ productId: string; quantity: number; id?: number }>): CartResponse {
  const sorted = [...items].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  const mapped = sorted.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  return {
    items: mapped,
    totalQuantity: mapped.reduce((sum, i) => sum + i.quantity, 0),
  };
}

export async function getCart(userSub: string): Promise<CartResponse> {
  const cart = await prisma.cart.findUnique({
    where: { userSub },
    include: { items: true },
  });
  if (!cart) {
    return { items: [], totalQuantity: 0 };
  }
  return toResponse(cart.items);
}

async function ensureCart(userSub: string) {
  return prisma.cart.upsert({
    where: { userSub },
    update: {},
    create: { userSub },
  });
}

export async function addCartItem(userSub: string, productId: string, quantity: number): Promise<CartResponse> {
  const cart = await ensureCart(userSub);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await tx.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }
  });

  return getCart(userSub);
}

export async function updateCartItem(userSub: string, productId: string, quantity: number): Promise<CartResponse> {
  const cart = await ensureCart(userSub);
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (!existing) {
    return getCart(userSub);
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
  }

  return getCart(userSub);
}

export async function removeCartItem(userSub: string, productId: string): Promise<CartResponse> {
  const cart = await ensureCart(userSub);
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });
  if (existing) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  }
  return getCart(userSub);
}

export async function clearCart(userSub: string): Promise<CartResponse> {
  const cart = await ensureCart(userSub);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return { items: [], totalQuantity: 0 };
}
