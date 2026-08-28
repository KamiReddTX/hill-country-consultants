/**
 * Site-wide constants: identity, contact, navigation, business hours.
 * Verbatim from the prototype. Copy rules: the firm is HYBRID (never
 * "remote-first"); AI is something sold, never how work is delivered;
 * no personal names, testimonials, clients, logos, awards, or stats.
 */

export const SITE = {
  name: "Hill Country Consultants",
  tagline: "Clarity. Strategy. Organized Growth.",
  since: "Serving businesses since 2024",
  email: "info@hillcountryconsultants.com",
  phone: "470-478-1590",
  phoneHref: "tel:+14704781590",
  locations: "Longview, Texas and Atlanta, Georgia",
  serving: "serving clients nationwide",
  publishingImprint: "Redd Ladys Chronicles",
  kickoffUrl: "https://calendar.app.google/mk7fbVrrCJKY1uge9",
  reviewUrl: "https://calendar.app.google/6qv6gbPeiTbW3UTH8",
  consultUrl: "https://calendar.app.google/5bFgNbAkDbjy8gu79",
  // Photographer's scheduling link for marketing photo-shoot consultations.
  // Paste the real Calendly/Google Appointments URL here (leave "" to disable).
  photographerUrl: "",
} as const;

/** Primary header navigation (matches the prototype's top nav). */
export const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Our Work" },
  { href: "/industries", label: "Industries" },
  { href: "/training", label: "Training" },
  { href: "/about", label: "About" },
  { href: "/preferred-vendors", label: "Preferred Vendors" },
  { href: "/careers", label: "Careers" },
  { href: "/faq", label: "FAQ" },
];

/** Footer link columns. */
export const FOOTER_NAV: { href: string; label: string }[] = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Our Work" },
  { href: "/industries", label: "Industries" },
  { href: "/plans", label: "Plans & Pricing" },
  { href: "/book", label: "Book & Pay" },
  { href: "/training", label: "Training" },
  { href: "/about", label: "About" },
  { href: "/preferred-vendors", label: "Preferred Vendors" },
  { href: "/faq", label: "FAQ" },
  { href: "/careers", label: "Careers" },
  { href: "/get-started", label: "Get Started" },
];

export const LEGAL_NAV: { href: string; label: string }[] = [
  { href: "/policies", label: "Policies & Procedures" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund & Cancellation" },
  { href: "/privacy", label: "Privacy Policy" },
];

/** Business hours — all times Eastern. Drives the booking calendar. */
export const HOURS: { d: string; h: string }[] = [
  { d: "Monday", h: "9:00 AM – 5:00 PM" },
  { d: "Tuesday", h: "11:00 AM – 7:00 PM" },
  { d: "Wednesday", h: "Closed" },
  { d: "Thursday", h: "11:00 AM – 7:00 PM" },
  { d: "Friday", h: "9:00 AM – 5:00 PM" },
  { d: "Saturday", h: "by preapproved appointment" },
  { d: "Sunday", h: "Closed" },
];

export const HOURS_SHORT: { d: string; h: string }[] = [
  { d: "Mon & Fri", h: "9:00 AM–5:00 PM" },
  { d: "Tue & Thu", h: "11:00 AM–7:00 PM" },
  { d: "Wed & Sun", h: "Closed" },
  { d: "Saturday", h: "by preapproved appointment" },
];

/** Home — "How it works" steps (verbatim). */
export const HOME_STEPS: { n: string; d: string }[] = [
  { n: "01", d: "Free 30-minute strategy session." },
  { n: "02", d: "Proposal and contract in writing." },
  { n: "03", d: "Onboarding in week one — kickoff call, 30-day roadmap, secure credential handoff, shared task board." },
  { n: "04", d: "Delivery against your allotments, every deliverable quality-reviewed before delivery." },
  { n: "05", d: "Scheduled reviews on your tier cadence." },
];

/** Trust points used across the site (verbatim). */
export const TRUST_POINTS: { t: string; d: string }[] = [
  { t: "Serving businesses since 2024", d: "Longview, Texas and Atlanta, Georgia, working with clients nationwide." },
  { t: "Answered the same business day", d: "Requests are acknowledged the same business day and actioned in agreed priority." },
  { t: "Reviewed before it reaches you", d: "Every deliverable passes a pre-delivery review, on your brand, verified for accuracy." },
  { t: "Priced in writing, first", d: "Scope and price are agreed in writing before work begins. Anything beyond scope is quoted before it is done." },
  { t: "Credentials handled securely", d: "Logins are collected through a password manager, never kept in plain text, and returned at offboarding." },
];

/** Home — the four pillars behind every engagement (verbatim). */
export const PILLARS: { t: string; d: string }[] = [
  { t: "Documentation", d: "Submittals, SOPs, manuals, proposals and capability statements, produced to a defined standard and delivered on your letterhead." },
  { t: "Compliance", d: "Certification and permit application support, insurance tracking, compliance documentation and audit-ready files. The paperwork that keeps you eligible to work." },
  { t: "Coordination", d: "Logs, transmittals, ball-in-court tracking and deadlines. We will handle the follow-through for you, in writing." },
  { t: "Systems", d: "File architecture, naming conventions, templates and intake forms. Structure that holds after we hand it back." },
];

/** Home — what a client gets in their portal the day they sign (verbatim). */
export const PORTAL_FEATURES: { t: string; d: string }[] = [
  { t: "Onboarding tracker", d: "Week one, step by step: kickoff call, roadmap, credentials, task board, file structure, marked done as it happens." },
  { t: "Your 30-day roadmap", d: "What we deliver, in what order, by what date, and what we need from you to accomplish each task." },
  { t: "Shared task board", d: "Requested, in progress, in review, delivered. Add a request yourself and we confirm the same business day." },
  { t: "Weekly report", d: "Every Friday: what we delivered, the hours it took, what is in flight, and what is next." },
  { t: "Work log", d: "Daily entries with hours by service line, reconciled against your allotment at every review." },
  { t: "Shared vault", d: "The record of every login we hold, editable by you, so work never stops on a changed password." },
];
