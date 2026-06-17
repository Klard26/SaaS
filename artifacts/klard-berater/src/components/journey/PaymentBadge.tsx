import { cn } from "@/lib/utils";
import { PAYMENT_BADGES, type PaymentBadgeVariant } from "@/lib/journey";

export function PaymentBadge({
  variant,
  className,
}: {
  variant: PaymentBadgeVariant;
  className?: string;
}) {
  const p = PAYMENT_BADGES[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center text-[0.7rem] font-bold px-2 py-0.5 rounded-full",
        p.className,
        className,
      )}
      data-testid={`badge-payment-${variant}`}
    >
      {p.label}
    </span>
  );
}
