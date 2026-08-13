import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on the gated areas plus auth callback; skip static assets.
  matcher: ["/portal/:path*", "/staff/:path*", "/auth/:path*"],
};
