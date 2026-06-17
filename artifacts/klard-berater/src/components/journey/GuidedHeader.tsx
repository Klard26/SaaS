import type { LucideIcon } from "lucide-react";
import { Stepper } from "./Stepper";

export function GuidedHeader({
  icon: Icon,
  title,
  subtitle,
  steps,
  current,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  steps?: string[];
  current?: number;
}) {
  return (
    <div className="mb-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
          <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
      </div>
      {steps && steps.length > 0 && (
        <div className="mt-6 flex justify-center overflow-x-auto no-scrollbar">
          <Stepper steps={steps} current={current ?? 0} />
        </div>
      )}
    </div>
  );
}
