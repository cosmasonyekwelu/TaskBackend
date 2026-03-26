# PR Change Notes

**Title:**  
Production Hardening and Observability Upgrade for TaskBackend

**Summary:**  
This PR hardens authentication and authorization (issuer/audience-validated JWTs, enforced user-only signup, token blacklist for logout) and centralizes RBAC via reusable middleware across admin routes. It separates app creation from startup, adds strict env validation, and optimizes data access with indexes, projections, and `lean()` reads. Operational maturity improves through structured JSON logging with request IDs, request/DB metrics, and `/health`, `/ready`, `/metrics` endpoints. Supporting artifacts include updated docs, Docker/Docker Compose, OpenAPI spec, expanded tests, and a k6 load script.

## 1. Concepts
- App lifecycle split into an Express factory (`app.js`) and a bootstrapper (`server.js`) for cleaner startup/shutdown and testing.
- Security upgrades: JWT issuer/audience validation, forced `role=user` on registration, and token blacklist checks for logout/logout-all.
- RBAC standardized through `requireRole()` middleware applied to admin routes after authentication.
- Performance/consistency: default soft-delete filtering, targeted indexes, projections, and `lean()` for read-heavy paths.
- Observability: structured JSON logs with request IDs, per-request timing/metrics, and health/readiness/metrics endpoints.

## 2. Real-world analogy
Think of the system as a venue with a bouncer and a clipboard: IDs are checked for who issued them and who they’re for (issuer/audience), the role determines which rooms you can enter, and a live “do not admit” list (token blacklist) instantly revokes access if someone is kicked out. Cameras and timers (logging/metrics) watch every doorway to keep operations smooth.

## 3. Smallest practical example
Minimal route showing the new auth + RBAC path:

```js
// src/routes/adminRoutes.js
router.get(
  '/users',
  auth,                // verifies JWT + issuer/audience + blacklist
  requireRole('admin'), // centralized admin guard
  adminController.listUsers
);
```

## 4. Why it exists & where it is used
Previously, clients could self-assign roles and logout lacked server-side invalidation, leaving stolen tokens usable until expiry. Route-level role checks were inconsistent, and observability gaps made debugging under load difficult. The new flow secures all protected endpoints, applies consistent RBAC to admin surfaces, and adds visibility into health and performance across the API; it applies to all authenticated routes, especially admin user/product management and operational endpoints.

## 5. Technical trade-off
Token revocation and rate-limit state use in-memory stores by default for simplicity and zero external dependencies. This avoids adding Redis to local/dev setups but means revocations/limits are not shared across multiple instances; production deployments should switch these stores to Redis (extension points are in place).

## PR Information
- Backend/API: Split `app.js`/`server.js`, stricter env validation, JWT issuer/audience enforcement, token blacklist-backed logout, centralized RBAC middleware.
- Security: Forced `role=user` on signup, expanded input validation (body/params/query, ObjectId), soft-delete default filters.
- Data layer: Added indexes on User/Product, projections with `select`, `lean()` on read paths, text search support.
- Observability: Structured JSON logging with request IDs, request/DB metrics, `/health`, `/ready`, `/metrics` endpoints, safer error handling.
- Infrastructure: Dockerfile (non-root multi-stage) and docker-compose for app+Mongo scaffolding.
- Documentation/Testing: Updated README, `.env.example`, OpenAPI spec, new unit/integration tests, k6 load script under `load-tests/`.
