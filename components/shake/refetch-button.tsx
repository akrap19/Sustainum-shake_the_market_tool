"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RefetchButton({ onRefetch, isLoading }: { onRefetch: () => void; isLoading: boolean }) {
  return (
    <Button onClick={onRefetch} disabled={isLoading} variant="outline" size="sm" className="cursor-pointer gap-2">
      <RefreshCw className={cn(isLoading && "animate-spin")} />
      {isLoading ? "Refetching…" : "Refetch data"}
    </Button>
  );
}
