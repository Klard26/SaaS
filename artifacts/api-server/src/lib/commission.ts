import type { Provider } from "@workspace/db";

/**
 * Platform commission expressed as a fraction (0.09 = 9%).
 *
 * The product promises tier-based commission: Basic 9%, Premium 4% (see the
 * pricing page). A per-provider `commissionRate` column may override this when
 * set (e.g. negotiated rate); otherwise the tier default applies.
 */
export function tierCommissionRate(tier?: string | null): number {
  return tier === "premium" ? 0.04 : 0.09;
}

export function effectiveCommissionRate(
  provider: Pick<Provider, "commissionRate" | "subscriptionTier">,
): number {
  if (provider.commissionRate != null) {
    const r = Number(provider.commissionRate);
    if (Number.isFinite(r) && r >= 0 && r < 1) return r;
  }
  return tierCommissionRate(provider.subscriptionTier);
}
