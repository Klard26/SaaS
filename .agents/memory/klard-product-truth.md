---
name: Klard product truth (real domain)
description: What Klard actually is per seed data, vs. the outdated replit.md description
---

# Klard real domain

Klard is a Doctolib-style booking marketplace for **Bau-/Gebäudeberater** (building / construction consultants), NOT legal/tax advisors.

**Why:** `replit.md` still describes Klard as a marketplace for legal/tax consultants with "12 categories" and RVG/StBVV direct-billing. That text is OUTDATED. The DB seed is the source of truth.

**How to apply:** For any content/marketing/copy work (slides, landing copy, category lists), trust the seed data over replit.md:
- Source: `scripts/data/klard-katalog.json` + `scripts/src/seed.ts`
- **8 categories**: Energieberatung, Architektur, Statiker/Tragwerksplaner, Bauberatung/Baubegleitung, Gebäudesachverständige, Vermesser/Geodäten, TGA-Fachplaner, Bauphysik & Spezialberatung
- **153 service templates**, standards = HOAI / BAFA / KfW
- `requiresDirectBilling = false` for all categories (no RVG/StBVV exclusion in the real data)
- Pricing: Basic free (9% commission), Premium 89 €/mo (4% commission)
