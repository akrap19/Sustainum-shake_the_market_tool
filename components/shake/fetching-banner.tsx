import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FetchingBanner({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-300",
        className,
      )}
    >
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      <p>
        <span className="font-medium">{label}</span>
        {" "}Showing prepared data until the live pull finishes.
      </p>
    </div>
  );
}
