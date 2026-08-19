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
  // Extended detail (optional — each renders only when present).
  forWho?: string[];
  examples?: string[];
  deliverables?: string[];
  provide?: string[];
  process?: { t: string; d: string }[];
  timeline?: string;
  revisions?: string;
  notIncluded?: string[];
  addOns?: string[];
  software?: string[];
  afterPurchase?: string;
  faqs?: { q: string; a: string }[];
}

export const SERVICE_DETAILS: Record<ServiceKey, ServiceDetail> = {
  va: {
    headline: "Book a Virtual Assistant",
    pain: "The inbox, the scheduling, the invoicing, the follow-up nobody owns — it all lands on the person least able to drop it. A dedicated assistant handles the recurring administrative work that keeps a business running, on a set number of hours each business day.",
    included: ["Inbox and calendar management; scheduling and appointment setting", "Data entry, CRM updates, and file and document organization", "Document formatting and preparation; light research", "Client, vendor and subcontractor follow-up and coordination", "Travel and logistics booking", "A weekly summary of tasks completed"],
    expect: ["An assigned assistant and a dedicated block of hours each business day — 2, 5, or 8 by tier", "Same-business-day acknowledgment; tasks actioned in agreed priority", "Secure handling of logins and credentials", "A shared task board so you always see status", "A weekly work summary"],
    scope: "Hours are capped by tier; overage is billed at $55 Foundation / $50 Momentum / $40 Enterprise per hour. Not a substitute for licensed bookkeeping, legal, or tax services.",
    how: HOW,
    forWho: [
      "Owners and operators buried in the inbox, scheduling, and follow-up they can't afford to keep doing themselves.",
      "Small teams that need administrative capacity without hiring, onboarding, and running payroll.",
      "Professionals who need a reliable second set of hands on recurring back-office work.",
    ],
    deliverables: [
      "A managed inbox and calendar, kept current every business day.",
      "Updated CRM records and organized, correctly named files.",
      "Formatted documents, prepared correspondence, and light research results.",
      "Booked travel and logistics with itineraries.",
      "Follow-ups sent and tracked with your clients, vendors, and subcontractors.",
      "A weekly written summary of everything completed and the hours used.",
    ],
    provide: [
      "Access to the tools we'll work in — we set up a secure shared password vault, never plain-text logins.",
      "A short intro to your priorities, your preferences, and who's who.",
      "Timely answers when we flag something that needs your decision.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to map the recurring work and recommend the right tier or scope." },
      { t: "Onboarding — week one", d: "Kickoff call, a 30-day roadmap, secure credential handoff through the vault, and your shared task board goes live." },
      { t: "Daily work", d: "Your assistant works the agreed hours each business day in your priority order; you watch status on the task board." },
      { t: "Weekly summary", d: "Every week, a written summary of tasks completed and hours used, reconciled against your allotment." },
      { t: "Reviews", d: "Scheduled reviews on your tier's cadence to adjust priorities and scope as your needs change." },
    ],
    timeline: "Onboarding completes in week one, then recurring work runs continuously each business day. Turnaround on any individual task depends on its scope and your priority order rather than a fixed clock — anything time-sensitive is flagged and sequenced first.",
    revisions: "Administrative work is done to your standard and adjusted until it's right — there's no fixed 'revision round' the way a one-off deliverable has.",
    software: [
      "Google Workspace and Microsoft 365 — email, calendar, docs, sheets, slides.",
      "Common CRMs and project-management / task tools.",
      "Scheduling and calendar-management tools.",
      "Document and file-storage platforms.",
      "Wherever possible, we work in the tools you already use.",
    ],
    notIncluded: [
      "Licensed bookkeeping, accounting, tax, or legal services.",
      "Work beyond your purchased hours (billed as overage at your tier rate).",
      "Specialty production — design, publishing, media, web, submittals — which are their own service lines.",
    ],
    addOns: [
      "Additional hour blocks beyond your tier, billed as overage: $55 Foundation / $50 Momentum / $40 Enterprise per hour.",
      "Any specialty service line as a standalone scope, or as an included allowance at higher tiers.",
    ],
    afterPurchase: "You're routed straight into onboarding: a kickoff call, your 30-day roadmap, secure credential handoff through the shared vault, and your task board and client portal go live in week one — so from day one you see every request, its status, and your weekly summary.",
    faqs: [
      { q: "How is time tracked, and what counts against my hours?", a: "Your assistant logs hours by task. All task work — inbox, scheduling, CRM, follow-up, research, document prep, and coordination — counts against your monthly allotment, and you get a weekly summary of tasks completed and hours used." },
      { q: "Do unused hours roll over?", a: "No. Hours are a monthly allotment and reset each month; unused hours don't carry forward. If you regularly need more, we'll right-size your tier." },
      { q: "Can my assistant communicate with my customers directly?", a: "Yes. With your direction, your assistant can email, schedule, and follow up with your customers on your behalf, representing your business." },
      { q: "What if I need more than my hours in a given month?", a: "Additional time is billed as overage at your tier rate ($55 Foundation / $50 Momentum / $40 Enterprise per hour), and we flag it before you cross the line so there are no surprises." },
      { q: "How do you handle my logins securely?", a: "Through a shared password-manager vault — you hold the master password and we never see or store logins in plain text. At offboarding, access is returned or revoked the same day." },
      { q: "Is this a substitute for a bookkeeper or attorney?", a: "No. We handle administrative and coordination work; licensed bookkeeping, tax, and legal services are outside our scope, and we'll flag anything that needs a licensed professional." },
    ],
  },
  pm: {
    headline: "Project Management & Coordination",
    pain: "We drive projects and initiatives to completion — tracking tasks, deadlines, dependencies, and the people involved, so there is one place to see where things stand.",
    included: ["A project plan and timeline", "A live task and status board — a single source of truth", "Regular status updates, meeting coordination and notes", "Vendor and subcontractor coordination", "Proactive risk and blocker flags"],
    expect: ["A named coordinator and a regular status cadence", "One active project at Foundation, up to three concurrent at Momentum, program-level at Enterprise", "Weekly status at minimum; same-day on blockers", "Scope and milestones approved in writing before work starts", "A close-out wrap summary at the end"],
    scope: "We coordinate — we do not provide stamped or licensed construction management or engineering.",
    how: HOW,
    forWho: [
      "Owners juggling a launch, build, or initiative on top of running the business.",
      "Teams with a project that keeps slipping because no one owns the moving parts.",
      "Anyone who needs one place to see status, deadlines, and who owes what.",
    ],
    examples: [
      "Business launches", "Construction documentation projects", "Website & app projects",
      "Publishing projects", "Events", "Vendor onboarding", "Product launches", "Internal operations & process projects",
    ],
    deliverables: [
      "A shared, live task and status board — one source of truth for the whole project.",
      "Regular status updates and documented meeting notes with action items.",
      "Vendors and subcontractors coordinated, kept on schedule and on deliverable.",
      "Proactive flags on risks, blockers, and slipping dates.",
      "A written project plan and timeline where your tier includes it.",
      "A close-out summary at the end.",
    ],
    provide: [
      "A clear goal, deadline, and any hard constraints.",
      "Access to the people, vendors, and tools involved.",
      "Decisions when we flag something that needs your call.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to define the goal, scope, and what 'done' looks like." },
      { t: "Plan & board setup", d: "We stand up the task/status board and, where your tier includes it, a written project plan and timeline for your approval." },
      { t: "Coordination", d: "We drive tasks, deadlines, and dependencies, coordinate vendors, and keep everyone moving in the right order." },
      { t: "Status & meetings", d: "Regular status updates and documented meetings with action items; blockers flagged the same day." },
      { t: "Close-out", d: "A wrap summary of what was delivered, what's outstanding, and any handoff notes." },
    ],
    timeline: "Timelines are set by the project, not a fixed clock. We agree the plan and milestones up front and report against them on a regular cadence, with blockers surfaced the same day.",
    revisions: "The plan and board are living documents — we adjust scope, sequence, and dates with you as the project evolves, rather than working to a fixed 'revision round.'",
    software: [
      "A shared task/status board — your client-portal board, or your existing tool.",
      "Calendar and meeting tools for scheduling and notes.",
      "Document and file storage for plans, notes, and deliverables.",
      "Wherever possible, the project tools your team already uses.",
    ],
    notIncluded: [
      "Stamped or licensed construction management, engineering, or architectural services.",
      "Vendor contracts and payments — you hold those; we coordinate.",
      "The specialty production itself (design, publishing, web, submittals) — separate service lines we can manage.",
    ],
    addOns: [
      "Additional concurrent projects beyond your tier.",
      "Any specialty service line as the work being managed.",
      "A written project plan & timeline where your tier doesn't include it by default.",
    ],
    afterPurchase: "We schedule the strategy session, define scope and 'done,' and stand up your board — and a written plan where your tier includes it — for approval. Then coordination begins and you track everything from your portal.",
    faqs: [
      { q: "What kinds of projects can you manage?", a: "Business launches, construction documentation projects, website and app builds, publishing projects, events, vendor onboarding, product launches, and internal operations or process projects — among others. If it has moving parts, deadlines, and people to coordinate, we can run it." },
      { q: "Do you run our meetings?", a: "It depends on the project and your tier. On some engagements we facilitate and document meetings; on others we schedule and take notes while you lead. We set that expectation during the strategy session." },
      { q: "Do you handle our vendors and pay them?", a: "We coordinate vendors and subcontractors — schedules, deliverables, and communication — but you hold the contracts and make the payments. We keep everyone on track; you keep control of the money and the agreements." },
      { q: "Do I get a written project plan?", a: "Where your tier includes it, yes — a documented plan and timeline you approve before work begins. Otherwise, planning lives on your shared task board so you still see the full picture." },
      { q: "How many projects can you run at once?", a: "One active project at Foundation, up to three concurrent at Momentum, and program-level coordination at Enterprise." },
      { q: "Is this construction management?", a: "No. We coordinate and document; we do not provide stamped or licensed construction management, engineering, or architectural services." },
    ],
  },
  submittals: {
    headline: "Get Your Submittals Handled",
    pain: "A rejected submittal costs a week you did not have. We prepare submittal packages and technical project documents so you move through architect and engineer review cleanly, without avoidable rejections.",
    included: ["Submittal index and cover on your company letterhead", "Product data and cut-sheet compilation from genuine manufacturer (OEM) datasheets", "Project-specific values marked on each datasheet", "A separate compliance checklist, and a separate RFI when one is needed", "Bates numbering, letterhead header and footer, and a transmittal", "One included revision round per package"],
    expect: ["Up to 4, 12, or 24 packages a month by tier, priority turnaround at Enterprise", "Genuine OEM datasheets only, on your letterhead", "Your general contractor or contractor of record reviews and signs", "A final review confirming only this project’s information is present", "Standalone packages $350; weekly service $750/wk at any volume; rush $550/job"],
    scope: "Flat fee per unit; revisions beyond the first round are billed separately. We prepare — we do not certify or stamp engineering. Extra packages beyond your allotment are $450/week at any volume.",
    how: "Bring a specification section and a live project to the free strategy session. We tell you the volume you need and what it costs.",
    forWho: [
      "General contractors and subs who can't afford a rejected submittal or a lost week.",
      "Trades that need clean, spec-compliant packages without pulling a PM off the job.",
      "Anyone moving product data through architect/engineer review on a deadline.",
    ],
    examples: [
      "Product data & cut-sheet packages", "Marked material submittals", "Compliance checklists",
      "RFIs", "Transmittals", "Closeout / O&M compilation",
    ],
    deliverables: [
      "A complete submittal package on your letterhead — cover, index, and transmittal.",
      "Genuine OEM cut sheets compiled and Bates-numbered.",
      "Project-specific values marked on each datasheet.",
      "A separate compliance checklist (and an RFI when one is needed).",
      "One included revision round per package.",
    ],
    provide: [
      "The relevant specification section(s) for the project.",
      "Your approved products and manufacturers for us to compile and mark.",
      "Project details and your company letterhead / logo.",
      "Your general contractor or contractor of record to review and sign.",
    ],
    process: [
      { t: "Send the spec & products", d: "Give us the specification section and the products you've approved for the project." },
      { t: "We compile & mark", d: "We pull the genuine OEM cut sheets, mark the project-specific values, Bates-number, and build the index, compliance checklist, and transmittal on your letterhead." },
      { t: "Final review", d: "We confirm only this project's information is present and the package is clean for review." },
      { t: "You sign & submit", d: "Your GC or contractor of record reviews and signs; you submit to the architect/engineer." },
      { t: "Revisions", d: "One revision round is included per package; anything beyond is quoted separately." },
    ],
    timeline: "Turnaround is quoted per package based on size and complexity. When you're against a deadline, rush service is $550/job, and weekly service keeps a steady pipeline moving at $750/week for any volume.",
    revisions: "One revision round is included with every package. Revisions beyond the first round are billed separately.",
    software: [
      "PDF assembly and Bates-numbering tools.",
      "Genuine manufacturer (OEM) datasheets only.",
      "Your company letterhead and branding applied to every package.",
    ],
    notIncluded: [
      "Engineering or architectural certification or stamping — we prepare, we do not certify.",
      "Product selection or specification decisions — you provide the approved products; we compile and mark.",
      "Submitting on your behalf — your GC or contractor of record reviews, signs, and submits.",
    ],
    addOns: [
      "Rush turnaround — $550/job.",
      "Weekly service — $750/week at any volume.",
      "Extra packages beyond your tier allotment — $450/week at any volume.",
      "Standalone one-off package — $350.",
    ],
    afterPurchase: "Send the spec section and your approved products; we compile, mark, and assemble the package on your letterhead, run a final check that only this project's information is present, and hand it back for your GC to sign and submit.",
    faqs: [
      { q: "What do I need to provide?", a: "The specification section for the project, the products or manufacturers you've approved, your project details, and your company letterhead. Your general contractor or contractor of record then reviews and signs." },
      { q: "Do you pick the products?", a: "No — you provide the approved products and manufacturers, and we compile the genuine OEM cut sheets and mark the project-specific values. We prepare the package; the product decisions stay with you." },
      { q: "How fast is turnaround?", a: "It's quoted per package based on size and complexity. When you're against a deadline, rush service is $550/job, and weekly service keeps a steady pipeline moving at $750/week for any volume." },
      { q: "How do revisions work?", a: "One revision round is included with every package. Anything beyond the first round is billed separately." },
      { q: "Do you certify or stamp the submittals?", a: "No. We prepare and compile submittal packages; we do not provide engineering or architectural certification or stamping. Your contractor of record reviews and signs." },
      { q: "Can you handle high volume every week?", a: "Yes. Weekly service is $750/week at any volume, and packages beyond your tier allotment are $450/week at any volume." },
    ],
  },
  compliance: {
    headline: "Compliance & Documentation",
    pain: "We build the documents that make a business bid-ready and audit-ready — the paperwork that keeps you eligible to work.",
    included: ["Capabilities statements and company and executive profiles", "Certifications, including non-debarment, and one-sheets", "Prequalification packages and standard business documents", "Mutual NDAs from template", "SOPs and records organization"],
    expect: ["Branded, accurate, on-time documents", "One revision round included", "Builds or refreshes per month set by your tier — 1, 3, or 6, plus full library buildout at Enterprise", "Contact information verified; no personal details"],
    scope: "Legal-wording conflicts are flagged to your attorney and never altered by us. Legal review is your attorney’s role.",
    how: HOW,
    forWho: [
      "Contractors and vendors who need to stay bid-ready and audit-ready.",
      "Businesses pursuing prequalification, certifications, or registrations.",
      "Any company whose paperwork is scattered and needs to be organized and standardized.",
    ],
    examples: [
      "Capability statements", "Company profiles", "Executive bios", "Vendor prequalification packages",
      "SOP manuals", "Policies", "NDAs (from template)", "Certification & registration applications",
      "Contractor documentation packages", "Business documentation library", "Records organization",
    ],
    deliverables: [
      "Branded, accurate capability statements, company profiles, and executive bios.",
      "Vendor prequalification packages assembled and ready to file.",
      "Certification and registration applications prepared — and submitted when you authorize it.",
      "SOP manuals and policies documented to a defined standard.",
      "Mutual NDAs from template (your attorney reviews any legal wording).",
      "An organized business documentation library and records.",
    ],
    provide: [
      "Your company details, certifications, insurance, and any existing documents.",
      "Portal access where we're submitting on your behalf — shared securely through the vault.",
      "Decisions and approvals when we flag something.",
      "Your attorney for any legal-wording review.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to inventory what exists and what you need to be bid- and audit-ready." },
      { t: "Build or refresh", d: "We draft or update the documents to a defined standard — branded, accurate, and with your details verified." },
      { t: "Review", d: "You review; one revision round is included. Legal-wording conflicts are flagged to your attorney, never altered by us." },
      { t: "Prepare & (optionally) submit", d: "We prepare applications and packages; where you authorize it, we submit on your behalf and confirm receipt." },
      { t: "Library & upkeep", d: "At higher tiers we build and maintain your full documentation library so you stay ready." },
    ],
    timeline: "Turnaround depends on the document and how much source material exists; we agree scope and dates up front. Your tier sets how many builds or refreshes are included per month — 1, 3, or 6, plus a full library buildout at Enterprise.",
    revisions: "One revision round is included with each document. Legal-wording conflicts are flagged to your attorney and never altered by us.",
    software: [
      "Document creation and formatting tools, applied to your branding.",
      "A secure shared vault for any credentials when we submit on your behalf.",
      "Government and vendor portals for registrations and prequalification, when authorized.",
    ],
    notIncluded: [
      "Issuing certifications — we prepare and, when authorized, submit; we do not issue or grant certifications.",
      "Legal review or legal advice — legal-wording review is your attorney's role.",
      "Any guarantee of certification, prequalification, or award outcomes.",
    ],
    addOns: [
      "Full business documentation library buildout and upkeep (included at Enterprise).",
      "Additional builds or refreshes beyond your tier allotment.",
      "Submission on your behalf where a package is prepared for filing.",
    ],
    afterPurchase: "We inventory what exists, build or refresh the documents to standard, verify your details, and — where you authorize it — submit applications and confirm receipt, then keep everything organized so you stay bid- and audit-ready.",
    faqs: [
      { q: "Do you issue certifications?", a: "No. We prepare certification and registration applications — and submit them when you authorize it — but we do not issue or grant certifications. The certifying body makes that decision." },
      { q: "What's the difference between preparing and submitting?", a: "Preparing means we assemble and complete the documentation to standard. Submitting means we file it for you through the relevant portal — which we do only when you explicitly authorize it, using access you provide through the secure vault." },
      { q: "Which certifications or registrations can you help with?", a: "Common examples include MBE/WBE/DBE certifications, SAM.gov registration, and vendor prequalification, among others. We help prepare the applications; we don't issue the certification." },
      { q: "Do you provide legal review of NDAs and policies?", a: "No. We provide NDAs from template and document policies, but any legal-wording review is your attorney's role. We flag conflicts to them and never alter legal language ourselves." },
      { q: "How many documents are included?", a: "Your tier sets how many builds or refreshes are included each month — 1 at Foundation, 3 at Momentum, 6 at Enterprise — plus a full documentation library buildout at Enterprise." },
      { q: "Can you organize all our existing business documents?", a: "Yes. We organize records and, at higher tiers, build and maintain a full documentation library so the right paperwork is always current and easy to find." },
    ],
  },
  marketing: {
    headline: "Run Your Marketing & Brand",
    pain: "The posting happens when there is time, and prospects see an inconsistent company. We keep the brand visible with consistent, on-brand content and campaigns produced on a schedule.",
    included: ["Social graphics, flyers and ad creative", "Email and promotional graphics", "Multi-asset campaign concepts", "A content calendar at higher tiers"],
    expect: ["4, 12, or 24 graphics a month by tier, plus campaigns at Momentum and Enterprise", "Brand-consistent work at correct platform dimensions", "Two revision rounds included per design deliverable", "An approval cadence set by your package — per batch, or against an approved calendar"],
    scope: "Where we run paid campaigns, the ad spend is billed to you directly by the platform, not through HCC. Stock and licensing are billed at cost. Volumes are set by tier.",
    how: HOW,
    forWho: [
      "Businesses whose posting happens only when there's time — so prospects see an inconsistent brand.",
      "Owners who need professional graphics and campaigns without hiring a marketing team.",
      "Anyone who wants their marketing produced on a schedule and on brand.",
    ],
    examples: [
      "Marketing strategy", "Social content creation", "Social scheduling & posting", "Community management",
      "Graphic design", "Flyers & advertisements", "Email marketing", "Content calendars", "Campaign planning",
      "Copywriting", "Paid ad setup & management", "Analytics & reporting",
    ],
    deliverables: [
      "On-brand social graphics, flyers, and ad creative.",
      "Email and promotional graphics and copy.",
      "A content calendar, planned and scheduled.",
      "Scheduling and posting to your accounts when you grant access — or a clean handoff for you to post.",
      "Campaign concepts and multi-asset rollouts.",
      "Paid campaign setup and management (your ad spend, billed by the platform).",
      "Analytics and reporting on what's working.",
    ],
    provide: [
      "Your brand assets — logo, colors, fonts, and any guidelines.",
      "Access to the accounts and tools we'll post or advertise in — shared securely through the vault.",
      "Approvals on the cadence your package sets.",
      "Your ad budget, paid directly to the platform where we manage campaigns.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to set goals, audience, and the right mix of creation, posting, and campaigns." },
      { t: "Plan & calendar", d: "We build the content calendar and campaign plan for the period." },
      { t: "Create", d: "We produce the graphics, copy, and creative — on brand, with up to two revision rounds per deliverable." },
      { t: "Approve", d: "You review and approve on your package's cadence — per batch, or against an approved calendar." },
      { t: "Publish & manage", d: "We schedule and post where you've granted access, run paid campaigns where included, and manage the community." },
      { t: "Report", d: "We report on results and adjust the plan." },
    ],
    timeline: "Marketing runs on a recurring schedule set by your content calendar; individual pieces are produced against it, and campaigns are planned around your launch dates. We agree the cadence up front.",
    revisions: "Two revision rounds are included per design deliverable. Revisions beyond the second round are billed separately.",
    software: [
      "Design tools (e.g. Canva, Adobe) applied to your brand.",
      "Scheduling / publishing tools and your social platforms.",
      "Email marketing platforms.",
      "Ad managers (Meta, Google, and similar) where we run paid campaigns.",
      "Analytics and reporting dashboards.",
    ],
    notIncluded: [
      "Ad spend — paid directly by you to the platform; we set up and manage the campaigns.",
      "Brand strategy and identity buildout — that's the Brand Systems service line.",
      "Guaranteed reach, followers, leads, or sales outcomes.",
    ],
    addOns: [
      "Scheduling and direct posting to your accounts (creation-only packages can add this).",
      "Paid ad setup and management (your ad spend billed by the platform).",
      "Higher content volume or additional campaigns beyond your tier.",
    ],
    afterPurchase: "We set goals and the content mix, build your calendar and campaign plan, produce the creative on brand, take your approval on your package's cadence, then publish, run campaigns, and report — so your brand shows up consistently.",
    faqs: [
      { q: "Do you post to my accounts, or just create the content?", a: "Both are available and clearly labeled. Some packages are creation-only — we produce the content and you post it — and others include scheduling and posting directly to your accounts once you grant access through the secure vault." },
      { q: "Do you run my paid ads?", a: "Yes — we can set up and manage paid campaigns on Meta, Google, and similar platforms. The ad spend is billed to you directly by the platform, not through HCC; we manage the creative, targeting, and optimization." },
      { q: "How many revisions do I get on a design?", a: "Two revision rounds are included per design deliverable. Anything beyond the second round is billed separately." },
      { q: "How do approvals work?", a: "It depends on your package and tier. Some engagements approve each batch of content before it goes live; others approve the content calendar up front and we run against it. We set that expectation at kickoff." },
      { q: "Will this guarantee more followers or sales?", a: "No. We produce consistent, on-brand marketing and manage campaigns professionally, but we don't guarantee reach, followers, leads, or sales." },
      { q: "Is brand design included?", a: "Marketing uses your existing brand. Building the brand itself — palette, type, logo usage, and templates — is our Brand Systems service line." },
    ],
  },
  brand: {
    headline: "Brand Systems",
    pain: "Three versions of the logo are in circulation and nobody knows which is current. We define and maintain a consistent visual brand your team can apply correctly.",
    included: ["Brand starter kit — palette, fonts, logo-usage basics", "Full brand system — guidelines plus reusable templates", "Ongoing brand governance at higher tiers"],
    expect: ["Cohesive, documented brand assets", "Editable templates delivered in usable formats", "Usage rules written down, not assumed", "Assets organized and handed off"],
    scope: "Starter kit once per term. A full logo design from scratch may be scoped separately.",
    how: HOW,
    forWho: [
      "Businesses with an inconsistent look — multiple logo versions, no rules, off-brand posts.",
      "New or rebranding companies that need a coherent identity to launch with.",
      "Teams that need reusable templates so anyone can produce on-brand materials.",
    ],
    examples: [
      "Brand strategy", "Target-customer profile", "Positioning", "Brand voice", "Tagline",
      "Color palette", "Typography", "Logo usage & variations", "Social templates", "Brand guide",
      "Business cards", "Letterhead", "Email signature", "Canva templates",
    ],
    deliverables: [
      "A brand strategy: target-customer profile, positioning, voice, and a tagline direction.",
      "A visual system: color palette, typography, and logo usage rules & variations.",
      "Collateral: business cards, letterhead, and an email signature.",
      "Reusable social and document templates.",
      "A written brand guide that ties it all together.",
      "Original logo design at a higher tier or as an add-on.",
    ],
    provide: [
      "Any existing brand assets — current logo, past materials, inspiration.",
      "Input on your audience, positioning, and preferences.",
      "Approvals at each stage.",
      "Access to accounts/tools where we set up templates — shared through the vault.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to understand your business, audience, and where the brand stands today." },
      { t: "Strategy & direction", d: "We define your target customer, positioning, voice, and tagline direction for your approval." },
      { t: "Visual system", d: "We build the palette, typography, and logo usage rules & variations." },
      { t: "Collateral & templates", d: "We produce cards, letterhead, email signature, and reusable templates." },
      { t: "Brand guide & handoff", d: "We package everything into a written brand guide and hand off your files." },
    ],
    timeline: "The starter kit runs as a staged project with clear milestones; timing depends on scope and how quickly approvals come back. The kit is delivered once per term.",
    revisions: "Each stage is reviewed and approved before we move on, with revisions built into the stage rather than a fixed post-delivery round.",
    software: [
      "Design tools (Adobe, Canva) for the system and templates.",
      "Editable template formats your team can use (Canva at higher tiers).",
      "Export formats: PNG, JPG, PDF, and SVG where relevant.",
    ],
    notIncluded: [
      "Original logo design at the base level — it's a higher-tier inclusion or an add-on.",
      "Full marketing execution — creating and posting content is the Marketing service line.",
      "Trademark registration or legal review of names and marks.",
    ],
    addOns: [
      "Original logo design from scratch.",
      "Additional collateral or templates beyond the kit.",
      "Ongoing brand governance at higher tiers.",
    ],
    afterPurchase: "We run the kit as a staged project — strategy, then the visual system, then collateral and templates, then a written brand guide — approving each stage with you, and hand off your files in the formats your package includes.",
    faqs: [
      { q: "Is logo design included?", a: "The kit includes logo usage rules and variations of your existing logo. Original logo design from scratch is included at a higher tier or available as an add-on." },
      { q: "What exactly is in the Brand Starter Kit?", a: "A brand strategy (target-customer profile, positioning, voice, and tagline direction), a visual system (color palette, typography, logo usage and variations), collateral (business cards, letterhead, email signature), reusable templates, and a written brand guide." },
      { q: "What files do I receive?", a: "It depends on your package. Higher tiers include editable templates (e.g., Canva) alongside exports (PNG, JPG, PDF, and SVG where relevant) and the brand guide; the base level delivers exports and the guide." },
      { q: "Do you handle trademarks?", a: "No. We build the brand identity and guide; trademark searches, registration, and legal review of names or marks are outside our scope and are your attorney's role." },
      { q: "How is this different from Marketing?", a: "Brand Systems builds the identity — the palette, type, logo rules, templates, and guide. Marketing then uses that identity to create and post content and run campaigns." },
      { q: "How often can I get a starter kit?", a: "The starter kit is delivered once per term; ongoing brand governance is available at higher tiers to keep everything consistent as you grow." },
    ],
  },
  publishing: {
    headline: "Publish Your Book",
    pain: "The manuscript is done, or close, and the next steps are a maze. We take a manuscript from draft to launch under Redd Ladys Chronicles, our publishing imprint — and you keep ownership of your book.",
    included: ["Editorial consultation and manuscript editing", "Developmental, line, and proof passes", "eBook formatting and cover coordination", "Full interior and production build", "Release and launch strategy, and distribution setup"],
    expect: ["A staged pipeline with clear milestones", "Metadata and ISBN set before release", "One title per term at Enterprise", "Editorial from $450 per 10k words; full production and release from $3,500 standalone"],
    scope: "Ghostwriting is priced separately, from $10,000. ISBN and print runs at cost. Contract and rights language is flagged to your attorney and never altered by us.",
    how: "Bring the manuscript, or the idea, to the free strategy session. We scope the stage you are actually at.",
    forWho: [
      "Authors with a finished or nearly finished manuscript who don't know the next steps.",
      "Writers who want a professional book — edited, formatted, and distributed — without piecing together freelancers.",
      "Anyone taking a book from idea to launch who wants to keep ownership of it.",
    ],
    examples: [
      "Developmental editing", "Line editing", "Copyediting", "Proofreading", "Interior formatting",
      "eBook formatting", "Print formatting", "Cover design & coordination", "Metadata & ISBN assistance",
      "Distribution (KDP, IngramSpark)", "Proof & author copies", "Launch materials", "Ghostwriting", "Publishing consultation",
    ],
    deliverables: [
      "Editorial passes — developmental, line, copyedit, and proofread — at the stage you need.",
      "A formatted print interior and a formatted eBook.",
      "A designed or coordinated cover.",
      "Metadata prepared and your ISBN registered before release.",
      "Distribution set up on your accounts (Amazon KDP, IngramSpark).",
      "Proof and author copies ordered.",
      "A release plan and launch materials.",
    ],
    provide: [
      "Your manuscript — or the idea, if we're starting earlier.",
      "Your author/publisher accounts and ISBN (we help you obtain one you own).",
      "Approvals at each stage.",
      "Any comp titles or look you want the book to echo.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to scope the exact stage you're at — editing, formatting, or full production." },
      { t: "Editing", d: "The editorial passes your manuscript needs, one stage at a time, with your approval between stages." },
      { t: "Design & format", d: "Cover design or coordination, plus print and eBook interior formatting." },
      { t: "Metadata & ISBN", d: "We prepare metadata and register your ISBN before release." },
      { t: "Distribution & launch", d: "We set up distribution on your accounts, order proofs and author copies, and prep launch materials." },
    ],
    timeline: "Timing depends on the stage and the manuscript's length and condition; we scope it at the strategy session and run a staged pipeline with clear milestones. Editorial starts from $450 per 10k words; full production and release from $3,500 standalone.",
    revisions: "Each editorial and design stage includes review and approval before the next begins. Additional passes beyond the scoped stage are quoted separately.",
    software: [
      "Professional editing and formatting tools for print and eBook.",
      "Cover design tools.",
      "Amazon KDP and IngramSpark for distribution.",
      "Your own author/publisher accounts wherever possible.",
    ],
    notIncluded: [
      "Copyright registration and legal/rights review — that's your attorney's role; we flag rights language and never alter it.",
      "Any guarantee of sales, rankings, or reviews.",
      "Ghostwriting in the base price — it's scoped separately, from $10,000.",
    ],
    addOns: [
      "Ghostwriting (from $10,000).",
      "Additional editorial passes beyond the scoped stage.",
      "Print runs and author copies (at cost).",
      "Publishing consultation as a standalone.",
    ],
    afterPurchase: "We scope the exact stage you're at, then run a staged pipeline — editing, design and formatting, metadata and ISBN, then distribution and launch — approving each stage with you, and set everything up on your own accounts so the book stays yours.",
    faqs: [
      { q: "Who owns the copyright?", a: "You do, on standard projects — the author retains full copyright to their work. Ghostwritten projects can differ and are handled by contract; either way, rights language is flagged to your attorney and never altered by us." },
      { q: "Whose ISBN is used?", a: "Your own. We help you obtain an ISBN you own, so you're the publisher of record. ISBNs are billed at cost." },
      { q: "Who receives the royalties?", a: "It depends on how the book is published. On your own KDP/IngramSpark accounts, retailers pay royalties directly to you. If you choose to publish through our imprint's accounts, royalties come through the imprint and are passed to you per your agreement." },
      { q: "What does “Redd Ladys Chronicles, registered with the Library of Congress” mean?", a: "Redd Ladys Chronicles is our publishing imprint, registered as a publisher. That's about the imprint's standing — it doesn't by itself add a catalog record to your individual book. If you want a Library of Congress Control Number for your title, that's a separate step we can discuss; we won't imply a benefit your book doesn't receive." },
      { q: "What platforms do you distribute on?", a: "Primarily Amazon KDP and IngramSpark, set up on your accounts. We prepare metadata and register your ISBN before release, and can order proof and author copies." },
      { q: "What's the typical timeline?", a: "It depends on the stage and the manuscript — its length and condition. We scope it at the strategy session and run a staged pipeline with clear milestones, so you always know what's next." },
      { q: "Do you offer ghostwriting?", a: "Yes, priced separately from $10,000. Copyright and rights on ghostwritten work are handled by contract." },
      { q: "How many revisions are included?", a: "Each editorial and design stage includes review and approval before the next begins. Additional passes beyond the scoped stage are quoted separately." },
    ],
  },
  media: {
    headline: "Music, Media & Podcast",
    pain: "We produce and publish audio and media content on a schedule, so a show does not stall at episode four.",
    included: ["Podcast episode editing, show and cover art", "Audiograms and short-form clips", "Full season pipeline, up to 13 episodes", "Distribution setup"],
    expect: ["A set number of episodes and assets per month by tier", "Audio leveled and clean, art on brand, metadata complete", "Published on schedule", "Promo assets delivered with each episode"],
    scope: "Recording talent is yours. Studio and venue costs are billed at cost.",
    how: HOW,
    forWho: [
      "Podcasters and creators whose show stalls because editing piles up.",
      "Businesses running a show or channel that needs consistent, on-brand production.",
      "Anyone with raw audio or video who wants finished, publish-ready episodes.",
    ],
    examples: [
      "Audio editing", "Video editing", "Noise cleanup", "Intro/outro placement", "Music placement",
      "Show notes", "Transcripts", "YouTube uploads", "Podcast distribution", "Spotify & Apple setup",
      "Episode thumbnails", "Social clips", "Promotional graphics",
    ],
    deliverables: [
      "A clean, leveled edit of your episode (audio and/or video).",
      "Noise cleanup, intro/outro, and music placement.",
      "An episode thumbnail and promotional graphics.",
      "Show notes and a transcript.",
      "Social clips — count set by your tier.",
      "Publishing to your channels — YouTube, Spotify, Apple — where your package includes it.",
    ],
    provide: [
      "Your raw recording in an accepted format (WAV, MP3, MP4, MOV).",
      "Your intro/outro, music, and brand assets — or we place royalty-free.",
      "Access to your channels where we publish — shared through the vault.",
      "Approvals before an episode goes live.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to set your show's format, cadence, and the assets you need per episode." },
      { t: "Submit your recording", d: "Send the raw file in an accepted format; we confirm what we need." },
      { t: "Edit & produce", d: "We clean, level, and edit; place intro/outro and music; and build the thumbnail, show notes, transcript, and clips." },
      { t: "Approve", d: "You review the episode and assets before anything publishes." },
      { t: "Publish & promo", d: "We publish to your channels where your package includes it, and deliver the promo assets." },
    ],
    timeline: "Production runs on your show's cadence, with a set number of episodes and assets per month by tier. Standard editing covers episodes up to 90 minutes; longer episodes are quoted as a surcharge. Turnaround is agreed with your schedule so you publish on time.",
    revisions: "Revisions are handled per episode to get it right, with the number of rounds set by your package. Extensive re-edits beyond scope are quoted separately.",
    software: [
      "Professional audio and video editing tools.",
      "Noise-reduction and leveling tools.",
      "Design tools for thumbnails and promo graphics.",
      "Your channels — YouTube, Spotify, Apple Podcasts — for publishing, when included.",
    ],
    notIncluded: [
      "Recording talent, studio, and venue — those are yours (studio/venue billed at cost).",
      "Any guarantee of downloads, views, or rankings.",
      "Licensing for music you don't have rights to — we place royalty-free or your licensed tracks.",
    ],
    addOns: [
      "Episodes longer than 90 minutes (surcharge).",
      "Additional social clips or promo assets beyond your tier.",
      "Full season pipeline (up to 13 episodes).",
      "Publishing/distribution added to an edit-only package.",
    ],
    afterPurchase: "We set your show's format and cadence; you send the raw recording; and we edit, produce the assets, take your approval, and publish to your channels where your package includes it — on a steady schedule so the show doesn't stall.",
    faqs: [
      { q: "What's the maximum episode length?", a: "Standard editing covers episodes up to 90 minutes. Longer episodes are handled as a surcharge, quoted by length." },
      { q: "What files do I submit, and in what format?", a: "Send your raw recording as WAV, MP3, MP4, or MOV. We'll confirm exactly what we need for your show at the strategy session." },
      { q: "Do you publish the episodes, or just edit them?", a: "Both are available by package. Some packages are edit-only — we deliver publish-ready files and you upload — and others include publishing to your channels (YouTube, Spotify, Apple) once you grant access." },
      { q: "How many social clips do I get?", a: "Clip count is set by your tier or package rather than a single fixed number; we'll spell out your allotment at kickoff." },
      { q: "How many revisions are included?", a: "Revisions are handled per episode to get it right, with the number of rounds set by your package. Extensive re-edits beyond scope are quoted separately." },
      { q: "Do you provide the music?", a: "We place royalty-free music, or your own licensed tracks and intro/outro. We won't place music you don't have the rights to." },
    ],
  },
  digital: {
    headline: "App, Web & PWA Development",
    pain: "We build web and app products, from a single landing page to a phased application.",
    included: ["Landing pages and multi-page sites", "PWA MVP scoping and build", "Phased full app builds", "Hosting and deployment setup"],
    expect: ["A scoped project with phased milestones and previews before launch", "Tested across devices, links and forms verified", "Hosting live and credentials handed off to you", "Landing page from $650; site or PWA MVP from $2,500 standalone"],
    scope: "Hosting, domain, and app-store fees at cost. Large builds are scoped separately, from $6,000.",
    how: HOW,
    forWho: [
      "Businesses that need a professional web presence — from a single page to a full site.",
      "Founders validating an idea with a PWA MVP before a full build.",
      "Anyone who needs a site or app built, launched, and handed off cleanly.",
    ],
    examples: [
      "Landing pages", "Multi-page websites", "PWAs (installable web apps)", "Custom applications",
      "Forms", "Booking integrations", "Payment integrations", "E-commerce", "SEO setup",
      "Analytics setup", "Domain connection", "Hosting setup", "Client training",
    ],
    deliverables: [
      "A designed, mobile-responsive build — landing page, multi-page site, PWA, or app.",
      "Forms, booking, payment, or e-commerce integrations as scoped.",
      "SEO and analytics set up.",
      "Domain connected and hosting live.",
      "Testing across devices, with links, forms, and payments verified.",
      "Credentials, handoff, and a short training walkthrough.",
    ],
    provide: [
      "Your content and brand assets — or add copywriting to your package.",
      "Access to your domain, hosting, and any accounts to integrate — through the vault.",
      "Approvals at each milestone.",
      "Examples of sites you like, for direction.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to scope the right product — landing page, site, PWA, or app — and its features." },
      { t: "Plan & design", d: "We agree structure, pages, and integrations, and design the look for your approval." },
      { t: "Build", d: "We build in phases with previews at each milestone; revisions happen at those approvals." },
      { t: "Test & launch", d: "We test across devices, verify links, forms, and payments, connect your domain, and go live on your hosting." },
      { t: "Handoff & training", d: "We hand off credentials and give you a short walkthrough so you can run it." },
    ],
    timeline: "Timing depends on the product and its features — a landing page is quick; a multi-page site, PWA, or app is scoped in phases with previews at each milestone. Landing page from $650; site or PWA MVP from $2,500 standalone; larger builds from $6,000.",
    revisions: "Revisions happen at each milestone approval as we build, scaled to the size of the project — a landing page and a full app aren't the same. Extensive changes beyond the agreed scope are quoted separately.",
    software: [
      "Modern web platforms and frameworks suited to the project.",
      "Form, booking, payment, and e-commerce integrations.",
      "SEO and analytics tools.",
      "Your own hosting, domain, and accounts wherever possible.",
    ],
    notIncluded: [
      "Hosting, domain, and app-store fees — billed at cost, on your accounts.",
      "Ongoing content or campaigns — that's the Marketing service line.",
      "Guaranteed search rankings — we set SEO up correctly; ranking is earned over time.",
    ],
    addOns: [
      "Copywriting where your package doesn't include it.",
      "An ongoing maintenance and support plan.",
      "E-commerce, advanced integrations, or additional pages/features.",
      "A full custom application build (from $6,000).",
    ],
    afterPurchase: "We scope the right product and its features, design and build it in phases with previews at each milestone, test across devices, connect your domain and go live on your hosting, then hand off credentials with a short training walkthrough.",
    faqs: [
      { q: "What's the difference between a landing page, a website, a PWA, and an app?", a: "A landing page is a single focused page (one offer, one call to action). A multi-page website has several linked pages — home, services, about, contact. A PWA is an installable web app that works like a native app in the browser (offline-capable, add-to-home-screen). A custom application is bespoke software with logins, data, and workflows, built in phases. We scope the right one for your goal at the strategy session." },
      { q: "Who owns the site or app when it's done?", a: "For websites, you own the files and source once the project is paid in full. Custom applications can differ by contract — we spell out ownership up front so there are no surprises." },
      { q: "Is copywriting included?", a: "It depends on your package. Some include copywriting; on others you provide the words and we can write or polish them as an add-on." },
      { q: "Do you host and maintain it?", a: "Hosting runs on your own account and domain (fees at cost). Ongoing maintenance and support is available as an add-on plan; whether it's bundled depends on your package." },
      { q: "Is it mobile-responsive and accessible?", a: "Yes — every build is mobile-responsive and tested across devices, and we follow accessibility best practices (alt text, contrast, keyboard navigation) as part of the work." },
      { q: "Do you set up payments, booking, or e-commerce?", a: "Yes, as scoped — forms, booking, payment integrations, and e-commerce are all available. Processor and platform fees are the provider's and billed to you directly." },
      { q: "How many revisions do I get?", a: "Revisions happen at each milestone approval, scaled to the size of the project. Extensive changes beyond the agreed scope are quoted separately." },
      { q: "What about SEO and analytics?", a: "We set up on-page SEO and analytics as part of the build. We can't guarantee rankings — those are earned over time — but the foundation is done right." },
    ],
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
    forWho: [
      "Businesses drowning in repetitive manual steps that eat hours every week.",
      "Teams whose process lives in one person's head and breaks when they're out.",
      "Owners who want AI and automation set up safely, on their own tools.",
    ],
    examples: [
      "Workflow mapping", "SOP creation", "Automation setup", "AI workflow setup", "Dashboards",
      "Trackers", "Staff training", "Documentation", "Integration support",
    ],
    deliverables: [
      "A map of the workflow, then the automation built and tested on your tools.",
      "Documented SOPs your team can run from.",
      "Dashboards and trackers for visibility.",
      "AI workflows set up with guardrails, plus a prompt library.",
      "Your team trained on the new systems.",
      "Integration support to connect the tools you already use.",
    ],
    provide: [
      "Access to the tools and accounts we'll automate — through the vault.",
      "A walkthrough of the process as it works today.",
      "Decisions on the rules and guardrails you want.",
      "Approvals before a workflow goes live.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to find the repetitive work worth automating and the biggest time sinks." },
      { t: "Map the workflow", d: "We document how the process works today, step by step, and design the improved flow." },
      { t: "Build & test", d: "We set up the automation and dashboards on your tools and test with your real inputs." },
      { t: "Document & train", d: "We write the SOPs, document AI guardrails, and train your team to run it." },
      { t: "Support", d: "We provide integration support and adjust the workflow as your needs change." },
    ],
    timeline: "Timing depends on the workflow's complexity and the tools involved; your tier sets how many system builds are included. We map, build, test on your real inputs, and hand over documentation your team can run from.",
    revisions: "We build and test with your real inputs and refine until the workflow runs cleanly; substantial new scope is quoted separately.",
    software: [
      "Automation platforms (e.g. Zapier, Make) and your existing tools.",
      "CRMs, project-management, and form tools.",
      "AI tools set up with documented guardrails and a prompt library.",
      "Dashboard and tracker tools.",
    ],
    notIncluded: [
      "Third-party software subscriptions — billed at cost, on your accounts.",
      "Replacing licensed professional judgment (legal, accounting) with automation.",
      "Guaranteed outcomes from AI — we set guardrails; you stay in control.",
    ],
    addOns: [
      "Additional workflow or system builds beyond your tier.",
      "Ongoing optimization and support.",
      "Deeper custom integrations.",
    ],
    afterPurchase: "We map the process, build and test the automation and dashboards on your tools, document the SOPs and AI guardrails, and train your team — so the repetitive work runs itself and the knowledge doesn't live in one person's head.",
    faqs: [
      { q: "What kinds of things can you automate?", a: "Common examples: a lead form that creates a CRM record, assigns a follow-up task, and drafts an email; employee paperwork that updates a tracker and notifies a manager; onboarding that spins up a project folder and tasks; or a paid invoice that triggers an onboarding email and sets up a client portal. If it's repetitive and rule-based, it's a candidate." },
      { q: "Do you build on my tools, or yours?", a: "On your tools and accounts wherever possible, so you own the workflows. We connect the platforms you already use and hand over documentation to run them." },
      { q: "How does the AI setup work — and is it safe?", a: "We set up AI workflows for your repetitive tasks with documented guardrails and a prompt library, and we train your team. AI assists; your team stays in control, and we don't hand decisions to a black box." },
      { q: "Will you document everything?", a: "Yes. You get written SOPs and process maps your team can run from, plus training — so the system survives turnover and doesn't live in one person's head." },
      { q: "What if my process changes later?", a: "We provide integration support and can adjust the workflow as your needs evolve; additional builds beyond your tier are quoted separately." },
    ],
  },
  events: {
    headline: "Event Planning, in person",
    pain: "We plan and run in-person events — launches, workshops, and gatherings.",
    included: ["Event plan and budget outline", "Run-of-show and timeline", "Vendor coordination and materials", "On-site coordination at higher tiers"],
    expect: ["One event per term at Foundation, quarterly at Momentum, quarterly with on-site coordination at Enterprise", "A run-of-show approved before the date", "Vendors confirmed and materials ready", "Post-event wrap and follow-up"],
    scope: "In-person only. Venue, catering, and hard costs are billed at cost.",
    how: HOW,
    forWho: [
      "Businesses hosting a launch, workshop, conference, or private event without an events team.",
      "Owners who need the logistics handled so they can be present at their own event.",
      "Anyone who wants a coordinated event without juggling every vendor themselves.",
    ],
    examples: [
      "Venue sourcing", "Vendor sourcing", "Catering coordination", "Registration & ticketing",
      "Speakers & entertainment", "Decor", "Sponsors", "Guest management", "Run-of-show", "Rehearsals",
      "Day-of coordination", "Corporate events", "Conferences", "Workshops", "Launches", "Private events",
    ],
    deliverables: [
      "An event plan and budget outline.",
      "A run-of-show and timeline, approved before the date.",
      "Sourced and coordinated vendors, with materials ready.",
      "Registration, ticketing, and guest management as scoped.",
      "On-site day-of coordination at higher tiers.",
      "A post-event wrap and follow-up.",
    ],
    provide: [
      "Your goals, budget, date, and any must-have vendors.",
      "Vendor contracts and payments — you hold those; we coordinate.",
      "Approvals on the plan and run-of-show.",
      "Access to any tools for registration or guest lists.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to understand the event, goals, budget, and date." },
      { t: "Plan & budget", d: "We build the event plan, budget outline, and vendor list for your approval." },
      { t: "Coordinate", d: "We source and coordinate vendors, set up registration, and manage the guest list." },
      { t: "Run-of-show", d: "We build and approve the run-of-show and timeline before the date, and run rehearsals where needed." },
      { t: "Event & wrap", d: "On-site day-of coordination at higher tiers, then a post-event wrap and follow-up." },
    ],
    timeline: "Lead time depends on the event's size and complexity; we scope it per event with milestones toward the date. One event per term at Foundation, quarterly at Momentum, quarterly with on-site coordination at Enterprise.",
    revisions: "The plan and run-of-show are reviewed and approved before the date, and adjusted with you as the event takes shape.",
    software: [
      "Registration, ticketing, and guest-list tools.",
      "Budget and run-of-show trackers.",
      "Your own accounts and vendor tools wherever possible.",
    ],
    notIncluded: [
      "Vendor contracts, payments, and hard costs (venue, catering, rentals) — billed at cost, held by you; we coordinate.",
      "Licensed services (e.g. security, alcohol service) beyond coordinating the right vendors.",
      "Guaranteed vendor availability or weather.",
    ],
    addOns: [
      "On-site day-of coordination (included at higher tiers).",
      "Travel to your event where needed — travel and lodging quoted per event.",
      "Additional events beyond your tier.",
    ],
    afterPurchase: "We scope the event, build the plan, budget, and vendor list, coordinate everyone, and approve the run-of-show before the date — with on-site day-of coordination at higher tiers and a wrap-up afterward.",
    faqs: [
      { q: "How much of the event do you handle?", a: "It depends on your package and tier. At a minimum we plan, budget, build the run-of-show, and coordinate vendors and guests. Fuller service — deeper vendor management and on-site day-of coordination — comes at higher tiers. You always hold the vendor contracts and payments; we coordinate them." },
      { q: "Do you run the event on-site, day-of?", a: "On-site day-of coordination is a higher-tier inclusion. Planning, vendor coordination, and the run-of-show are handled at every level." },
      { q: "Do you travel for events?", a: "It depends on the event. Where travel is needed, travel and lodging are quoted per event and billed at cost." },
      { q: "Is there an event-size limit?", a: "No fixed limit — we scope and price each event by its size and complexity. Bring the details to the strategy session and we'll map it." },
      { q: "Do you pay the vendors?", a: "No. You hold the vendor contracts and make the payments; hard costs like venue and catering are billed at cost. We source, coordinate, and keep everyone on the run-of-show." },
      { q: "What types of events do you plan?", a: "Corporate events, conferences, workshops, launches, and private events, among others — bring yours and we'll scope it." },
    ],
  },
  ag: {
    headline: "Agriculture & Land",
    pain: "Regenerative land planning and operational support for landowners and working ag operations.",
    included: ["Land and regenerative plan framework", "Stewardship calendar", "Record-keeping templates", "Operations coordination"],
    expect: ["A set number of planning deliverables by tier", "A plan specific to your land and goals", "A seasonal stewardship calendar", "Templates your operation can actually keep up"],
    scope: "Specialized surveying, legal, or agronomy work is referred out as needed.",
    how: HOW,
    forWho: [
      "Landowners and working ag operations that need their records and planning organized.",
      "Farms pursuing programs, cost-share, or stewardship goals without an office team.",
      "Operations that want a regenerative plan and calendar they can actually keep up.",
    ],
    examples: [
      "Land records", "Farm documentation", "Stewardship planning", "Regenerative agriculture planning",
      "Production calendars", "Vendor coordination", "Lease documentation", "Cost-share paperwork",
      "Program documentation", "Operations coordination", "Agritourism business support",
    ],
    deliverables: [
      "Organized land and farm records and documentation.",
      "A regenerative and stewardship plan framework tailored to your land and goals.",
      "A seasonal stewardship and production calendar.",
      "Record-keeping templates your operation can keep up.",
      "Program, cost-share, and lease documentation prepared.",
      "Operations and vendor coordination.",
    ],
    provide: [
      "Your land details, goals, and any existing records or plans.",
      "Program or lease documents you're working with.",
      "Decisions and approvals as we build the plan.",
      "Access to accounts/tools where we coordinate — through the vault.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to understand your land, operation, and goals." },
      { t: "Organize & document", d: "We organize your records and prepare the documentation your operation needs." },
      { t: "Plan & calendar", d: "We build a regenerative/stewardship plan framework and a seasonal calendar for your approval." },
      { t: "Paperwork & coordination", d: "We prepare program, cost-share, and lease documentation and coordinate operations and vendors." },
      { t: "Keep it current", d: "Ongoing support and templates so the plan and records stay up to date." },
    ],
    timeline: "Planning and documentation are scoped by tier and by your operation's needs; the stewardship calendar follows your seasons. We agree deliverables and dates up front.",
    revisions: "Plans and documents are reviewed and adjusted with you until they fit your land and goals.",
    software: [
      "Record-keeping and documentation templates.",
      "Calendar and tracker tools for stewardship and production.",
      "Your own program/agency portals where we prepare paperwork.",
    ],
    notIncluded: [
      "Licensed agronomy, soil science, or crop-consulting services.",
      "Engineering, land surveying, or environmental assessment.",
      "Legal services or legal advice on leases, easements, or programs.",
      "Veterinary services.",
      "Any regulated professional service HCC is not licensed to provide — specialized work is referred out.",
    ],
    addOns: [
      "Additional planning deliverables beyond your tier.",
      "Agritourism business support.",
      "Ongoing operations coordination.",
    ],
    afterPurchase: "We organize your records, build a regenerative/stewardship plan framework and seasonal calendar tailored to your land, prepare the program and lease paperwork, and coordinate operations — with any specialized surveying, legal, or agronomy work referred out to a licensed professional.",
    faqs: [
      { q: "What exactly do you help with?", a: "Land and farm records, documentation, a regenerative and stewardship plan framework, a seasonal stewardship/production calendar, record-keeping templates, program and cost-share paperwork, lease documentation, and operations coordination — plus agritourism business support where relevant." },
      { q: "Is your planning the same as agronomy or a soil scientist?", a: "No. We provide regenerative and stewardship planning support at an advisory level and organize the documentation around it. Licensed agronomy, soil science, engineering, surveying, environmental, and legal work are outside our scope and are referred to the right licensed professional." },
      { q: "Can you handle my cost-share or program paperwork?", a: "Yes — we prepare program, cost-share, and lease documentation and help keep it organized. Where a program requires a licensed professional's input, we coordinate that referral." },
      { q: "Do you give legal advice on leases or easements?", a: "No. We prepare and organize lease and program documentation, but legal advice and review are your attorney's role; we flag anything that needs it." },
      { q: "What do you not do?", a: "We don't provide licensed agronomy, engineering, land surveying, environmental assessment, veterinary, or legal services. When your project needs one of those, we help you find and coordinate the right licensed professional." },
    ],
  },
  grants: {
    headline: "Grants & Nonprofit Administration",
    pain: "We take nonprofits from grant research through application and submission, on the funder’s deadlines.",
    included: ["Grant research reports and prospect lists", "Application preparation and submission", "Budget and narrative development", "Compliance checklists"],
    expect: ["A set number of applications per quarter by tier", "Eligibility confirmed before work begins", "Narrative, budget and attachments complete against the guidelines", "Submission confirmed when you authorize it"],
    scope: "No guarantee of award — we research, prepare, and submit. Volumes are set by tier.",
    how: HOW,
    forWho: [
      "Nonprofits and mission-driven organizations chasing funding without a grants team.",
      "Small teams that need grants researched, matched, and written on deadline.",
      "Anyone who needs a strong application prepared and submitted the right way.",
    ],
    examples: [
      "Grant research", "Prospect lists", "Eligibility checks", "Fit ranking", "Budget development",
      "Narrative development", "Attachment preparation", "Application submission", "Compliance checklists",
    ],
    deliverables: [
      "A ranked shortlist of matched opportunities — each with eligibility, funding amount, deadline, application link, a fit ranking, and a recommendation.",
      "A complete application: narrative, budget, and attachments built against the guidelines.",
      "A compliance checklist for each application.",
      "Submission on your behalf when you authorize it, with confirmation.",
    ],
    provide: [
      "Your organization's details, mission, and financials.",
      "Program information and any letters or attachments the funder requires.",
      "Portal access where we submit on your behalf — through the vault.",
      "Approvals before anything is submitted.",
    ],
    process: [
      { t: "Strategy session", d: "A free 30-minute call to understand your mission, programs, and funding goals." },
      { t: "Research & match", d: "We research and rank a shortlist of fitting opportunities with eligibility, amounts, deadlines, links, and recommendations." },
      { t: "Confirm eligibility", d: "We confirm you're eligible before any application work begins." },
      { t: "Prepare the application", d: "We develop the narrative and budget and assemble attachments against the funder's guidelines, with your approval." },
      { t: "Submit", d: "We submit on your behalf when you authorize it and confirm receipt." },
    ],
    timeline: "Everything runs on the funder's deadlines. Your tier sets how many applications per quarter are included; we scope research and preparation around each deadline.",
    revisions: "Applications are reviewed and refined with you against the funder's guidelines before submission.",
    software: [
      "Grant databases and research tools.",
      "Budget and narrative templates.",
      "Funder portals for submission, when you authorize it.",
    ],
    notIncluded: [
      "Any guarantee of an award — we research, prepare, and submit; the funder decides.",
      "Post-award grant management and ongoing funder reporting.",
      "Audited financials or legal/accounting services — those are your professionals' role.",
    ],
    addOns: [
      "Additional applications beyond your tier.",
      "Deeper research or larger prospect lists.",
      "Program or capability documentation to strengthen applications.",
    ],
    afterPurchase: "We research and rank matched opportunities, confirm your eligibility, develop the narrative, budget, and attachments against the guidelines, and submit on your behalf when you authorize it — all on the funder's deadlines.",
    faqs: [
      { q: "Can you guarantee we'll win funding?", a: "No. No one can honestly guarantee a grant award. We research the best-fit opportunities, confirm eligibility, and prepare and submit a strong, compliant application — but the funder makes the decision." },
      { q: "What does the grant research include?", a: "A ranked shortlist of matched opportunities, each with eligibility requirements, funding amount, deadline, the application link, a fit ranking, and our recommendation — so you can decide where to focus." },
      { q: "Do you write the application, or just find grants?", a: "Both. Beyond research, we develop the narrative and budget, assemble the attachments against the funder's guidelines, and — when you authorize it — submit on your behalf and confirm receipt." },
      { q: "Do you submit the application for us?", a: "Yes, when you authorize it. We submit through the funder's portal using access you provide securely, and confirm submission. If you'd rather file it yourself, we hand you a complete, submission-ready package." },
      { q: "Do you manage grants or handle reporting after we win?", a: "Post-award grant management and ongoing funder reporting aren't part of this service. We focus on research, preparation, and submission." },
      { q: "What do we need to provide?", a: "Your organization's details, mission, and financials, program information, and any funder-required letters or attachments — plus approvals before we submit." },
    ],
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
