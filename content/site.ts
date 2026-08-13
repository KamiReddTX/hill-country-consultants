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
} as const;

/** Primary header navigation (matches the prototype's top nav). */
export const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/training", label: "Training" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

/** Footer link columns. */
export const FOOTER_NAV: { href: string; label: string }[] = [
  { href: "/services", label: "Services" },
  { href: "/plans", label: "Plans & Pricing" },
  { href: "/book", label: "Book & Pay" },
  { href: "/training", label: "Training" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/get-started", label: "Get Started" },
];

export const LEGAL_NAV: { href: string; label: string }[] = [
  { href: "/policies", label: "Policies & Procedures" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund & Cancellation" },
  { href: "/privacy", label: "Privacy Policy" },
];

/** Business hours — all times Central. Drives the booking calendar. */
export const HOURS: { d: string; h: string }[] = [
  { d: "Monday", h: "9:00 AM – 5:00 PM" },
  { d: "Tuesday", h: "11:00 AM – 7:00 PM" },
  { d: "Wednesday", h: "Closed" },
  { d: "Thursday", h: "11:00 AM – 7:00 PM" },
  { d: "Friday", h: "9:00 AM – 5:00 PM" },
  { d: "Saturday", h: "By preapproved appointment" },
  { d: "Sunday", h: "Closed" },
];

export const HOURS_SHORT: { d: string; h: string }[] = [
  { d: "Mon & Fri", h: "9:00 AM–5:00 PM" },
  { d: "Tue & Thu", h: "11:00 AM–7:00 PM" },
  { d: "Wed & Sun", h: "Closed" },
  { d: "Saturday", h: "By appointment" },
];

/** Home — "How it works" steps (verbatim). */
export const HOME_STEPS: { n: string; d: string }[] = [
  { n: "01", d: "Free 30-minute strategy session." },
  { n: "02", d: "Proposal and contract in writing." },
  { n: "03", d: "Onboarding in week one — kickoff call, 30-day roadmap, secure credential handoff, shared task board." },
  { n: "04", d: "Delivery against your allotments, every deliverable pre-ship reviewed." },
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
