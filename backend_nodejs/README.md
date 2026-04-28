# backend_nodejs

`backend_java`의 인증/장바구니 API를 Next.js + Prisma로 이식한 Node.js 백엔드입니다.

## Stack

- Next.js (App Router Route Handler)
- TypeScript
- Prisma + PostgreSQL
- Keycloak (password/refresh token, JWT verify, user register)

## Run

```bash
npm install
npx prisma generate
# DB 스키마 반영 (최초 1회)
npx prisma db push
npm run dev
```

기본 포트는 `3000`입니다.
(필요 시 `npm run dev -- -p 3001`)

## Environment

`.env.example`를 참고해서 `.env`를 준비합니다.

핵심 변수:
- `DATABASE_URL`
- `KEYCLOAK_SERVER_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_ISSUER`
- `KEYCLOAK_USER_CLIENT_ID`
- `KEYCLOAK_ADMIN_*`

## API

### Auth

- `POST /api/auth/token`
  - body: `{ "username": "...", "password": "..." }`
  - response: `{ accessToken, refreshToken, expiresIn, tokenType }`

- `POST /api/auth/token/refresh`
  - body: `{ "refreshToken": "..." }`
  - response: `{ accessToken, refreshToken, expiresIn, tokenType }`

- `POST /api/auth/register`
  - body: `{ "username": "...", "email": "...", "password": "..." }`
  - response: `{ id, username, email }`

- `GET /api/auth/me`
  - header: `Authorization: Bearer <access_token>`
  - response: `{ subject, preferredUsername, email, realmRoles }`

### Cart (JWT required)

- `GET /api/cart`
- `POST /api/cart/items` body: `{ productId, quantity }`
- `PATCH /api/cart/items/:productId` body: `{ quantity }` (0이면 제거)
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`

response:

```json
{
  "items": [
    { "productId": "1", "quantity": 2 }
  ],
  "totalQuantity": 2
}
```

## Prisma models

- `Cart` (`carts`)
  - `user_sub` unique
- `CartItem` (`cart_items`)
  - `(cart_id, product_id)` unique

## Notes

- 인증 사용자는 JWT `sub`로 구분합니다.
- 프론트(`front`)와 함께 쓸 때 CORS/포트는 별도 프록시 또는 서버 설정으로 맞춰야 합니다.
