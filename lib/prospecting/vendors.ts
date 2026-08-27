/**
 * Contact-data vendor adapter layer.
 *
 * The reveal route never talks to a vendor directly — it asks getContactVendor()
 * for a candidate value. The active vendor is chosen by env at deploy time, so
 * going from demo to live is a config change, not a code change:
 *
 *   PROSPECT_CONTACT_VENDOR   "stub" (default) | "hunter"
 *   HUNTER_API_KEY            required when PROSPECT_CONTACT_VENDOR=hunter
 *   PROSPECT_STUB_FALLBACK    "false" to disable stub fallback for fields the
 *                             live vendor can't serve (e.g. phones on Hunter).
 *                             Default: fallback ON (keeps phones demoable).
 *
 * A vendor that returns no value costs nothing: the reveal RPC only debits a
 * credit when a real value is stored, so misses are free.
 */

export type RevealField = "email" | "phone_direct" | "phone_mobile";

export type VendorInput = {
  contact_id: string;
  first_name?: string | null;
  last_name?: string | null;
  domain?: string | null;
  company?: string | null;
};

export type VendorResult = { value: string | null; vendor: string; confidence?: number | null };

interface ContactVendor {
  name: string;
  supports(field: RevealField): boolean;
  lookup(field: RevealField, input: VendorInput): Promise<{ value: string | null; confidence?: number | null }>;
}

/** Stub: synthesizes a plausible-looking placeholder. Emails from name+domain;
 *  phones in the reserved fictional 555-01xx range so nothing real is dialed. */
const stubVendor: ContactVendor = {
  name: "stub",
  supports: () => true,
  async lookup(field, input) {
    const fn = (input.first_name || "").toLowerCase().replace(/[^a-z]/g, "");
    const ln = (input.last_name || "").toLowerCase().replace(/[^a-z]/g, "");
    if (field === "email") {
      return { value: `${fn || "contact"}.${ln || "x"}@${(input.domain || "example.com").toLowerCase()}` };
    }
    const h = [...input.contact_id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return { value: `+1 (555) 01${h % 10}-${String(1000 + (h % 9000))}` };
  },
};

/** Hunter.io Email Finder — real, verified business emails. Free tier available.
 *  Email only; phone fields fall through to the fallback. */
const hunterVendor: ContactVendor = {
  name: "hunter",
  supports: (field) => field === "email",
  async lookup(field, input) {
    if (field !== "email") return { value: null };
    const key = process.env.HUNTER_API_KEY;
    if (!key || !input.domain || !input.first_name || !input.last_name) return { value: null };
    const u = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(input.domain)}`
      + `&first_name=${encodeURIComponent(input.first_name)}&last_name=${encodeURIComponent(input.last_name)}`
      + `&api_key=${encodeURIComponent(key)}`;
    try {
      const r = await fetch(u, { headers: { accept: "application/json" } });
      if (!r.ok) return { value: null };
      const j: any = await r.json();
      return { value: j?.data?.email || null, confidence: typeof j?.data?.score === "number" ? j.data.score : null };
    } catch {
      return { value: null };
    }
  },
};

const REGISTRY: Record<string, ContactVendor> = { stub: stubVendor, hunter: hunterVendor };

/** Resolve the active vendor with fallback behavior baked in. Returns a single
 *  lookup() the route can call for any field; the returned `vendor` names who
 *  actually produced the value, so the audit row (reveals.vendor) is accurate. */
export function getContactVendor(): { name: string; lookup: (field: RevealField, input: VendorInput) => Promise<VendorResult> } {
  const sel = (process.env.PROSPECT_CONTACT_VENDOR || "stub").toLowerCase();
  const primary = REGISTRY[sel] || stubVendor;
  const allowStubFallback = process.env.PROSPECT_STUB_FALLBACK !== "false";

  return {
    name: primary.name,
    async lookup(field, input) {
      if (primary.supports(field)) {
        const r = await primary.lookup(field, input);
        if (r.value) return { value: r.value, vendor: primary.name, confidence: r.confidence ?? null };
        // Primary supports the field but found nothing → optional stub fallback.
        if (primary.name !== "stub" && allowStubFallback) {
          const s = await stubVendor.lookup(field, input);
          return { value: s.value, vendor: "stub" };
        }
        return { value: null, vendor: primary.name };
      }
      // Primary can't serve this field (e.g. Hunter + phone) → stub fallback if allowed.
      if (allowStubFallback) {
        const s = await stubVendor.lookup(field, input);
        return { value: s.value, vendor: "stub" };
      }
      return { value: null, vendor: primary.name };
    },
  };
}
