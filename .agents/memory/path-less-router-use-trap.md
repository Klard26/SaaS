---
name: Path-less router.use(middleware) fall-through trap
description: A path-less router.use(authMiddleware) on a root-mounted Express router silently 401s ALL later fall-through routes
---

A sub-router mounted at the app root that calls `router.use(requireAdmin)` (NO
path argument) installs that middleware for EVERY request that reaches the
router, not just the router's own routes. Because Express tries mounted routers
in order and lets unmatched requests fall through to the next one, a path-less
guard on an early-mounted router rejects requests destined for routers mounted
*after* it — they 401 before ever reaching their handler.

**Symptom:** unrelated endpoints (in our case `/requests`, `/providers/me/*`,
later also `/offers`, `/account`, etc.) return 401 with an admin error message
even though their own code has no admin gate. Hard to spot because the offending
line lives in a totally different route file.

**Fix:** always scope router-level middleware to the router's own path prefix —
`router.use("/foerderpilot", requireAdmin)` / `router.use("/finance", requireAdmin)`
— never bare `router.use(requireAdmin)` on a root-mounted router.

**Why:** mount order + fall-through means a bare guard becomes a global guard.
**How to apply:** when adding auth/role middleware to a sub-router, give it the
same prefix the router's routes use; after adding it, curl an unrelated route to
confirm it is still reachable.
