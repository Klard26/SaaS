---
name: WattWechsel app split
description: Why WattWechsel is a separate frontend sharing Klard's Clerk tenant and backend, and the Replit constraints that forced it.
---

# WattWechsel: separate frontend, shared login + shared backend

WattWechsel (Energiewechsel cockpit) lives in its own react-vite artifact `@workspace/wattwechsel` at `/wattwechsel/`, but reuses Klard's Clerk tenant (same accounts/sessions) and the same `api-server` backend.

**Why this shape (not fully independent):**
- A SECOND Replit-managed Clerk tenant is NOT possible — the repl has one managed Clerk tenant. To get "same accounts" across two frontends, the second app must replicate the first app's Clerk block and read the same repl-level `VITE_CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PROXY_URL`.
- A SECOND registrable api-server artifact is NOT feasible here either — keep one shared `api-server`. So energie routes stay in `api-server` and energie schema stays in `lib/db`; codegen/clients are unchanged and shared.

**How to apply (replicating shared Clerk login in a new frontend artifact):**
- Copy the source app's entire Clerk wiring verbatim: `publishableKeyFromHost(...)`, `@clerk/react/internal`, `deDE`, shadcn theme, `stripBase`, `AuthRoute` (Show signed-in/out + Redirect), `SignIn`/`SignUp` pages, `ClerkQueryClientCacheInvalidator`, and `WouterRouter base={basePath}` where `basePath = import.meta.env.BASE_URL.replace(/\/$/, "")`.
- Add deps `@clerk/react`, `@clerk/localizations`, `@clerk/themes` (match the source app's versions).
- AuthRoute `Redirect to="/sign-in"` resolves under the Wouter base, so it correctly lands on `/<app>/sign-in`.

**Why root-relative `/api` matters:** the generated API client (`lib/api-client-react`) emits root-relative `/api/...` paths (custom-fetch returns the relative path when no base is set). That means a frontend served at any subpath (`/wattwechsel/`) still reaches the shared backend through the proxy — do NOT base-prefix API calls.
