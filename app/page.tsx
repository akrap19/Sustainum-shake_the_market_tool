import { ScreenWarning } from "@/components/shake/screen-warning";
import { ShakeDashboard } from "@/components/shake/shake-dashboard";
import { getCachedDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dataset = await getCachedDataset();
  return (
    <main className="min-h-screen bg-background">
      <ScreenWarning />
      <div className="hidden lg:block">
        <ShakeDashboard initial={dataset} />
      </div>
    </main>
  );
}
