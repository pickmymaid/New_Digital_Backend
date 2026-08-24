# Frontend API Reference

Every route below was extracted directly from the route files' middleware
(not from the JSDoc comments, which have a couple of known misalignments
where two HTTP methods share one `@openapi` block) — this list reflects
what the code actually enforces.

**Base URLs**

| Environment | Backend1 (admin/maids/blog/contact/analytics) | Backend2 (auth/payment) |
|---|---|---|
| Local dev (docker-compose.microservices.yml) | `http://localhost:8080` | `http://localhost:8081` |
| Production (via nginx or k8s Ingress) | `https://api.backendpickmymaid.site` | `https://api.backendpickmymaid.site` |

In production both backends sit behind the same host/domain — nginx
(`nginx/nginx.conf`) or the k8s Ingress (`k8s/ingress.yaml`) routes by
path prefix, so the frontend only ever talks to one origin.

**Auth column key**
- `JWT` — send `Authorization: Bearer <token>` (obtained from
  `/api/v1/auth/admin/login`). Admin-only endpoints.
- `Session` — requires an active customer session cookie (set by
  `/api/v2/auth/local` or an OAuth login). The browser sends this
  automatically via `credentials: 'include'` — no header needed.
- `none` — public, no credentials required.

---

## Backend2 — Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/customer/register` | none | |
| POST | `/api/v1/auth/customer/login` | none | |
| POST | `/api/v1/auth/customer/forget-password` | none | |
| POST | `/api/v1/auth/customer/reset-password` | none | reset token passed in `Authorization` header, not a JWT login token |
| POST | `/api/v1/auth/admin/register` | JWT | SA role only |
| POST | `/api/v1/auth/admin/login` | none | |
| POST | `/api/v1/auth/admin/logout` | JWT | |
| GET | `/api/v2/auth/google` | none | redirects to Google OAuth consent |
| GET | `/api/v2/auth/google/redirect` | none | OAuth callback |
| GET | `/api/v2/auth/apple` | none | redirects to Apple Sign-In |
| POST | `/api/v2/auth/apple/redirect` | none | Apple's OAuth callback (POST, not GET) |
| GET | `/api/v2/auth/facebook` | none | redirects to Facebook OAuth |
| GET | `/api/v2/auth/facebook/redirect` | none | OAuth callback |
| POST | `/api/v2/auth/local` | none | email/password login, sets session cookie |
| GET | `/api/v2/auth/login/failed` | none | OAuth failure redirect target |
| GET | `/api/v2/auth/login/success` | none | returns the current session user if any (check `success: true/false` in response, not a hard 401 gate) |
| GET | `/api/v2/auth/logout` | none | destroys the session; only meaningful if one exists |
| POST | `/api/v2/auth/log-error` | none | frontend error reporting sink |

## Backend2 — Payment

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/payment/subscribe` | none | generates a payment gateway token/URL |
| POST | `/api/v1/payment/verify` | none | verifies a payment gateway callback token |
| GET | `/api/v1/payment/` | JWT | SA only — list all payment records |
| POST | `/api/v1/payment/manual-verify` | none | admin tool, no auth gate — use with care |
| GET | `/api/v1/payment/payment-details` | Session | current customer's own payment status |
| POST | `/api/v2/payment/create-payment` | Session | |
| POST | `/api/v2/payment/acknowledge/:ref` | Session | |
| GET | `/api/v2/payment/generate-reciept` | none | `user_id` passed as query param |
| POST | `/api/v2/payment/download-invoice` | none | |

`/internal/verify-payment` also exists on Backend2 but is **not** reachable
from the frontend — it's called only by Backend1's admin controller over
the private service network. See `ARCHITECTURE.md`.

## Backend1 — Admin

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/admin/team` | JWT | SA only |
| DELETE | `/api/v1/admin/team-member/:id` | JWT | SA only |
| PATCH | `/api/v1/admin/team-member/:id` | JWT | SA only — role change |
| GET | `/api/v1/admin/history/:maid_id` | JWT | SA only |
| PUT | `/api/v1/admin/customer-password` | JWT | SA only |
| GET | `/api/v1/admin/customer` | JWT | SA only, paginated |
| POST | `/api/v1/admin/verify-payment` | JWT | SA only — proxies to Backend2 internally |
| GET | `/api/v1/admin/block-user/:user_id` | JWT | SA only |

## Backend1 — Maids / Job Applications

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/job/register` | none | public lead form |
| GET | `/api/v1/job/` | JWT | basic list |
| POST | `/api/v1/job/` | JWT | SA/A — create full profile |
| PUT | `/api/v1/job/` | JWT | SA/A — update |
| DELETE | `/api/v1/job/` | JWT | SA only |
| POST | `/api/v1/job/id` | none | fetch one profile by id (public) |
| POST | `/api/v1/job/id-dashboard` | JWT | SA/A enriched view |
| POST | `/api/v1/job/verify` | JWT | SA only |
| GET | `/api/v1/job/approved` | JWT | SA only |
| GET | `/api/v1/job/all` | none | public paginated listing |
| GET | `/api/v1/job/client-approved` | none | |
| POST | `/api/v1/job/disabled` | JWT | SA/A |
| POST | `/api/v1/job/hire` | JWT | SA/A |
| GET | `/api/v1/job/featured` | none | |
| POST | `/api/v1/job/assured` | JWT | SA/A |
| GET | `/api/v1/job/all-maids-seo` | none | |
| GET | `/api/v1/job/counts` | none | |
| POST | `/api/v1/job/toggle-wishlist` | none | `user_id` passed in body |
| GET | `/api/v1/job/wishlist` | none | `user_id` passed as query param |
| POST | `/api/v1/job/findjob` | JWT | SA/A — job listing create |
| GET | `/api/v1/job/findjob` | JWT | SA/A — job listing admin view |
| DELETE | `/api/v1/job/findjob` | JWT | SA only |
| GET | `/api/v1/job/find` | none | public job listings |
| POST | `/api/v1/job/find-search` | none | |
| GET | `/api/v2/maids/find/:page` | none | advanced filtered/paginated search |

## Backend1 — Blog

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/blog/` | JWT | SA/Marketing |
| PUT | `/api/v1/blog/edit/:id` | JWT | SA/Marketing |
| DELETE | `/api/v1/blog/:id` | JWT | SA/Marketing |
| PUT | `/api/v1/blog/delete-comment` | JWT | SA/Marketing |
| GET | `/api/v1/blog/blogs-admin` | JWT | SA/Marketing |
| GET | `/api/v1/blog/slug-check` | JWT | SA/Marketing |
| PUT | `/api/v1/blog/comment` | Session | customer commenting |
| GET | `/api/v1/blog/page/:page` | none | public paginated list |
| GET | `/api/v1/blog/id/:id` | none | public, by id or slug |
| PUT | `/api/v1/blog/like` | Session | |

## Backend1 — Contact

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/contact/` | none | public form submit |
| GET | `/api/v1/contact/` | JWT | SA/A — list submissions |

## Backend1 — Analytics

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/analytics/category-usage` | none | |
| GET | `/api/v1/analytics/category-analytics` | JWT | SA only |
| POST | `/api/v1/analytics/email-click-capture` | none | |

## Backend1 — Internal/debug

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/test/send-test-email` | none | gated by a hardcoded key in the body, not real auth — debug tool only |

---

Response envelope (same on every route, both backends):
```jsonc
// success
{ "status": "OK", "statusCode": 200, "message": "...", "data": { /* payload */ } }
// error
{ "status": "Bad request", "statusCode": 400, "message": "...", ...extra }
```
See `Backend1/src/utils/responseHandler/responseHandler.js` /
`Backend2/src/utils/responseHandler/responseHandler.js` for the exact
shape per status key (`OK`, `CREATED`, `BAD_REQUEST`, `UNAUTHORIZED`,
`NOT_FOUND`, `INTERNAL_SERVER_ERROR`).
