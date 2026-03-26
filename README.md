# TaskBackend (Production-Hardened)

TaskBackend is a secure REST API built with Node.js, Express, and MongoDB (Mongoose), hardened for production usage with JWT auth, RBAC, soft deletion, structured logging, health/readiness checks, and metrics endpoint.

## What was hardened

- Strong startup config validation (`MONGODB_URI`, `JWT_ACCESS_SECRET`, bcrypt rounds).
- JWT verification with issuer/audience constraints.
- Stateless logout token revocation support (in-memory blacklist; Redis-ready extension point).
- RBAC middleware for admin-only endpoints.
- Input validation expanded to query params and Mongo ObjectIds.
- Query-level performance updates: indexes, lean reads, projections, text search.
- Improved operational controls: `/health`, `/ready`, `/metrics`, request IDs, JSON logs.
- Dockerized deployment with non-root runtime image.

---

## 1) Code Review Report

### Critical

1. **Privilege escalation on registration**
   - **Found:** Registration accepted role from client.
   - **Impact:** Any client could create an admin account.
   - **Fix:** Registration now always forces role=`user`.

2. **No server-side token invalidation on logout**
   - **Found:** Logout endpoint returned success without revoking token.
   - **Impact:** Stolen token remained valid until expiry.
   - **Fix:** Added token blacklist service with `logout` token revocation and `logout-all` marker checks.

### High

3. **Weak JWT validation hardening**
   - **Found:** Tokens were validated only with secret.
   - **Impact:** Reduced control over token trust boundaries.
   - **Fix:** Added `issuer` and `audience` constraints in sign/verify.

4. **Missing standardized admin authorization middleware**
   - **Found:** Inline role checks were route-local and inconsistent.
   - **Impact:** Maintenance risk and accidental bypass potential.
   - **Fix:** Added reusable `requireRole()` middleware and centralized usage.

5. **Production observability gaps**
   - **Found:** No request IDs, no structured logs, no metrics endpoint.
   - **Impact:** Hard to debug and scale under load.
   - **Fix:** Added structured JSON logging middleware with request IDs and a metrics endpoint.

### Medium

6. **Query inefficiencies and missing projections/lean**
   - **Found:** Several list/get operations returned full Mongoose docs.
   - **Impact:** Higher memory/CPU under concurrency.
   - **Fix:** Added `lean()`, select projections, and explicit pagination schemas.

7. **Soft-delete filter consistency risks**
   - **Found:** Some query paths depended on ad-hoc `isDeleted` checks.
   - **Impact:** Risk of deleted records leaking into API responses.
   - **Fix:** Added model-level `pre(/^find/)` default active-record filter.

8. **Single global limiter not tuned for auth abuse**
   - **Found:** One rate-limit profile for all routes.
   - **Impact:** Increased brute-force risk on auth endpoints.
   - **Fix:** Added stricter auth limiter and standard headers.

### Low

9. **Startup concerns in `app.js`**
   - **Found:** App creation and DB startup were coupled.
   - **Impact:** Harder integration testing and deployment lifecycle management.
   - **Fix:** Split to app factory (`src/app.js`) and bootstrap (`src/server.js`).

---

## 2) Refactored Architecture

```
src/
  app.js                 # Express app factory
  server.js              # Startup bootstrap
  config/env.js          # Runtime config + validation
  lib/
    db.js                # Mongo connection lifecycle
    logger.js            # Structured JSON logger
    metrics.js           # In-memory metrics collectors
  middleware/
    auth.js              # JWT auth + revocation checks
    rbac.js              # Role middleware
    requestContext.js    # Request ID + structured HTTP logs
    metrics.js           # Request metrics timing
    validate.js          # Joi request validation
    errorHandler.js      # Safe centralized errors
  services/
    tokenBlacklist.js    # Stateless logout revocation store
```

### Migration plan

Indexes were added in model definitions for:
- `User`: `email`, `role`, `isActive`, `{isActive, createdAt}`
- `Product`: `title`, `price`, `createdBy`, `isDeleted`, `{isDeleted, createdAt}`, `{createdBy, isDeleted, createdAt}`, text index on `title/description`

Run in production:
1. Deploy code.
2. Run background index build in maintenance window (or allow Mongoose-managed sync strategy in controlled ops flow).
3. Monitor write latency and lock impact during first rollout.

---

## 3) API Documentation

- OpenAPI spec added: `src/docs/openapi.yaml`.
- Core endpoints documented for auth, product listing/create, and ops endpoints.

---

## 4) Deployment Guide

### Local Docker

```bash
docker compose up --build
```

### Cloud deployment checklist (ECS/Kubernetes/VM)

1. Set environment variables from `.env.example` (never commit secrets).
2. Use managed MongoDB (Atlas or cloud-managed replica set).
3. Put API behind HTTPS ingress/load-balancer.
4. Protect `/metrics` behind internal network controls.
5. Scale horizontally and externalize token blacklist/rate-limit store to Redis.
6. Ship structured logs to a log pipeline (CloudWatch/ELK/Datadog).

---

## 5) Testing Artifacts

- Unit tests:
  - `tests/unit/tokenBlacklist.test.js`
  - `tests/unit/rbac.test.js`
- Integration test:
  - `tests/integration/health.test.js`
- Load test script:
  - `load-tests/taskbackend-load.js`

### Run tests

```bash
npm test
```

### Run load test

```bash
BASE_URL=http://localhost:3000 npm run loadtest
```

> Note: full before/after benchmark numbers require a running Mongo instance and representative hardware. The included k6 script is ready for controlled baseline and post-change comparisons.

---

## Environment variables

Copy `.env.example` to `.env` and set values per environment.

Key variables:
- `JWT_ACCESS_SECRET` (32+ chars)
- `JWT_ACCESS_EXPIRES_IN` (default `24h`)
- `JWT_ISSUER`, `JWT_AUDIENCE`
- `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`
- `CORS_ORIGIN` (comma-separated in production)
- `LOG_LEVEL`

---

## Backward compatibility notes

- Existing endpoint paths and response envelope (`status`, `message`, `data`) are preserved.
- Auth remains access-token based.
- Logout behavior is now stricter and secure via token revocation checks.
