import { describe, it, expect } from "vitest";
import {
  tierCommissionRate,
  effectiveCommissionRate,
  isConnectSplitEligible,
  computeApplicationFeeCents,
} from "./commission";

describe("tierCommissionRate", () => {
  it("returns the premium rate for premium providers", () => {
    expect(tierCommissionRate("premium")).toBe(0.04);
  });

  it("falls back to the basic rate for everything else", () => {
    expect(tierCommissionRate("basic")).toBe(0.09);
    expect(tierCommissionRate(undefined)).toBe(0.09);
    expect(tierCommissionRate(null)).toBe(0.09);
    expect(tierCommissionRate("garbage")).toBe(0.09);
  });
});

describe("effectiveCommissionRate", () => {
  it("uses the tier default when no per-provider override is set", () => {
    expect(
      effectiveCommissionRate({ commissionRate: null, subscriptionTier: "premium" }),
    ).toBe(0.04);
    expect(
      effectiveCommissionRate({ commissionRate: null, subscriptionTier: "basic" }),
    ).toBe(0.09);
  });

  it("honors a valid per-provider override (numeric string from the DB)", () => {
    expect(
      effectiveCommissionRate({ commissionRate: "0.015", subscriptionTier: "basic" }),
    ).toBe(0.015);
  });

  it("allows a zero override", () => {
    expect(
      effectiveCommissionRate({ commissionRate: "0", subscriptionTier: "basic" }),
    ).toBe(0);
  });

  it("ignores an out-of-range override (>= 1) and falls back to the tier", () => {
    expect(
      effectiveCommissionRate({ commissionRate: "1", subscriptionTier: "premium" }),
    ).toBe(0.04);
    expect(
      effectiveCommissionRate({ commissionRate: "1.5", subscriptionTier: "basic" }),
    ).toBe(0.09);
  });

  it("ignores a negative override and falls back to the tier", () => {
    expect(
      effectiveCommissionRate({ commissionRate: "-0.1", subscriptionTier: "basic" }),
    ).toBe(0.09);
  });

  it("ignores a non-numeric override and falls back to the tier", () => {
    expect(
      effectiveCommissionRate({ commissionRate: "abc", subscriptionTier: "premium" }),
    ).toBe(0.04);
  });
});

describe("isConnectSplitEligible", () => {
  const onboardedAt = new Date("2026-01-01T00:00:00Z");

  it("is eligible only when account id AND onboarding date are both present", () => {
    expect(
      isConnectSplitEligible({ stripeAccountId: "acct_1", stripeOnboardedAt: onboardedAt }),
    ).toBe(true);
  });

  it("is not eligible without an account id", () => {
    expect(
      isConnectSplitEligible({ stripeAccountId: null, stripeOnboardedAt: onboardedAt }),
    ).toBe(false);
  });

  it("is not eligible without an onboarding date", () => {
    expect(
      isConnectSplitEligible({ stripeAccountId: "acct_1", stripeOnboardedAt: null }),
    ).toBe(false);
  });

  it("is not eligible for null/undefined providers", () => {
    expect(isConnectSplitEligible(null)).toBe(false);
    expect(isConnectSplitEligible(undefined)).toBe(false);
  });
});

describe("computeApplicationFeeCents", () => {
  it("takes the tier commission of the total in cents", () => {
    // 100.00 EUR = 10000 cents, basic 9% => 900 cents
    expect(
      computeApplicationFeeCents(
        { commissionRate: null, subscriptionTier: "basic" },
        10000,
      ),
    ).toBe(900);
    // premium 4% => 400 cents
    expect(
      computeApplicationFeeCents(
        { commissionRate: null, subscriptionTier: "premium" },
        10000,
      ),
    ).toBe(400);
  });

  it("uses a per-provider override rate", () => {
    expect(
      computeApplicationFeeCents(
        { commissionRate: "0.05", subscriptionTier: "basic" },
        10000,
      ),
    ).toBe(500);
  });

  it("rounds to the nearest cent", () => {
    // 99.99 EUR = 9999 cents, 9% = 899.91 => 900
    expect(
      computeApplicationFeeCents(
        { commissionRate: null, subscriptionTier: "basic" },
        9999,
      ),
    ).toBe(900);
  });
});
