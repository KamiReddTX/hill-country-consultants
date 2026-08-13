/**
 * The 14 service lines — verbatim from the prototype.
 * Slugs are the prototype's keys (URL-safe) and drive /services/[slug].
 * Copy rules: hybrid (never "remote-first"); AI is sold, never how we deliver;
 * no personal names or credentials.
 */
import { rateLinesFor, type RateLine } from "@/content/pricing";

export type ServiceKey =
  | "va" | "pm" | "submittals" | "compliance" | "marketing" | "brand"
  | "publishing" | "media" | "digital" | "trainingSvc" | "systems"
  | "events" | "ag" | "grants";

const HOW =
  "Start with the free 30-minute strategy session. We map the work, recommend a plan tier or a standalone scope, and put it in writing before anything begins.";

export interface ServiceMeta { name: string; desc: string }
export const SERVICE_META: Record<ServiceKey, ServiceMeta> = {
  va: { name: "Virtual Assistant & Admin", desc: "A dedicated assistant on set hours each business day — inbox, calendar, CRM, follow-up, file upkeep and a weekly work summary." },
  pm: { name: "Project Management & Coordination", desc: "A plan, a live status board, meeting notes and proactive blocker flags — one place to see where the project stands." },
  submittals: { name: "Construction Submittals & Technical Documents", desc: "Index, OEM cut sheets, marked values, compliance checklist, Bates numbering and transmittal — on your letterhead." },
  compliance: { name: "Compliance & Documentation", desc: "Capabilities statements, certifications, prequalification packages and SOPs that keep you bid-ready and audit-ready." },
  marketing: { name: "Marketing Services & Graphics", desc: "Social graphics, flyers, ad and email creative, campaign concepts and a content calendar at higher tiers." },
  brand: { name: "Brand Systems", desc: "Palette, type and logo-usage rules, reusable templates, and governance so the brand stays consistent." },
  publishing: { name: "Publishing & Editorial", desc: "Editorial passes, interior and eBook formatting, cover coordination, release strategy and distribution — under Redd Ladys Chronicles." },
  media: { name: "Music, Media & Podcast", desc: "Episode editing, show and cover art, audiograms, season pipelines and distribution setup." },
  digital: { name: "App, Web & PWA Development", desc: "Landing pages, multi-page sites, PWA MVPs and phased app builds, with hosting and handoff." },
  trainingSvc: { name: "Corporate Training", desc: "Eight classes taught on site or virtually — workbook, resource pack and a hands-on build lab that produces real deliverables." },
  systems: { name: "Systems & Automation", desc: "SOPs, process maps, dashboards and trackers, plus AI workflow setup and team training for your repetitive work." },
  events: { name: "Event Planning, in person", desc: "Event plan and budget outline, run-of-show, vendor coordination and on-site coordination at higher tiers." },
  ag: { name: "Agriculture & Land", desc: "Regenerative plan framework, stewardship calendar, record-keeping templates and operations coordination." },
  grants: { name: "Grants & Nonprofit Administration", desc: "Grant research and prospect lists, application preparation and submission, compliance checklists and funder reporting." },
};

export interface ServiceDetail {
  headline: string;
  pain: string;
  included: string[];
  expect: string[];
  scope: string;
  how: string;
}

export const SERVICE_DETAILS: Record<ServiceKey, ServiceDetail> = {
  va: {
    headline: "Book a Virtual Assistant",
    pain: "The inbox, the scheduling, the invoicing, the follow-up nobody owns — it all lands on the person least able to drop it. A dedicated assistant handles the recurring administrative work that keeps a business running, on a set number of hours each business day.",
    included: ["Inbox and calendar management; scheduling and appointment setting", "Data entry, CRM updates, and file and document organization", "Document formatting and preparation; light research", "Client, vendor and subcontractor follow-up and coordination", "Travel and logistics booking", "A weekly summary of tasks completed"],
    expect: ["An assigned assistant and a dedicated block of hours each business day — 2, 5, or 8 by tier", "Same-business-day acknowledgment; tasks actioned in agreed priority", "Secure handling of logins and credentials", "A shared task board so you always see status", "A weekly work summary"],
    scope: "Hours are capped by tier; overage is billed at $55 Foundation / $50 Momentum / $40 Enterprise per hour. Not a substitute for licensed bookkeeping, legal, or tax services.",
    how: HOW,
  },
  pm: {
    headline: "Project Management & Coordination",
    pain: "We drive projects and initiatives to completion — tracking tasks, deadlines, dependencies, and the people involved, so there is one place to see where things stand.",
    included: ["A project plan and timeline", "A live task and status board — a single source of truth", "Regular status updates, meeting coordination and notes", "Vendor and subcontractor coordination", "Proactive risk and blocker flags"],
    expect: ["A named coordinator and a regular status cadence", "One active project at Foundation, up to three concurrent at Momentum, program-level at Enterprise", "Weekly status at minimum; same-day on blockers", "Scope and milestones approved in writing before work starts", "A close-out wrap summary at the end"],
    scope: "We coordinate — we do not provide stamped or licensed construction management or engineering.",
    how: HOW,
  },
  submittals: {
    headline: "Get Your Submittals Handled",
    pain: "A rejected submittal costs a week you did not have. We prepare submittal packages and technical project documents so you move through architect and engineer review cleanly, without avoidable rejections.",
    included: ["Submittal index and cover on your company letterhead", "Product data and cut-sheet compilation from genuine manufacturer (OEM) datasheets", "Project-specific values marked on each datasheet", "A separate compliance checklist, and a separate RFI when one is needed", "Bates numbering, letterhead header and footer, and a transmittal", "One included revision round per package"],
    expect: ["Up to 4, 12, or 24 packages a month by tier, priority turnaround at Enterprise", "Genuine OEM datasheets only, on your letterhead", "Your general contractor or contractor of record reviews and signs", "A final review confirming only this project’s information is present", "Standalone packages $350; weekly service $750/wk at any volume; rush $550/job"],
    scope: "Flat fee per unit; revisions beyond the first round are billed separately. We prepare — we do not certify or stamp engineering. Extra packages beyond your allotment are $450/week at any volume.",
    how: "Bring a specification section and a live project to the free strategy session. We tell you the volume you need and what it costs.",
  },
  compliance: {
    headline: "Compliance & Documentation",
    pain: "We build the documents that make a business bid-ready and audit-ready — the paperwork that keeps you eligible to work.",
    included: ["Capabilities statements and company and executive profiles", "Certifications, including non-debarment, and one-sheets", "Prequalification packages and standard business documents", "Mutual NDAs from template", "SOPs and records organization"],
    expect: ["Branded, accurate, on-time documents", "One revision round included", "Builds or refreshes per month set by your tier — 1, 3, or 6, plus full library buildout at Enterprise", "Contact information verified; no personal details"],
    scope: "Legal-wording conflicts are flagged to your attorney and never altered by us. Legal review is your attorney’s role.",
    how: HOW,
  },
  marketing: {
    headline: "Run Your Marketing & Brand",
    pain: "The posting happens when there is time, and prospects see an inconsistent company. We keep the brand visible with consistent, on-brand content and campaigns produced on a schedule.",
    included: ["Social graphics, flyers and ad creative", "Email and promotional graphics", "Multi-asset campaign concepts", "A content calendar at higher tiers"],
    expect: ["4, 12, or 24 graphics a month by tier, plus campaigns at Momentum and Enterprise", "Brand-consistent work at correct platform dimensions", "One revision round included", "Your approval before anything is posted"],
    scope: "Paid ad spend, stock and licensing are billed at cost. Volumes are set by tier.",
    how: HOW,
  },
  brand: {
    headline: "Brand Systems",
    pain: "Three versions of the logo are in circulation and nobody knows which is current. We define and maintain a consistent visual brand your team can apply correctly.",
    included: ["Brand starter kit — palette, fonts, logo-usage basics", "Full brand system — guidelines plus reusable templates", "Ongoing brand governance at higher tiers"],
    expect: ["Cohesive, documented brand assets", "Editable templates delivered in usable formats", "Usage rules written down, not assumed", "Assets organized and handed off"],
    scope: "Starter kit once per term. A full logo design from scratch may be scoped separately.",
    how: HOW,
  },
  publishing: {
    headline: "Publish Your Book",
    pain: "The manuscript is done, or close, and the next steps are a maze. We take a manuscript from draft to launch under Redd Ladys Chronicles.",
    included: ["Editorial consultation and manuscript editing", "Developmental, line, and proof passes", "eBook formatting and cover coordination", "Full interior and production build", "Release and launch strategy, and distribution setup"],
    expect: ["A staged pipeline with clear milestones", "Metadata and ISBN set before release", "One title per term at Enterprise", "Editorial from $450 per 10k words; full production and release from $3,500 standalone"],
    scope: "Ghostwriting is priced separately, from $10,000. ISBN and print runs at cost. Contract and rights language is flagged to your attorney and never altered by us.",
    how: "Bring the manuscript, or the idea, to the free strategy session. We scope the stage you are actually at.",
  },
  media: {
    headline: "Music, Media & Podcast",
    pain: "We produce and publish audio and media content on a schedule, so a show does not stall at episode four.",
    included: ["Podcast episode editing, show and cover art", "Audiograms and short-form clips", "Full season pipeline, up to 13 episodes", "Distribution setup"],
    expect: ["A set number of episodes and assets per month by tier", "Audio leveled and clean, art on brand, metadata complete", "Published on schedule", "Promo assets delivered with each episode"],
    scope: "Recording talent is yours. Studio and venue costs are billed at cost.",
    how: HOW,
  },
  digital: {
    headline: "App, Web & PWA Development",
    pain: "We build web and app products, from a single landing page to a phased application.",
    included: ["Landing pages and multi-page sites", "PWA MVP scoping and build", "Phased full app builds", "Hosting and deployment setup"],
    expect: ["A scoped project with phased milestones and previews before launch", "Tested across devices, links and forms verified", "Hosting live and credentials handed off to you", "Landing page from $650; site or PWA MVP from $2,500 standalone"],
    scope: "Hosting, domain, and app-store fees at cost. Large builds are scoped separately, from $6,000.",
    how: HOW,
  },
  trainingSvc: {
    headline: "Corporate Training",
    pain: "We teach team classes drawn from our own service lines — half or full day, on site or virtual, with a hands-on build lab where your team produces real deliverables in the room.",
    included: ["Half- or full-day workshop, on site or virtual", "Workbook and resource pack", "Hands-on build lab", "Working deliverables built during the session", "Post-class materials, feedback survey and certificates"],
    expect: ["Content tailored to your industry before the session", "Up to 20 participants; add $75 per person beyond 20", "Cadence set by your plan tier", "Eight classes to choose from"],
    scope: "Standalone rates are $3,000 for a half day and $4,500 for a full day. Classes are included in every plan at your tier’s cadence.",
    how: HOW,
  },
  systems: {
    headline: "Systems & Automation",
    pain: "We turn what your business knows into repeatable systems — including AI workflows set up for your own repetitive work, with guardrails.",
    included: ["Documented SOPs and process maps", "Workflow and automation setup", "Dashboards and trackers", "Prompt libraries for your team’s AI-assisted tasks"],
    expect: ["A set number of workflow and system builds by tier", "Built and tested with your real inputs", "Written documentation your team can run from", "Your team trained, with AI guardrails documented"],
    scope: "Third-party software subscriptions are billed at cost.",
    how: HOW,
  },
  events: {
    headline: "Event Planning, in person",
    pain: "We plan and run in-person events — launches, workshops, and gatherings.",
    included: ["Event plan and budget outline", "Run-of-show and timeline", "Vendor coordination and materials", "On-site coordination at higher tiers"],
    expect: ["One event per term at Foundation, quarterly at Momentum, quarterly with on-site coordination at Enterprise", "A run-of-show approved before the date", "Vendors confirmed and materials ready", "Post-event wrap and follow-up"],
    scope: "In-person only. Venue, catering, and hard costs are billed at cost.",
    how: HOW,
  },
  ag: {
    headline: "Agriculture & Land",
    pain: "Regenerative land planning and operational support for landowners and working ag operations.",
    included: ["Land and regenerative plan framework", "Stewardship calendar", "Record-keeping templates", "Operations coordination"],
    expect: ["A set number of planning deliverables by tier", "A plan specific to your land and goals", "A seasonal stewardship calendar", "Templates your operation can actually keep up"],
    scope: "Specialized surveying, legal, or agronomy work is referred out as needed.",
    how: HOW,
  },
  grants: {
    headline: "Grants & Nonprofit Administration",
    pain: "We take nonprofits from grant research through submission and reporting, on the funder’s deadlines.",
    included: ["Grant research reports and prospect lists", "Application preparation and submission", "Compliance checklists", "Reporting to funders"],
    expect: ["A set number of applications and reports per quarter by tier", "Eligibility confirmed before work begins", "Narrative, budget and attachments complete against the guidelines", "Submission confirmed and reporting scheduled"],
    scope: "No guarantee of award — we research, prepare, and submit. Volumes are set by tier.",
    how: HOW,
  },
};

/** /services listing, grouped, with the image drop-zone label per line. */
export interface ServiceGroup { group: string; items: { key: ServiceKey; img: string; src: string }[] }
export const SERVICE_GROUPS: ServiceGroup[] = [
  { group: "Admin & Coordination", items: [
    { key: "va", img: "A virtual assistant's organized admin workspace", src: "/images/services/va.jpg" },
    { key: "pm", img: "Project planning and coordination", src: "/images/services/pm.jpg" },
  ]},
  { group: "Construction", items: [
    { key: "submittals", img: "Construction worker carrying steel on a job site", src: "/images/services/submittals.jpg" },
    { key: "compliance", img: "Compliance and documentation records", src: "/images/services/compliance.jpg" },
  ]},
  { group: "Brand & Market", items: [
    { key: "marketing", img: "Marketing strategy documents laid out on a table", src: "/images/services/marketing.jpg" },
    { key: "brand", img: "Brand guidance on a phone beside eyeglasses", src: "/images/services/brand.jpg" },
  ]},
  { group: "Publishing & Media", items: [
    { key: "publishing", img: "Shelves filled with books", src: "/images/services/publishing.jpg" },
    { key: "media", img: "Recording at a podcast microphone", src: "/images/services/media.jpg" },
  ]},
  { group: "Digital", items: [
    { key: "digital", img: "Smartphone home screen with app icons", src: "/images/services/digital.jpg" },
  ]},
  { group: "People & Process", items: [
    { key: "trainingSvc", img: "A corporate training session", src: "/images/services/trainingSvc.jpg" },
    { key: "systems", img: "Systems and automation workflow planning", src: "/images/services/systems.jpg" },
  ]},
  { group: "Events", items: [
    { key: "events", img: "A seminar room arranged with rows of chairs", src: "/images/services/events.jpg" },
  ]},
  { group: "Specialty", items: [
    { key: "ag", img: "Aerial view of a tractor working a field", src: "/images/services/ag.jpg" },
    { key: "grants", img: "Volunteers loading boxes of aid supplies", src: "/images/services/grants.jpg" },
  ]},
];

export const SERVICE_SLUGS = Object.keys(SERVICE_DETAILS) as ServiceKey[];
export const isServiceKey = (s: string): s is ServiceKey => s in SERVICE_DETAILS;
export const serviceRateLines = (key: ServiceKey): RateLine[] => rateLinesFor(key);
