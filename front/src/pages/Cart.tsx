import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function formatPrice(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n);
}

export function Cart() {
  const { lines, setQty, removeLine, subtotal, clearCart } = useCart();

  if (lines.length === 0) {
    return (
      <div className="container cart-page">
        <h1 className="page-title">장바구니</h1>
        <div className="cart-empty">
          <p>장바구니에 담긴 상품이 없습니다.</p>
          <Link to="/" className="btn btn-primary">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1 className="page-title">장바구니</h1>
      <div className="cart-layout">
        <ul className="cart-lines">
          {lines.map(({ product, qty }) => (
            <li key={product.id} className="cart-line">
              <img
                src={product.image}
                alt=""
                width={96}
                height={96}
                className="cart-line-img"
              />
              <div className="cart-line-info">
                <h2>{product.name}</h2>
                <p className="cart-line-price">{formatPrice(product.price)}원</p>
              </div>
              <div className="cart-line-qty">
                <button
                  type="button"
                  aria-label="수량 감소"
                  onClick={async () => {
                    try {
                      await setQty(product.id, qty - 1);
                    } catch (e) {
                      alert(e instanceof Error ? e.message : '수량 변경에 실패했습니다.');
                    }
                  }}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  aria-label="수량 증가"
                  onClick={async () => {
                    try {
                      await setQty(product.id, qty + 1);
                    } catch (e) {
                      alert(e instanceof Error ? e.message : '수량 변경에 실패했습니다.');
                    }
                  }}
                >
                  +
                </button>
              </div>
              <p className="cart-line-sum">
                {formatPrice(product.price * qty)}원
              </p>
              <button
                type="button"
                className="cart-remove"
                onClick={async () => {
                  try {
                    await removeLine(product.id);
                  } catch (e) {
                    alert(e instanceof Error ? e.message : '상품 삭제에 실패했습니다.');
                  }
                }}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
        <aside className="cart-summary">
          <h2>주문 요약</h2>
          <dl className="summary-rows">
            <div>
              <dt>상품금액</dt>
              <dd>{formatPrice(subtotal)}원</dd>
            </div>
            <div>
              <dt>배송비</dt>
              <dd>3만원 이상 무료</dd>
            </div>
          </dl>
          <p className="summary-total">
            <span>합계</span>
            <strong>{formatPrice(subtotal)}원</strong>
          </p>
          <button type="button" className="btn btn-primary btn-block">
            주문하기 (데모)
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={async () => {
              try {
                await clearCart();
              } catch (e) {
                alert(e instanceof Error ? e.message : '장바구니 비우기에 실패했습니다.');
              }
            }}
          >
            전체 비우기
          </button>
          <Link to="/" className="back-shop">
            ← 쇼핑 계속하기
          </Link>
        </aside>
      </div>
    </div>
  );
}
