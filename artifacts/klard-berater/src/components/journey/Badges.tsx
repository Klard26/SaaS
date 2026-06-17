import { CheckCircle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

const SIZES: Record<Size, { text: string; icon: string }> = {
  sm: { text: "text-[0.66rem]", icon: "h-2.5 w-2.5" },
  md: { text: "text-[0.7rem]", icon: "h-3 w-3" },
};

const pill = "inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full";

export function VerifiedBadge({ size = "sm", className }: { size?: Size; className?: string }) {
  const s = SIZES[size];
  return (
    <span
      className={cn(pill, s.text, "bg-[var(--klard-green-l)] text-[var(--klard-green)]", className)}
      data-testid="badge-verified"
    >
      <CheckCircle className={s.icon} /> Verifiziert
    </span>
  );
}

export function PremiumBadge({ size = "sm", className }: { size?: Size; className?: string }) {
  const s = SIZES[size];
  return (
    <span
      className={cn(pill, s.text, "bg-[var(--klard-gold-l)] text-[var(--klard-gold)]", className)}
      data-testid="badge-premium"
    >
      <Crown className={s.icon} /> Premium
    </span>
  );
}

export function BasicBadge({ size = "sm", className }: { size?: Size; className?: string }) {
  const s = SIZES[size];
  return (
    <span
      className={cn(pill, s.text, "bg-secondary text-muted-foreground", className)}
      data-testid="badge-basic"
    >
      Basic
    </span>
  );
}
