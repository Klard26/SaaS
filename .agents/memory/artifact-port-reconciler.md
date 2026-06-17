---
name: New-artifact workflow DIDNT_OPEN_A_PORT
description: Why a freshly-created artifact's workflow fails its port probe until a checkpoint runs, even though the dev server binds fine.
---

# New-artifact workflow fails DIDNT_OPEN_A_PORT until a checkpoint

When you `createArtifact` a NEW web artifact, its workflow can fail to start with
`DIDNT_OPEN_A_PORT` even though the dev server (e.g. Vite) actually binds its
local port correctly (a manual `curl localhost:<localPort>` returns 200).

**Root cause:** the workflow health probe checks the **external** port from the
`.replit` `[[ports]]` mappings, NOT the artifact's `localPort`. Existing artifacts
have a `.replit` entry (e.g. localPort 18607 → externalPort 8000) so their probe
sees the open external port; a brand-new artifact has NO `.replit` entry yet, so
the probe sees no open port and kills the process.

The `.replit` `[[ports]]` mapping is written by a platform **reconciler**, not by
the agent. Editing `.replit` directly is blocked; `configureWorkflow` is
prohibited for artifact-managed workflows; and `createArtifact` /
`verifyAndReplaceArtifactToml` / `restart_workflow` / `pnpm install` / git commit
do NOT trigger it.

**Why / when it runs:** the reconciler is event-driven and fires at a
**checkpoint** — when control returns to the user (turn end / `mark_task_complete`).
It is NOT periodic, NOT commit-driven, NOT install-driven.

**How to apply:** after creating a new web artifact, do not burn time trying to
force the port open mid-turn. Finish the code (it will typecheck/build fine),
then end the turn / mark the task complete so the checkpoint reconciles the port.
On the next turn, `restart_workflow <slug>` — the preview will then come up.
Verify routing meanwhile via the shared proxy path once a process is listening.
