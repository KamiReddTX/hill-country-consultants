import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Track A ingest job. Pulls a page from a state open-data source, lands raw,
 * normalizes, and inserts new companies into prospect_accounts. State-agnostic:
 * each source is one adapter in ADAPTERS. The same route ingests a free state
 * registry or (later) the paid national file — only the adapter changes.
 *
 * Auth: an admin staff session, OR the x-ingest-secret header matching
 * INGEST_SECRET (for scheduled cron). Writes run under the service role.
 * Records an ingest_runs row and a 15%-deviation guard for scheduled refreshes.
 */

type Canonical = {
  legal_name: string; street?: string | null; city?: string | null; state?: string | null;
  zip?: string | null; formation_date?: string | null; location_type?: string | null;
  vendor: string; vendor_record_id: string;
};

type Adapter = {
  key: string; label: string;
  url: (limit: number, offset: number) => string;
  map: (r: any) => Canonical | null;
};

const d10 = (v: any) => (typeof v === "string" && v.length >= 10 && !v.startsWith("0001") ? v.slice(0, 10) : null);

const ADAPTERS: Record<string, Adapter> = {
  CO_SOS: {
    key: "CO_SOS", label: "Colorado Secretary of State",
    url: (l, o) => `https://data.colorado.gov/resource/4ykn-tg5h.json?$order=entityformdate%20DESC&$limit=${l}&$offset=${o}`,
    map: (r) => r?.entityname && r?.entityid ? {
      legal_name: r.entityname, street: r.principaladdress1 || null, city: r.principalcity || null,
      state: (r.principalstate || "CO"), zip: r.principalzipcode || null, formation_date: d10(r.entityformdate),
      location_type: (r.jurisdictonofformation === "CO" ? "HQ" : "branch"),
      vendor: "CO_SOS", vendor_record_id: String(r.entityid),
    } : null,
  },
  CT_SOS: {
    key: "CT_SOS", label: "Connecticut Business Registry",
    url: (l, o) => `https://data.ct.gov/resource/n7gp-d28j.json?$order=create_dt%20DESC&$limit=${l}&$offset=${o}`,
    map: (r) => r?.name && (r?.accountnumber || r?.id) ? {
      legal_name: r.name, street: null, city: null, state: "CT", zip: null,
      formation_date: d10(r.date_registration), location_type: "HQ",
      vendor: "CT_SOS", vendor_record_id: String(r.accountnumber || r.id),
    } : null,
  },
  // Texas Comptroller — active franchise taxpayers (real street/city/zip + charter date).
  // Priority state. Filter to active businesses with a real charter date, newest first.
  TX_COMPTROLLER: {
    key: "TX_COMPTROLLER", label: "Texas (active businesses)",
    url: (l, o) => `https://data.texas.gov/resource/9cir-efmm.json?$where=right_to_transact_business_code%3D%27A%27%20AND%20sos_charter_date%20IS%20NOT%20NULL&$order=sos_charter_date%20DESC&$limit=${l}&$offset=${o}`,
    map: (r) => r?.taxpayer_name && r?.taxpayer_number ? {
      legal_name: String(r.taxpayer_name).trim(),
      street: r.taxpayer_address || null, city: r.taxpayer_city || null,
      state: (r.taxpayer_state || "TX"), zip: r.taxpayer_zip ? String(r.taxpayer_zip).slice(0, 5) : null,
      formation_date: d10(r.sos_charter_date),
      location_type: (!r.taxpayer_state || r.taxpayer_state === "TX") ? "HQ" : "branch",
      vendor: "TX_COMPTROLLER", vendor_record_id: String(r.taxpayer_number),
    } : null,
  },
};

const yearsSince = (iso: string | null) => {
  if (!iso) return null;
  const then = new Date(iso + "T00:00:00Z").getTime();
  if (!isFinite(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / (365.25 * 86400000)));
};

export async function POST(req: Request) {
  // Auth: admin session OR cron secret.
  const secret = req.headers.get("x-ingest-secret");
  let authed = false;
  if (secret && process.env.INGEST_SECRET && secret === process.env.INGEST_SECRET) authed = true;
  else {
    const staff = await getStaff();
    if (staff) {
      const admin = createServiceClient();
      const titles = [staff.role, ...((staff.roles as string[] | null) || [])].filter(Boolean);
      const { data: perms } = await admin.from("role_permissions").select("can_admin").in("role_title", titles);
      authed = (perms || []).some((p: any) => p.can_admin);
    }
  }
  if (!authed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const source = String(body.source || "");
  const adapter = ADAPTERS[source];
  if (!adapter) return NextResponse.json({ error: "unknown_source", sources: Object.keys(ADAPTERS) }, { status: 400 });
  const limit = Math.min(1000, Math.max(1, Math.floor(Number(body.limit) || 500)));
  const offset = Math.max(0, Math.floor(Number(body.offset) || 0));

  const db = createServiceClient();
  const { data: runRow } = await db.from("ingest_runs")
    .insert({ source, source_url: adapter.url(limit, offset), status: "running" } as any)
    .select("id").maybeSingle();
  const runId = (runRow as any)?.id;

  let raw: any[] = [];
  try {
    const res = await fetch(adapter.url(limit, offset), { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`source HTTP ${res.status}`);
    raw = await res.json();
    if (!Array.isArray(raw)) throw new Error("source did not return an array");
  } catch (e: any) {
    await db.from("ingest_runs").update({ status: "error", retrieved_at: new Date().toISOString(), note: String(e?.message || e) }).eq("id", runId);
    return NextResponse.json({ error: "fetch_failed", detail: String(e?.message || e) }, { status: 502 });
  }

  // Deviation guard for scheduled full refreshes (offset 0, no explicit small limit).
  if (offset === 0) {
    const { data: prev } = await db.from("ingest_runs")
      .select("row_count").eq("source", source).eq("status", "loaded").order("run_started_at", { ascending: false }).limit(1);
    const base = (prev || [])[0]?.row_count;
    if (base && base > 50 && Math.abs(raw.length - base) / base > 0.15) {
      await db.from("ingest_runs").update({ status: "halted", retrieved_at: new Date().toISOString(), row_count: raw.length, note: `row count ${raw.length} deviates >15% from prior ${base}` }).eq("id", runId);
      return NextResponse.json({ halted: true, message: `Row count ${raw.length} deviates >15% from prior run (${base}). Not loaded — investigate.` }, { status: 200 });
    }
  }

  // Land raw (Stage 2).
  if (runId && raw.length) {
    const rawRows = raw.map((r) => ({ run_id: runId, source, raw: r }));
    for (let i = 0; i < rawRows.length; i += 500) await db.from("raw_filings").insert(rawRows.slice(i, i + 500) as any);
  }

  // Normalize (Stage 3) + insert only new records (dedupe on vendor_record_id).
  const mapped = raw.map(adapter.map).filter(Boolean) as Canonical[];
  const ids = mapped.map((m) => m.vendor_record_id);
  const existing = new Set<string>();
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await db.from("prospect_accounts").select("vendor_record_id").eq("vendor", source).in("vendor_record_id", ids.slice(i, i + 500));
    (data || []).forEach((r: any) => existing.add(String(r.vendor_record_id)));
  }
  const fresh = mapped.filter((m) => !existing.has(m.vendor_record_id)).map((m) => ({
    legal_name: m.legal_name, street: m.street ?? null, city: m.city ?? null, state: m.state ?? null,
    zip: m.zip ?? null, formation_date: m.formation_date ?? null, years_in_business: yearsSince(m.formation_date ?? null),
    location_type: m.location_type ?? null, vendor: m.vendor, vendor_record_id: m.vendor_record_id,
    source_url: adapter.url(limit, offset), status: "new",
  }));

  let inserted = 0;
  for (let i = 0; i < fresh.length; i += 500) {
    const { error, count } = await db.from("prospect_accounts").insert(fresh.slice(i, i + 500) as any, { count: "exact" });
    if (!error) inserted += count ?? 0;
  }

  await db.from("ingest_runs").update({ status: "loaded", retrieved_at: new Date().toISOString(), row_count: raw.length, note: `${inserted} new, ${mapped.length - fresh.length} already present` }).eq("id", runId);
  return NextResponse.json({ ok: true, source, fetched: raw.length, mapped: mapped.length, inserted, duplicates: mapped.length - fresh.length });
}

export async function GET() {
  return NextResponse.json({ sources: Object.values(ADAPTERS).map((a) => ({ key: a.key, label: a.label })) });
}
