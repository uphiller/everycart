import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Header() {
  const { itemCount } = useCart();
  const { ready, isAuthenticated, displayName, signOut } = useAuth();

  return (
    <header className="site-header">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <p className="top-bar-msg">
            회원가입 시 적립금 2,000P · 3만원 이상 무료배송
          </p>
          <ul className="top-links">
            {!ready ? (
              <li className="top-auth-pending" aria-hidden>
                · · ·
              </li>
            ) : isAuthenticated ? (
              <>
                <li className="top-user">
                  <span className="top-user-name" title={displayName}>
                    {displayName}님
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    className="top-link-button"
                    onClick={() => signOut()}
                  >
                    로그아웃
                  </button>
                </li>
                <li>
                  <a href="#mypage">마이쇼핑</a>
                </li>
                <li>
                  <a href="#order">주문조회</a>
                </li>
                <li>
                  <a href="#cs">고객센터</a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">로그인</Link>
                </li>
                <li>
                  <a href="#join">회원가입</a>
                </li>
                <li>
                  <a href="#order">주문조회</a>
                </li>
                <li>
                  <a href="#cs">고객센터</a>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="container header-main">
        <Link to="/" className="logo">
          <span className="logo-mark">EC</span>
          <span className="logo-text">
            에브리카트 <em>베이커리</em>
          </span>
        </Link>

        <div className="search-wrap">
          <label className="sr-only" htmlFor="site-search">
            상품 검색
          </label>
          <input
            id="site-search"
            type="search"
            placeholder="검색어를 입력해 주세요"
            className="search-input"
          />
          <button type="button" className="search-btn" aria-label="검색">
            검색
          </button>
        </div>

        <div className="header-actions">
          <button type="button" className="icon-btn" title="관심상품">
            ♥
          </button>
          <Link to="/cart" className="icon-btn cart-link" title="장바구니">
            <span className="cart-icon">🛒</span>
            {itemCount > 0 && (
              <span className="cart-badge">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
