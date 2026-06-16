import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { bookingStatus, slotState } from "@/lib/journey";

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

export function SlotStatusBadge({
  isAvailable,
  ...rest
}: { isAvailable: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  const { label, variant } = slotState(isAvailable);
  return (
    <Badge variant={variant} {...rest}>
      {label}
    </Badge>
  );
}
