import { NextResponse } from "next/server";
import { monitorWatchlist } from "@/lib/agents/monitor";

export async function POST() {
  const result = await monitorWatchlist();
  return NextResponse.json(result);
}
