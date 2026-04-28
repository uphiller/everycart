export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3 className="footer-brand">에브리카트 베이커리</h3>
          <p className="footer-tagline">
            정성으로 구워 행복한 맛을 전해 드리기 위해 오늘도 노력합니다.
          </p>
        </div>
        <div>
          <h4>고객센터</h4>
          <p className="footer-phone">1588-0000</p>
          <p className="footer-hours">평일 09:00 – 18:00 (점심 12:00 – 13:00)</p>
        </div>
        <div>
          <h4>바로가기</h4>
          <ul className="footer-links">
            <li>
              <a href="#notice">공지사항</a>
            </li>
            <li>
              <a href="#faq">이용안내 (FAQ)</a>
            </li>
            <li>
              <a href="#review">상품 후기</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-legal">
          <p>
            상호: 에브리카트 데모몰 · 대표: 데모 · 사업자등록번호: 000-00-00000
            <br />
            주소: 서울특별시 데모구 데모로 1 · 통신판매업 신고: 제0000-서울-0000호
            <br />
            개인정보관리책임자: 데모 (demo@example.com)
          </p>
          <p className="copyright">
            COPYRIGHT © {new Date().getFullYear()} EVERYCART BAKERY DEMO. ALL RIGHTS
            RESERVED.
          </p>
          <p className="demo-note">
            본 페이지는 학습·데모용 UI이며 bakery.co.kr 스타일을 참고했습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
