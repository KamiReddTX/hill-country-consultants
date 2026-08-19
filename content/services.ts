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
    pain: "The manuscript is done, or close, and the next steps are a maze. We take a manuscript from draft to launch under Redd Ladys Chronicles, our publishing vendor registered with the Library of Congress.",
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
