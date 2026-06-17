import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: string[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center gap-2", className)} data-testid="stepper">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 border-[1.5px] transition-colors",
                  done && "bg-[var(--klard-green)] border-[var(--klard-green)] text-white",
                  active && "bg-primary border-primary text-primary-foreground",
                  !done && !active && "bg-secondary border-border text-muted-foreground",
                )}
                data-testid={`step-${i}`}
                data-state={done ? "done" : active ? "active" : "upcoming"}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="hidden sm:block h-px flex-1 bg-border min-w-4" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
