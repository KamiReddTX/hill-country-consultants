/**
 * Plans, the plan-comparison table, and the à-la-carte booking model.
 * Copy is verbatim from the prototype (Hill Country Consultants.dc.html).
 *
 * Two kinds of line item:
 *   BOOK_ITEMS  — fixed price, payable at checkout (Stripe).
 *   QUOTE_ITEMS — scoped work; a booking these becomes a written quote request.
 * RATE_LINES ties each service line to either a BOOK_ITEM (Book now) or a
 * QUOTE_ITEM (Request a quote).
 */

export type PlanTier = "Foundation" | "Momentum" | "Enterprise";

export const PLANS: { name: PlanTier; price: string; best: string }[] = [
  { name: "Foundation", price: "$1,500/mo", best: "Smaller businesses & brands" },
  { name: "Momentum", price: "$4,250/mo", best: "Mid-size, multiple fronts" },
  { name: "Enterprise", price: "$7,000/mo", best: "Program-level coverage" },
];

export const PLAN_ROWS: { label: string; f: string; m: string; e: string }[] = [
  { label: "Best for", f: "Smaller businesses & brands", m: "Mid-size, multiple fronts", e: "Program-level coverage" },
  { label: "Virtual assistant", f: "2 hrs/day (~40/mo)", m: "5 hrs/day (~100/mo)", e: "8 hrs/day (~160/mo)" },
  { label: "Submittals", f: "Up to 4/mo", m: "Up to 12/mo", e: "Up to 24/mo, priority" },
  { label: "Compliance docs", f: "1 build or refresh/mo", m: "3/mo", e: "6/mo + full library buildout" },
  { label: "Projects", f: "1 active", m: "Up to 3 concurrent", e: "Unlimited, program-level" },
  { label: "Marketing graphics", f: "4/mo", m: "12 + 1 campaign/mo", e: "24 + 2 campaigns + calendar" },
  { label: "Brand", f: "Starter kit (once)", m: "Full kit + 2 templates", e: "Complete system + governance" },
  { label: "Publishing", f: "Consult + 1 short piece", m: "Manuscript / eBook track (1)", e: "Full book production + release strategy" },
  { label: "Media", f: "1 asset/mo", m: "Podcast 2 episodes/mo + art", e: "Full season pipeline + distribution" },
  { label: "Digital", f: "1 landing page", m: "Multi-page site or PWA MVP", e: "Full app / PWA build, phased" },
  { label: "Events", f: "1 per term", m: "1/qtr + run-of-show", e: "Quarterly + on-site coordination" },
  { label: "Corporate training", f: "1 class per term", m: "1 class/qtr", e: "Quarterly classes + custom track" },
  { label: "Systems & automation", f: "1 workflow per term", m: "Quarterly buildout", e: "Continuous automation retainer" },
  { label: "Agriculture & land", f: "1 deliverable/mo", m: "1 plan/qtr", e: "Full program management" },
  { label: "Grants", f: "Research + 1 application/qtr", m: "2 applications + reporting/qtr", e: "Full grants calendar + submissions" },
  { label: "Reviews", f: "Monthly review + summary", m: "Bi-weekly + KPI dashboard", e: "Weekly + executive reporting" },
  { label: "Turnaround", f: "Standard", m: "Priority in queue", e: "Priority on everything" },
];

export const PLAN_INCLUDED: string[] = [
  "Dedicated account lead",
  "Onboarding strategy session and 30-day roadmap",
  "Your tier's full allotment across every service line",
  "Scheduled reviews",
  "First round of revisions on standard deliverables",
];

export const PLAN_BILLED: string[] = [
  "Submittal packages beyond your allotment — a flat $450/week covering any number of additional packages that week (the standalone weekly rate for non-plan clients is $750/week)",
  "Rush $550 surcharge added on top of a package, never included in any plan",
  "Additional VA hours $55 Foundation / $50 Momentum / $40 Enterprise",
  "Anything beyond allotment quoted in writing first",
  "Hard costs at cost",
];

export const PLAN_TERMS: string[] = [
  "12-month standard, quarterly option available",
  "First half due on the 1st, second half by the 15th, or paid in full",
  "Pay the year up front and save one month",
  "Standalone projects paid in full at booking",
  "5 business-day grace period",
  "Credit card, Zelle, or Cash App — no checks or money orders",
];

export interface BookItem {
  id: string;
  svc: string;
  group: string;
  name: string;
  unit: string;
  price: number; // USD dollars
}

export const BOOK_ITEMS: BookItem[] = [
  { id: "sub-pkg", svc: "submittals", group: "Construction", name: "Construction submittal package", unit: "per package", price: 350 },
  { id: "sub-week", svc: "submittals", group: "Construction", name: "Weekly submittal service", unit: "per week · any volume", price: 750 },
  { id: "rush", svc: "submittals", group: "Construction", name: "Rush turnaround (surcharge)", unit: "surcharge added on top of a package · never included in a plan", price: 550 },
  { id: "va-block", svc: "va", group: "Admin", name: "Virtual assistant block", unit: "10 hours at $65/hr · minimum booking", price: 650 },
  { id: "graphic", svc: "marketing", group: "Marketing & brand", name: "Marketing graphic (flyer / social)", unit: "each", price: 125 },
  { id: "brand-starter", svc: "brand", group: "Marketing & brand", name: "Brand starter kit", unit: "one-time", price: 950 },
  { id: "podcast", svc: "media", group: "Publishing & media", name: "Podcast episode (edit + cover art)", unit: "each · up to 90 min · audio edit, cleanup, intro/outro, music, cover art · 1 revision", price: 350 },
  { id: "media-asset", svc: "media", group: "Publishing & media", name: "Media asset (audiogram / short)", unit: "each", price: 95 },
  { id: "grant-research", svc: "grants", group: "Specialty", name: "Grant research report", unit: "each", price: 350 },
  { id: "class-half", svc: "trainingSvc", group: "Training", name: "Corporate class — half day, 4h", unit: "min enrollment 20 · base covers up to 20 · +$250/person over 20", price: 3000 },
  { id: "class-full", svc: "trainingSvc", group: "Training", name: "Corporate class — full day, 6h", unit: "min enrollment 20 · base covers up to 20 · +$250/person over 20", price: 4500 },
];

export interface QuoteItem {
  id: string;
  name: string;
  from: string;
}

export const QUOTE_ITEMS: QuoteItem[] = [
  { id: "q-pm", name: "Project management & coordination", from: "from $1,200/mo" },
  { id: "q-doc", name: "Single document (capabilities, cert, profile, one-sheet, SOP)", from: "from $450" },
  { id: "q-suite", name: "Branded document suite", from: "from $1,800" },
  { id: "q-campaign", name: "Marketing campaign (multi-asset)", from: "from $850" },
  { id: "q-kit", name: "Speaker / media one-sheet & kit", from: "from $350" },
  { id: "q-brand", name: "Full brand system", from: "from $3,500" },
  { id: "q-edit", name: "Editorial / manuscript edit", from: "from $450 per 10k words" },
  { id: "q-ebook", name: "eBook formatting", from: "from $650" },
  { id: "q-book", name: "Full book production + release strategy", from: "from $3,500" },
  { id: "q-ghost", name: "Ghostwriting", from: "from $10,000" },
  { id: "q-season", name: "Podcast season pipeline (13 episodes)", from: "from $3,900" },
  { id: "q-landing", name: "Landing page", from: "from $650" },
  { id: "q-site", name: "Multi-page site / PWA MVP", from: "from $2,500" },
  { id: "q-app", name: "Full app / PWA build", from: "from $6,000" },
  { id: "q-event", name: "Event planning (in person)", from: "from $1,500" },
  { id: "q-systems", name: "Systems & automation buildout", from: "scoped to your process" },
  { id: "q-ag", name: "Agriculture & land planning", from: "from $500 per deliverable" },
  { id: "q-grant-app", name: "Grant application", from: "from $750" },
  { id: "q-copy", name: "Copywriting", from: "from $250 per project" },
  { id: "q-notary", name: "Notary service — online or in person (Texas)", from: "$25 online · $10/act in person (TX) + travel" },
];

export interface RateLine {
  svc: string;
  n: string;
  p: string;
  cart?: string; // BOOK_ITEMS id  → "Book & pay"
  quote?: string; // QUOTE_ITEMS id → "Request a quote"
  // Neither cart nor quote → an informational line: name + price as text, no button.
}

export const RATE_LINES: RateLine[] = [
  { svc: "va", n: "Virtual assistant block — 10 hours", p: "$650", cart: "va-block" },
  { svc: "va", n: "Additional hours beyond the block", p: "$65/hr" },
  { svc: "pm", n: "Project management & coordination", p: "from $1,200/mo", quote: "q-pm" },
  { svc: "submittals", n: "Submittal package", p: "$350 each", cart: "sub-pkg" },
  { svc: "submittals", n: "Weekly submittal service · any volume", p: "$750/wk", cart: "sub-week" },
  { svc: "submittals", n: "Rush turnaround (surcharge on a package)", p: "$550 · added on top of a package · never in a plan", cart: "rush" },
  { svc: "compliance", n: "Single document — capabilities, cert, profile, one-sheet or SOP", p: "from $450", quote: "q-doc" },
  { svc: "compliance", n: "Branded document suite", p: "from $1,800", quote: "q-suite" },
  { svc: "marketing", n: "Marketing graphic — flyer, social, ad or email", p: "$125 each", cart: "graphic" },
  { svc: "marketing", n: "Multi-asset campaign", p: "from $850", quote: "q-campaign" },
  { svc: "marketing", n: "Copywriting", p: "from $250 per project", quote: "q-copy" },
  { svc: "marketing", n: "Speaker / media one-sheet & kit", p: "from $350", quote: "q-kit" },
  { svc: "brand", n: "Brand starter kit", p: "$950", cart: "brand-starter" },
  { svc: "brand", n: "Full brand system", p: "from $3,500", quote: "q-brand" },
  { svc: "publishing", n: "Editorial / manuscript edit", p: "from $450 per 10k words", quote: "q-edit" },
  { svc: "publishing", n: "eBook formatting", p: "from $650 per title", quote: "q-ebook" },
  { svc: "publishing", n: "Full book production + release strategy", p: "from $3,500", quote: "q-book" },
  { svc: "publishing", n: "Ghostwriting", p: "from $10,000", quote: "q-ghost" },
  { svc: "media", n: "Podcast episode — edit + cover art", p: "$350 each", cart: "podcast" },
  { svc: "media", n: "Season pipeline — 13 episodes", p: "from $3,900", quote: "q-season" },
  { svc: "media", n: "Media asset — audiogram or short", p: "$95 each", cart: "media-asset" },
  { svc: "digital", n: "Landing page", p: "from $650", quote: "q-landing" },
  { svc: "digital", n: "Multi-page site or PWA MVP", p: "from $2,500", quote: "q-site" },
  { svc: "digital", n: "Full app / PWA build", p: "from $6,000", quote: "q-app" },
  { svc: "trainingSvc", n: "Corporate class — half day, 4h", p: "$3,000", cart: "class-half" },
  { svc: "trainingSvc", n: "Corporate class — full day, 6h", p: "$4,500", cart: "class-full" },
  { svc: "systems", n: "Systems & automation buildout", p: "scoped to your process", quote: "q-systems" },
  { svc: "events", n: "Event planning, in person", p: "from $1,500 + hard costs", quote: "q-event" },
  { svc: "ag", n: "Agriculture & land planning", p: "from $500 per deliverable", quote: "q-ag" },
  { svc: "grants", n: "Grant research report", p: "$350 each", cart: "grant-research" },
  { svc: "grants", n: "Grant application", p: "from $750 each", quote: "q-grant-app" },
  { svc: "notary", n: "Notarization — online (RON) or in-person (Texas)", p: "$25 online · $10/act in-person (TX) + travel from $35", quote: "q-notary" },
];

export const bookItemById = (id: string) => BOOK_ITEMS.find((b) => b.id === id);
export const quoteItemById = (id: string) => QUOTE_ITEMS.find((q) => q.id === id);
export const rateLinesFor = (svc: string) => RATE_LINES.filter((l) => l.svc === svc);
export const usd = (n: number) => "$" + n.toLocaleString("en-US");
