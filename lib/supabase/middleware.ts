import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/**
 * Refreshes the auth session on every request and gates the two portals.
 *  - /portal  → any signed-in user (a client is only ever a client via RLS)
 *  - /staff   → must have a row in `staff`
 * Front-end gating stops mistakes; RLS stops attackers. Both are in place.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Gate the portals, but NOT their own login pages (or they redirect to themselves forever).
  const wantsPortal = path.startsWith("/portal") && !path.startsWith("/portal/login");
  const wantsStaff = path.startsWith("/staff") && !path.startsWith("/staff/login");

  if ((wantsPortal || wantsStaff) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = wantsStaff ? "/staff/login" : "/portal/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (wantsStaff && user && !path.startsWith("/staff/login")) {
    const { data: staffRow } = await supabase
      .from("staff")
      .select("id")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();
    if (!staffRow) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
