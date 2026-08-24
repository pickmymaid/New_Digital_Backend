# Pickmymaid Microservices Architecture

This splits the original `server/` monolith into 2 independently
deployable services — **Backend1** and **Backend2** — each following an
**MVC + Service/Repository layering**, the standard extension of MVC for
REST APIs (a JSON API has no template "View"):

| Classic MVC | Here | Responsibility |
|---|---|---|
| **Model** | `models/` | Mongoose schemas — the only layer that touches collection shape |
| **View** | `utils/responseHandler/` + each controller's JSON shape | REST APIs render JSON, not templates — `responseHandler` is the equivalent of a view-renderer: one consistent response envelope everywhere |
| **Controller** | `controllers/` | Parses `req`, calls a service, shapes the HTTP response. No business logic, no DB access. |
| *(extension)* | `services/` | Business logic and orchestration. Framework-agnostic — no `req`/`res`. |
| *(extension)* | `queries/` | All Mongoose calls live here (repository pattern). |

`routes/` wires `controllers/` to Express, the same role a `routes.rb` or
`urls.py` plays elsewhere.

## The 2 services

- **Backend1** — admin management, maid/job applications, blog, contact,
  analytics. Everything that isn't auth or payment.
- **Backend2** — auth (customer/admin login, registration, Google/
  Facebook/Apple/Local OAuth) **and** payment (subscriptions, invoices,
  N-Genius gateway) combined into one service. These two domains are
  bundled together deliberately: auth is a dependency of payment (every
  payment action needs to know who the customer is) and neither domain
  sees meaningful independent-scaling pressure the way the maid-browsing
  traffic in Backend1 does — splitting them further would just add an
  extra network hop for every payment call with no real isolation
  benefit.

Full route-by-route inventory (every route from the original monolith,
verified to still exist, none dropped): see `FRONTEND_API_REFERENCE.md`.

## Shared MongoDB (deliberate, not a shortcut)

Both services connect to the **same MongoDB instance** via `MONGODB_URI`.
Zero data-migration risk, no need to rebuild cross-domain Mongo
aggregations as API calls, and it still gets you independent deploys/
scaling/failure isolation per service — the main wins people actually
want from "microservices" day one. Full per-service database ownership is
a valid *future* step once traffic/team size justify the migration cost.

One deliberate consequence: `Backend1` has its own copy of
`models/payment/payment.model.js` (used by `admin.service.js`'s
`toggleUserBlock`, which suspends/reactivates a blocked user's
subscription) even though **Backend2 is the logical owner of payment
data**. Safe only because both services point at the same Mongo cluster
with the same schema.

## Session & JWT auth across services

Two auth mechanisms exist, and both had to keep working across the
process boundary:

1. **Admin JWT** (`Authorization: Bearer <token>`) — stateless by
   construction. Both services independently call
   `jwt.verify(token, JWT_SECRET)` with the same shared secret. No calls
   back to Backend2 needed.

2. **Customer session** (`cookie-session`, used by OAuth + local login) —
   `cookie-session` stores the session payload **inside the signed
   cookie itself**, not server-side. Any service running the same
   `cookie-session` config (`name: "session"`, same `COOKIE_KEY`) plus
   the same Passport `serializeUser`/`deserializeUser` pair can decode
   the cookie and populate `req.user`, regardless of which service
   originally set it.

   - `Backend2` owns the *full* Passport config
     (`src/config/passport.js`) — OAuth strategies + local strategy +
     the serialize/deserialize pair. It's the only service with login
     routes.
   - `Backend1` carries a **trimmed** `src/config/passportSession.js` —
     just `serializeUser`/`deserializeUser` (calls `getCustomerWithID`),
     no strategies. It can read a session Backend2 created, but can't
     initiate a login itself.

   Every service must be configured with the **identical** `COOKIE_KEY`
   and `JWT_SECRET` — see `k8s/02-secret.example.yaml`.

## The one real cross-service call: admin → payment verification

`POST /api/v1/admin/verify-payment` (SA-only, lives on Backend1) used to
call payment logic in-process. Now:

```
Backend1 (admin.controllers.js)
  → integrations/paymentServiceClient.js
    → POST http://backend2:8081/internal/verify-payment
      (header: x-internal-token: $INTERNAL_SERVICE_TOKEN)
```

Backend2's `/internal/*` routes are guarded by
`src/middleware/internalAuth.js`, a shared-secret header check
(`INTERNAL_SERVICE_TOKEN`, identical across services). Deliberately
simple — mTLS/service mesh would be a real hardening step, not built
here. `/internal/*` is never exposed through nginx (`nginx/nginx.conf`)
or the k8s Ingress (`k8s/ingress.yaml`) — only reachable via the
compose/cluster-internal service name.

## Deployment options (3 ways to run this, pick one)

1. **Kubernetes on DigitalOcean (DOKS)** — `k8s/`. Deployments, Services,
   Ingress, HPA (Backend1 only — see below), cert-manager for TLS. See
   `k8s/README.md` for the apply order. Nothing has been provisioned yet.
2. **Docker Compose + nginx** — `docker-compose.microservices.yml` (dev,
   plain HTTP, ports exposed directly) and
   `docker-compose.microservices.prod.yml` (nginx TLS termination, see
   `nginx/nginx.conf`). Named `.microservices.` deliberately, **not**
   `docker-compose.prod.yml` — that file already exists and is what
   currently deploys the live `server/` monolith to the droplet via
   `.github/workflows/deploy.yml`. Renaming/overwriting it would break
   the live pipeline on the next push, so this stack was kept separate on
   purpose. Only rename/replace it yourself once you've decided to cut
   over for real.
3. **PM2 directly on a VM, no Docker** — `ecosystem.config.cjs` at the
   repo root. `pm2 start ecosystem.config.cjs --env production`.

Backend2 is capped at 1 instance/replica in every option above — it runs
the subscription-expiry cron in-process
(`Backend2/src/utils/CronJob/Cronjob.js`), which would double-process
expiries if run more than once concurrently. Move that cron to a
scheduled job (k8s CronJob, or a separate pm2 process) before scaling
Backend2 past 1.

## What's NOT done here

- **Nothing has been provisioned on DigitalOcean.** No DOKS cluster, no
  container registry, no new load balancer.
- **`server/` (the monolith) is untouched** and is still what's live in
  production on the droplet. This is a parallel, not-yet-deployed
  alternative — `docker-compose.prod.yml` and
  `.github/workflows/deploy.yml` still point at `server/`, unmodified.
- Local dependency install / real HTTP boot-testing for Backend1/Backend2
  hasn't been completed in this session (it was interrupted mid-way). The
  code has been checked for syntax validity and cross-file reference
  completeness (every `require()` resolves to a real file, confirmed
  after every restructure in this conversation), but not yet exercised
  with real HTTP requests. Worth doing before any real deploy — see
  `k8s/README.md` step 6 for the same kind of verification the JS
  conversion in this session used on the monolith.
- **Future hardening ideas, not built now**: mTLS/service mesh instead of
  the shared-secret internal auth, per-service database split, a K8s
  CronJob instead of Backend2's in-process cron (unlocks scaling Backend2
  past 1 replica), centralized logging/tracing.
