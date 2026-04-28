# Everycart

Keycloak 기반 인증(아이디/비밀번호 + Google OIDC)과 장바구니 기능을 포함한 쇼핑몰 데모 프로젝트입니다.

- Backend: Spring Boot 3, Spring Security (OAuth2 Resource Server), JPA, OpenFeign
- Frontend: React 19, Vite, TypeScript, React Router
- Infra(Local): Postgres + Keycloak (Docker Compose)

---

## 프로젝트 구조

- `backend_java`: Spring Boot API 서버
- `front`: React 프론트엔드
- `infra`: 로컬 개발용 Postgres/Keycloak docker compose

---

## 로컬 실행 순서

## 1) 인프라 실행

```bash
cd infra
docker compose up -d
```

기본 포트:
- Postgres: `5432`
- Keycloak: `8180` (`http://localhost:8180`)

## 2) 백엔드 실행

```bash
cd backend_java
./gradlew bootRun
```

백엔드 기본 URL: `http://localhost:8080`

## 3) 프론트 실행

```bash
cd front
npm install
npm run dev
```

프론트 기본 URL: `http://localhost:5173`

---

## 환경 설정

## Backend (`backend_java/src/main/resources/application-local.yml`)

핵심 설정:
- `spring.security.oauth2.resourceserver.jwt.issuer-uri`: `http://localhost:8180/realms/everycart`
- `everycart.keycloak.server-url`: `http://localhost:8180`
- `everycart.keycloak.realm`: `everycart`
- `everycart.keycloak.user-token-client-id`: `${EVERYCART_KEYCLOAK_USER_CLIENT_ID:web}`

추가 로그 설정:
- `logging.level.web: DEBUG`
- `logging.level.org.hibernate.SQL: DEBUG`
- `logging.level.org.hibernate.orm.jdbc.bind: TRACE`

## Front (`front/.env.development`)

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_OIDC_AUTHORITY=http://localhost:8180/realms/everycart
VITE_OIDC_CLIENT_ID=web
```

---

## 인증/회원 API

컨트롤러: `backend_java/src/main/java/com/everycart/auth/AuthController.java`

- `POST /api/auth/token` : 아이디/비밀번호 로그인 토큰 발급
- `POST /api/auth/token/refresh` : refresh token으로 access/refresh 재발급
- `POST /api/auth/register` : 회원가입(Keycloak 사용자 생성)
- `GET /api/auth/me` : 현재 로그인 사용자 정보

`/api/auth/me` 응답 예시:

```json
{
  "subject": "...",
  "preferredUsername": "user1",
  "email": "user1@example.com",
  "realmRoles": ["user"]
}
```

---

## Google 로그인(프론트)

프론트는 Keycloak OIDC Authorization Code + PKCE를 사용합니다.

관련 파일:
- `front/src/lib/keycloakOidc.ts`
- `front/src/pages/Login.tsx`
- `front/src/pages/AuthCallback.tsx`

동작 요약:
1. 로그인 페이지에서 `Google로 계속하기` 클릭
2. Keycloak auth endpoint로 이동 (`kc_idp_hint=google`)
3. 콜백(`/auth/callback`)에서 code 교환
4. 토큰 저장 후 `/api/auth/me` 호출로 사용자 상태 확정

Keycloak 설정 체크리스트:
- realm: `everycart`
- 클라이언트: public, Standard Flow, PKCE
- Redirect URI: `http://localhost:5173/auth/callback`
- Web Origins: `http://localhost:5173`
- Identity Providers에 Google 연동

---

## 장바구니 API (JPA)

컨트롤러: `backend_java/src/main/java/com/everycart/cart/CartController.java`

인증 필요(`Bearer`):
- `GET /api/cart` : 장바구니 조회
- `POST /api/cart/items` : 상품 담기
- `PATCH /api/cart/items/{productId}` : 수량 변경 (0이면 제거)
- `DELETE /api/cart/items/{productId}` : 특정 상품 제거
- `DELETE /api/cart` : 장바구니 비우기

도메인:
- `Cart` (`carts`)
- `CartItem` (`cart_items`, `(cart_id, product_id)` unique)

사용자 구분:
- JWT `sub` 기준으로 사용자별 장바구니 분리

---

## 프론트 장바구니 연동

관련 파일:
- `front/src/api/cart.ts`
- `front/src/context/CartContext.tsx`
- `front/src/components/ProductCard.tsx`
- `front/src/pages/Cart.tsx`

동작:
- 상품 카드의 `장바구니` 버튼이 백엔드 `POST /api/cart/items` 호출
- `/cart` 페이지에서 수량 변경/삭제/전체 비우기 API 호출
- 헤더 장바구니 뱃지는 `CartContext` 상태와 연동

주의:
- 로그인되지 않은 경우 장바구니 API 호출 시 에러 메시지 표시

---

## 로그

## 애플리케이션 로그 포맷

파일: `backend_java/src/main/resources/logback-spring.xml`

- 콘솔 로그 포맷 및 기본 로그 레벨 설정
- `com.everycart` DEBUG

## API 호출 로그

현재는 `web: DEBUG`로 요청 흐름 확인 가능.

참고:
- 요청/응답을 access-log 형태로 확실히 보려면 톰캣 accesslog 또는 별도 필터 방식 사용 가능

---

## 빌드/검증

## Backend

```bash
cd backend_java
./gradlew compileJava
```

## Front

```bash
cd front
npm run build
```

---

## 다음 개선 아이디어

- 프론트 장바구니 에러 처리 `alert` -> 토스트 UI로 개선
- 장바구니 상품 정보를 제품 마스터 API/DB 기준으로 조회하도록 확장
- Google 로그인/로그아웃 UX(리다이렉트, 세션 만료 처리) 보강
- 프로파일별 로깅 정책(local/dev/prod) 분리
