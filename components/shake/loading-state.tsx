import { Loader2 } from "lucide-react";

export function LoadingState({
  title = "Fetching data…",
  subtitle = "Discovering companies, counting UK locations and verifying contacts. This can take a moment.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card py-24 text-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
