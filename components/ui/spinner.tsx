import { cn } from "@/lib/utils/ui";
import { RiLoader4Line } from "@remixicon/react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <RiLoader4Line
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
