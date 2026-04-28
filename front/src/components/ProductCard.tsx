import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';

type Props = { product: Product };

function formatPrice(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n);
}

export function ProductCard({ product }: Props) {
  const { addToCart } = useCart();

  return (
    <article className="product-card">
      <div className="product-thumb">
        <img src={product.image} alt="" loading="lazy" width={280} height={280} />
        {product.badge && (
          <span className={`product-badge badge-${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        )}
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">
          <strong>{formatPrice(product.price)}</strong>원
        </p>
        <div className="product-actions">
          <button
            type="button"
            className="btn btn-cart"
            onClick={async () => {
              try {
                await addToCart(product, 1);
              } catch (e) {
                alert(e instanceof Error ? e.message : '장바구니 추가에 실패했습니다.');
              }
            }}
          >
            장바구니
          </button>
          <button type="button" className="btn btn-ghost">
            찜
          </button>
        </div>
      </div>
    </article>
  );
}
