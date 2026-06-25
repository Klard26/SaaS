/**
 * Provider "world" (top-level classification): the professional world
 * (Beratung & Bauwesen) vs. the everyday world (Alltag & Handwerk).
 *
 * The klard-berater app serves BOTH worlds through separate registration /
 * login areas. A provider is still a single `provider` role; the world only
 * scopes which Fachbereiche they can pick during onboarding and the branding
 * of the entry area. The choice is remembered across the Clerk sign-up flow
 * via sessionStorage so it survives the auth redirect.
 */
export type ProviderWorld = "pro" | "alltag";

const STORAGE_KEY = "klard_provider_world";

export function isProviderWorld(value: string | null | undefined): value is ProviderWorld {
  return value === "pro" || value === "alltag";
}

export function rememberProviderWorld(world: ProviderWorld): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, world);
  } catch {
    /* sessionStorage may be unavailable (private mode) — non-fatal */
  }
}

export function readRememberedWorld(): ProviderWorld | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return isProviderWorld(value) ? value : null;
  } catch {
    return null;
  }
}

export function clearRememberedWorld(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}

/** Reads the `world` query param from the current URL, if valid. */
export function worldFromSearch(search: string): ProviderWorld | null {
  const value = new URLSearchParams(search).get("world");
  return isProviderWorld(value) ? value : null;
}
