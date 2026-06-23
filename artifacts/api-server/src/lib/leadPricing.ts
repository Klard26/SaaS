/**
 * Server-authoritative lead pricing for the Pay-per-Lead (RfQ) marketplace.
 *
 * ALL amounts are integer cents — client-supplied prices are never trusted; the
 * lead fee a provider pays is always recomputed here from the request + the
 * provider's tier discount.
 *
 * Ported from the reference (euros) to integer cents:
 *   base 4,90 € + 3 € (funding-relevant) + 4 € (budget > 2.000 €)
 *   + 6 € (budget > 10.000 €) + 2 € (specialist category),
 *   then reduced by the provider's tier discount percentage.
 */

export const BASE_LEAD_PRICE_CENTS = 490;
export const FUNDING_SURCHARGE_CENTS = 300;
export const BUDGET_MID_SURCHARGE_CENTS = 400; // budget over 2.000 €
export const BUDGET_HIGH_SURCHARGE_CENTS = 600; // budget over 10.000 €
export const SPECIALIST_SURCHARGE_CENTS = 200;

const BUDGET_MID_THRESHOLD_CENTS = 2_000 * 100;
const BUDGET_HIGH_THRESHOLD_CENTS = 10_000 * 100;

/**
 * Category slugs that command the specialist lead surcharge. These map the
 * reference's enb/stat/bauphysik branches onto Klard's category slugs.
 */
export const SPECIALIST_CATEGORY_SLUGS: ReadonlySet<string> = new Set([
  "energieberatung",
  "statiker-tragwerksplaner",
  "bauphysik-spezialberatung",
]);

export interface LeadPriceInput {
  fundingRelevant?: boolean | null;
  budgetMaxCents?: number | null;
  categorySlug?: string | null;
}

/** Base lead price (before any tier discount), in integer cents. */
export function calcBaseLeadPriceCents(input: LeadPriceInput): number {
  let cents = BASE_LEAD_PRICE_CENTS;
  if (input.fundingRelevant) cents += FUNDING_SURCHARGE_CENTS;
  const budget = input.budgetMaxCents ?? 0;
  if (budget > BUDGET_MID_THRESHOLD_CENTS) cents += BUDGET_MID_SURCHARGE_CENTS;
  if (budget > BUDGET_HIGH_THRESHOLD_CENTS) cents += BUDGET_HIGH_SURCHARGE_CENTS;
  if (input.categorySlug && SPECIALIST_CATEGORY_SLUGS.has(input.categorySlug)) {
    cents += SPECIALIST_SURCHARGE_CENTS;
  }
  return cents;
}

/** Apply a provider's tier discount (percent) to a base price, rounded to cents. */
export function applyTierDiscountCents(baseCents: number, discountPct: number): number {
  const pct = Number.isFinite(discountPct) ? Math.max(0, Math.min(100, discountPct)) : 0;
  return Math.round((baseCents * (100 - pct)) / 100);
}

/** Final lead price for a provider on a request (base minus tier discount), in cents. */
export function calcLeadPriceCents(input: LeadPriceInput, discountPct: number): number {
  return applyTierDiscountCents(calcBaseLeadPriceCents(input), discountPct);
}
