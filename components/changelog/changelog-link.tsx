"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RiGitCommitLine } from "@remixicon/react";
import Link from "next/link";

export function ChangelogLink() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/changelog"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "group relative text-muted-foreground transition-all duration-200",
            "hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 border",
          )}
        >
          <RiGitCommitLine className="size-4" />
          <span className="sr-only">Changelog</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        Changelog
      </TooltipContent>
    </Tooltip>
  );
}
