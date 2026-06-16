import type { BadgeProps } from "@/components/ui/badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export const TIER_LABELS = {
  basic: "Basic",
  premium: "Premium",
} as const;

export type Tier = keyof typeof TIER_LABELS;

export function tierLabel(tier: string | null | undefined): string {
  return tier === "premium" ? TIER_LABELS.premium : TIER_LABELS.basic;
}

export const BOOKING_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Ausstehend", variant: "secondary" },
  confirmed: { label: "Bestätigt", variant: "default" },
  cancelled: { label: "Storniert", variant: "destructive" },
  completed: { label: "Abgeschlossen", variant: "outline" },
};

export function bookingStatus(status: string): { label: string; variant: BadgeVariant } {
  return BOOKING_STATUS[status] ?? { label: status, variant: "outline" };
}

export type SlotState = "available" | "booked";

export const SLOT_STATE: Record<SlotState, { label: string; variant: BadgeVariant }> = {
  available: { label: "Verfügbar", variant: "outline" },
  booked: { label: "Gebucht", variant: "default" },
};

export function slotState(isAvailable: boolean): { label: string; variant: BadgeVariant } {
  return isAvailable ? SLOT_STATE.available : SLOT_STATE.booked;
}

export type PaymentBadgeVariant = "offen" | "bezahlt" | "direkt";

export const PAYMENT_BADGES: Record<PaymentBadgeVariant, { label: string; className: string }> = {
  offen: { label: "Zahlung offen", className: "bg-[var(--klard-gold-l)] text-[var(--klard-gold)]" },
  bezahlt: { label: "Bezahlt", className: "bg-[var(--klard-green-l)] text-[var(--klard-green)]" },
  direkt: { label: "Direkt mit Berater", className: "bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)]" },
};
