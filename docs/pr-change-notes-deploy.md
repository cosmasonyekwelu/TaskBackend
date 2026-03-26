# PR Change Notes

**Title:**  
Stabilize Startup & Edge Hardening for TaskBackend Deployments

**Summary:**  
This PR fixes deployment/startup reliability by adding graceful shutdown handlers, early config validation, and aligning CORS with credentialed requests. It adds compression, cleans up `/ready` DB checks, and updates the direct `app.js` entrypoint to fully bootstrap (so misconfigured hosts still start correctly). Core files touched: `src/app.js`, `src/server.js`, `package.json`.

## 1. Concepts
- Safer lifecycle: catch uncaught errors, handle SIGTERM/SIGINT, and close HTTP + Mongo connections gracefully.
- CORS correctness: block wildcard origins when using credentials; reflect only allowed origins.
- Operational ergonomics: optional root info route, compression for leaner responses, ready check uses shared mongoose instance.
- Startup fallback: `app.js` can self-start if a platform invokes it directly.

## 2. Real-world analogy
Think of the API as a venue with a guest list and closing routine: only guests on the list get in (CORS allow-list), lights and doors close in an orderly way when closing time hits (graceful shutdown), and an info desk at the entrance tells you where to go (root route).

## 3. Smallest practical example
Graceful shutdown wiring with Mongo disconnect:

```js
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

const gracefulShutdown = (signal) => {
  const timeout = setTimeout(() => process.exit(1), 10000);
  server.close(async () => {
    await mongoose.disconnect();
    clearTimeout(timeout);
    process.exit(0);
  });
};
```

## 4. Why it exists & where it is used
Render was invoking `node src/app.js`, causing early exit; the new direct-start block now boots the app, validates env vars, and connects Mongo. CORS previously allowed `*` with `credentials: true`, which browsers reject—now origins are explicitly validated and credentials are disabled when wildcarded. Signal handling ensures pods/VMs terminate without dropping in-flight requests or leaking DB connections. Compression reduces payload sizes across all routes.

## 5. Technical trade-off
Graceful shutdown waits up to 10 seconds before forcing exit; long-running requests beyond that window may still be cut off. This timeout balances orderly teardown with fast restarts; increasing it would improve completeness but slow rollouts.

## PR Information
- Backend/API: CORS allow-list with credential guard, added root info route, compression middleware, `/ready` uses shared mongoose import.
- Reliability: Graceful shutdown for SIGINT/SIGTERM, global uncaught/unhandled logging, early env validation.
- Infrastructure: Direct `app.js` execution now fully bootstraps server (safety net for misconfigured start commands).
- Dependencies: Added `compression` runtime dependency.
