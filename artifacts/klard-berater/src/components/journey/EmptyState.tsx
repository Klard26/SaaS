import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  ...rest
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
} & React.ComponentProps<"div">) {
  return (
    <Empty
      className={cn("border border-dashed border-border bg-white rounded-[20px]", className)}
      {...rest}
    >
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon" className="bg-secondary text-muted-foreground">
            <Icon />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}
