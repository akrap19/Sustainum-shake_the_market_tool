import { NextResponse } from "next/server";
import { getCachedDataset, refreshDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "true";
  try {
    const dataset = refresh ? await refreshDataset() : await getCachedDataset();
    return NextResponse.json(dataset);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to load dataset: ${message}` }, { status: 500 });
  }
}
