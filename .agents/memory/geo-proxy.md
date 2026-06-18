---
name: Geo proxy (map tiles + geocoding)
description: Why the Standortanalyse map tiles and address autocomplete are proxied through our own API instead of called from the browser.
---

# Geo proxy

The Standortanalyse map (OSM raster tiles) and address autocomplete (Photon
geocoding) are served through our own api-server at `/api/geo/*` instead of the
browser calling `tile.openstreetmap.org` / `photon.komoot.io` directly. Both
responses are cached in-memory (tiles LRU, search short TTL).

**Why proxy + cache:** keeps the app independent of external services from the
client's perspective ("offline-ish"), production-safe, and avoids exposing third-
party endpoints in the frontend. Requested explicitly by the user for the
Gebäudecheck Standortanalyse.

**How to apply:**
- The geo router is mounted in `app.ts` BEFORE the global `apiLimiter`, with its
  own generous limiter (~600/min). **Why:** a single Leaflet map view fetches
  dozens of tiles; under the shared 120/min `/api` budget the map would brown out
  and starve other calls.
- Leaflet `tileLayer` URL is extension-less (`/api/geo/tiles/{z}/{x}/{y}`) and the
  Express route is `:z/:x/:y` (no `.png` suffix) — avoids Express 5 / path-to-regexp
  literal-suffix parsing ambiguity. Content-Type is set from the upstream response.
- `AddressAutocomplete` (shared component, also used in EnergieVollanalyse) returns
  normalized `AddressResult[]` from `/api/geo/search`; the Photon→AddressResult
  mapping lives server-side now, not in the component.
