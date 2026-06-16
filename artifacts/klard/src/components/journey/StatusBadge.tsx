import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { bookingStatus } from "@/lib/journey";

export function BookingStatusBadge({
  status,
  ...rest
}: { status: string } & React.HTMLAttributes<HTMLDivElement>) {
  const { label, variant } = bookingStatus(status);
  return (
    <Badge variant={variant} {...rest}>
      {label}
    </Badge>
  );
}
