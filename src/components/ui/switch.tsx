import { forwardRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import type { ElementRef, ComponentPropsWithoutRef } from "react";

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-6 w-11 shrink-0 rounded-full bg-surface-muted transition-colors",
      "data-[state=checked]:bg-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow-soft transition-transform",
        "data-[state=checked]:-translate-x-[22px]"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
