import { NextResponse } from "next/server";
export const runtime = "nodejs";
/** Retired diagnostic — returns 404. */
export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
