import Image from "next/image";
import { Monitor } from "lucide-react";
import { Stack } from "@/components/layout/stack";

export function ScreenWarning() {
  return (
    <div
      role="status"
      className="flex min-h-screen flex-col items-center justify-center overflow-y-auto px-6 py-12 lg:hidden"
    >
      <Stack className="max-w-sm items-center gap-6 text-center">
        <Image
          src="/sustainium-logo.webp"
          alt="Sustainium"
          width={1420}
          height={158}
          priority
          className="h-7 w-auto dark:invert"
        />
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Monitor className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-foreground">Best viewed on a larger screen</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Shake the Market is a desktop dashboard. Open it on a computer or widen your window so
            the prospect table stays readable.
          </p>
        </div>
      </Stack>
    </div>
  );
}
