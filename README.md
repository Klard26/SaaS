# Klard

[![CI](https://github.com/Klard26/SaaS/actions/workflows/ci.yml/badge.svg)](https://github.com/Klard26/SaaS/actions/workflows/ci.yml)

Klard ist ein Doctolib-artiger Buchungs-Marktplatz für deutsche Berater — suchen, vergleichen und Termine mit Beratern aus 12 Fachkategorien sofort buchen. Das Repository ist ein pnpm-Monorepo mit vier Frontends, die sich ein Backend und einen Clerk-Tenant teilen:

- **`@workspace/klard`** (`/`) — Kunden-Marktplatz (Berater buchen).
- **`@workspace/klard-berater`** (`/berater/`) — eigenständige Berater-App (Dashboard, Leistungen, Verfügbarkeit, Abo).
- **`@workspace/foerderportal`** (`/foerderschiene/`) — Förderschiene: Gebäudecheck + Förderung (Schnellcheck → Gebäudereport-PDF → Förderprogramm-Analyse → Energieausweis).
- **`@workspace/wattwechsel`** (`/wattwechsel/`) — enerwatt24, Energiewechsel-Cockpit.

## Stack

- pnpm-Workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + Wouter
- API: Express 5 + Zod; DB: PostgreSQL + Drizzle ORM
- Auth: Clerk · KI: Anthropic Claude · Payments: Stripe · E-Mail: Resend
- Contract-first: OpenAPI → Orval (React-Query-Hooks + Zod-Schemas)

## Entwicklung

```bash
pnpm install

# Apps starten
pnpm --filter @workspace/api-server   run dev   # API-Server (Port 8080)
pnpm --filter @workspace/klard        run dev   # Kunden-Frontend
pnpm --filter @workspace/klard-berater run dev  # Berater-Frontend
pnpm --filter @workspace/foerderportal run dev  # Förderschiene
pnpm --filter @workspace/wattwechsel  run dev   # enerwatt24

# Qualität
pnpm run typecheck   # Typecheck über alle Pakete
pnpm run test        # Tests (Integrationstests brauchen DATABASE_URL)
pnpm run build       # Typecheck + Build aller Pakete

# Codegen & DB
pnpm --filter @workspace/api-spec run codegen  # API-Hooks + Zod-Schemas neu generieren
pnpm --filter @workspace/db       run push     # DB-Schema pushen (nur Dev)
```

Erforderliche Umgebungsvariable: `DATABASE_URL`.

## Continuous Integration

GitHub Actions (`.github/workflows/ci.yml`) läuft bei jedem Push und Pull Request auf `main`:

- **Typecheck** — `pnpm run typecheck` über Libs und alle Artifacts.
- **Test** — startet einen PostgreSQL-16-Service, pusht das Schema und führt `pnpm run test` aus.

## Projektstruktur

```text
artifacts/   # Deploybare Apps (Frontends + API-Server)
lib/         # Geteilte Libraries (db, api-spec, api-client-react, …)
scripts/     # Utility-Scripts
```

Weitere Architektur- und Betriebsdetails: siehe [`replit.md`](./replit.md).
