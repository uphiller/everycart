export function Hero() {
  return (
    <section className="hero" aria-label="메인 배너">
      <div className="hero-slide hero-slide-a">
        <div className="container hero-content">
          <p className="hero-eyebrow">시즌 한정</p>
          <h2>
            갓 구운 빵,
            <br />
            집 앞까지 배송
          </h2>
          <p className="hero-desc">
            BEST 라인업 최대 15% · 3만원 이상 무료배송
          </p>
          <a href="#best" className="btn btn-primary">
            인기상품 보기
          </a>
        </div>
      </div>
      <div className="hero-dots" aria-hidden>
        <span className="dot active" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </section>
  );
}
