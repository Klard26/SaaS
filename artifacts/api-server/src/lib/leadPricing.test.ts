import { describe, it, expect } from "vitest";
import {
  BASE_LEAD_PRICE_CENTS,
  FUNDING_SURCHARGE_CENTS,
  BUDGET_MID_SURCHARGE_CENTS,
  BUDGET_HIGH_SURCHARGE_CENTS,
  SPECIALIST_SURCHARGE_CENTS,
  calcBaseLeadPriceCents,
  applyTierDiscountCents,
  calcLeadPriceCents,
} from "./leadPricing";

describe("calcBaseLeadPriceCents", () => {
  it("returns the base price for a plain request", () => {
    expect(calcBaseLeadPriceCents({})).toBe(BASE_LEAD_PRICE_CENTS);
  });

  it("adds the funding surcharge when funding-relevant", () => {
    expect(calcBaseLeadPriceCents({ fundingRelevant: true })).toBe(
      BASE_LEAD_PRICE_CENTS + FUNDING_SURCHARGE_CENTS,
    );
  });

  it("adds the mid-budget surcharge strictly above 2.000 €", () => {
    expect(calcBaseLeadPriceCents({ budgetMaxCents: 2_000 * 100 })).toBe(
      BASE_LEAD_PRICE_CENTS,
    );
    expect(calcBaseLeadPriceCents({ budgetMaxCents: 2_000 * 100 + 1 })).toBe(
      BASE_LEAD_PRICE_CENTS + BUDGET_MID_SURCHARGE_CENTS,
    );
  });

  it("stacks mid + high budget surcharges above 10.000 €", () => {
    expect(calcBaseLeadPriceCents({ budgetMaxCents: 10_001 * 100 })).toBe(
      BASE_LEAD_PRICE_CENTS + BUDGET_MID_SURCHARGE_CENTS + BUDGET_HIGH_SURCHARGE_CENTS,
    );
  });

  it("adds the specialist surcharge for specialist categories only", () => {
    expect(calcBaseLeadPriceCents({ categorySlug: "energieberatung" })).toBe(
      BASE_LEAD_PRICE_CENTS + SPECIALIST_SURCHARGE_CENTS,
    );
    expect(calcBaseLeadPriceCents({ categorySlug: "steuerberater" })).toBe(
      BASE_LEAD_PRICE_CENTS,
    );
  });

  it("combines every surcharge", () => {
    expect(
      calcBaseLeadPriceCents({
        fundingRelevant: true,
        budgetMaxCents: 50_000 * 100,
        categorySlug: "statiker-tragwerksplaner",
      }),
    ).toBe(
      BASE_LEAD_PRICE_CENTS +
        FUNDING_SURCHARGE_CENTS +
        BUDGET_MID_SURCHARGE_CENTS +
        BUDGET_HIGH_SURCHARGE_CENTS +
        SPECIALIST_SURCHARGE_CENTS,
    );
  });

  it("treats null/undefined fields as absent", () => {
    expect(
      calcBaseLeadPriceCents({
        fundingRelevant: null,
        budgetMaxCents: null,
        categorySlug: null,
      }),
    ).toBe(BASE_LEAD_PRICE_CENTS);
  });
});

describe("applyTierDiscountCents", () => {
  it("returns the base unchanged for a 0% discount (basic)", () => {
    expect(applyTierDiscountCents(1000, 0)).toBe(1000);
  });

  it("applies a 20% premium discount, rounded to the nearest cent", () => {
    expect(applyTierDiscountCents(1000, 20)).toBe(800);
    // 690 * 0.8 = 552
    expect(applyTierDiscountCents(690, 20)).toBe(552);
    // 789 * 0.8 = 631.2 => 631
    expect(applyTierDiscountCents(789, 20)).toBe(631);
  });

  it("clamps out-of-range and non-finite discounts to [0,100]", () => {
    expect(applyTierDiscountCents(1000, -50)).toBe(1000);
    expect(applyTierDiscountCents(1000, 150)).toBe(0);
    expect(applyTierDiscountCents(1000, Number.NaN)).toBe(1000);
  });
});

describe("calcLeadPriceCents", () => {
  it("computes base then discount in one step", () => {
    // base = 490 + 300 (funding) = 790; premium 20% => 632
    expect(calcLeadPriceCents({ fundingRelevant: true }, 20)).toBe(632);
  });

  it("never trusts a client price — only the request shape drives it", () => {
    const a = calcLeadPriceCents({ budgetMaxCents: 3_000 * 100 }, 0);
    const b = calcLeadPriceCents({ budgetMaxCents: 3_000 * 100 }, 0);
    expect(a).toBe(b);
    expect(a).toBe(BASE_LEAD_PRICE_CENTS + BUDGET_MID_SURCHARGE_CENTS);
  });
});
