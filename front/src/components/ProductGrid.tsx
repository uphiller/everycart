import { products } from '../data/products';
import { ProductCard } from './ProductCard';

type Props = { category?: string | null };

export function ProductGrid({ category }: Props) {
  const list = category
    ? products.filter((p) => p.category === category)
    : products;

  return (
    <section className="product-section" id="products">
      <div className="container">
        <div className="section-head">
          <h2>{category ? '카테고리 상품' : 'BEST · 추천 상품'}</h2>
          <p>매일 아침 굽는 빵을 가장 신선하게 보내드립니다.</p>
        </div>
        {list.length === 0 ? (
          <p className="empty-category">이 카테고리에 표시할 상품이 없습니다.</p>
        ) : (
          <div className="product-grid">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
