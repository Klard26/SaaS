import { describe, it, expect } from "vitest";
import {
  TIER_LABELS,
  tierLabel,
  BOOKING_STATUS,
  bookingStatus,
  PAYMENT_BADGES,
} from "./journey";

describe("tierLabel", () => {
  it("maps premium to the Premium label", () => {
    expect(tierLabel("premium")).toBe(TIER_LABELS.premium);
    expect(tierLabel("premium")).toBe("Premium");
  });

  it("falls back to Basic for basic, unknown, null, and undefined", () => {
    expect(tierLabel("basic")).toBe("Basic");
    expect(tierLabel("something-else")).toBe("Basic");
    expect(tierLabel(null)).toBe("Basic");
    expect(tierLabel(undefined)).toBe("Basic");
  });

  it("never returns the legacy 'Top' label", () => {
    for (const input of ["premium", "basic", "top", "", null, undefined]) {
      expect(tierLabel(input)).not.toBe("Top");
    }
  });
});

describe("bookingStatus", () => {
  it.each([
    ["pending", "Ausstehend", "secondary"],
    ["confirmed", "Bestätigt", "default"],
    ["cancelled", "Storniert", "destructive"],
    ["completed", "Abgeschlossen", "outline"],
  ])("maps %s to its label and variant", (status, label, variant) => {
    expect(bookingStatus(status)).toEqual({ label, variant });
  });

  it("falls back to the raw status with an outline variant for unknown values", () => {
    expect(bookingStatus("weird")).toEqual({ label: "weird", variant: "outline" });
  });

  it("keeps the exported map and helper in sync", () => {
    for (const [status, expected] of Object.entries(BOOKING_STATUS)) {
      expect(bookingStatus(status)).toEqual(expected);
    }
  });
});

describe("PAYMENT_BADGES", () => {
  it("exposes a label for each payment variant", () => {
    expect(PAYMENT_BADGES.offen.label).toBe("Zahlung offen");
    expect(PAYMENT_BADGES.bezahlt.label).toBe("Bezahlt");
    expect(PAYMENT_BADGES.direkt.label).toBe("Direkt mit Berater");
  });
});
