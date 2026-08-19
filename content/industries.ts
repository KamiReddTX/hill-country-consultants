/**
 * Six industries — full landing pages. Each preloads a set of services on /book
 * (fixed BOOK_ITEMS + scoped QUOTE_ITEMS). No photos of people.
 */

export interface Industry {
  slug: string;
  name: string;
  img: string;        // placeholder label / image direction (becomes alt when a photo is added)
  headline: string;   // the outcome for that trade
  problem: string;    // one paragraph naming what actually goes wrong
  handles: string[];  // what we handle
  deliverables: string[]; // concrete things a client walks away with
  samples: string[];  // portfolio placeholder labels (redacted work shown as ImageSlots)
  faqs: { q: string; a: string }[];
  related: string[];  // other industry slugs to cross-link
  cart: string[];     // BOOK_ITEMS ids to preload on /book
  quotes: string[];   // QUOTE_ITEMS ids to preload on /book
}

/** Fallback boundary. Per-industry lines below take precedence. */
export const INDUSTRY_SCOPE_ENDS =
  "We prepare — we do not certify or stamp engineering. Legal wording is flagged to your attorney and never altered by us. We are not a substitute for licensed bookkeeping, legal, or tax services.";

/** "Where our scope ends" — tailored to each industry's real boundary. */
export const INDUSTRY_SCOPE_BY_SLUG: Record<string, string> = {
  construction: "We prepare — we do not certify or stamp engineering. Your general contractor or contractor of record reviews and signs.",
  authors: "We prepare, format and coordinate — we do not act as your literary agent or guarantee sales or placement. Contract and rights language is flagged to your attorney and never altered by us.",
  food: "We prepare and track — we do not issue permits or provide licensed food-safety certification. Legal wording is flagged to your attorney and never altered by us.",
  smb: "We are not a substitute for licensed bookkeeping, legal, or tax services. Legal wording is flagged to your attorney and never altered by us.",
  nonprofits: "We research, prepare and submit — no grant award is guaranteed, and we are not your auditor. Legal wording is flagged to your attorney and never altered by us.",
  agriculture: "We prepare records and frameworks — we do not provide licensed surveying or agronomy; specialized work is referred out. Legal wording is flagged to your attorney and never altered by us.",
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "construction",
    name: "Construction & Contractors",
    img: "Steel framing against sky",
    headline: "The paperwork that decides whether you get to build.",
    problem:
      "A rejected submittal costs a week you did not have. The product data is in five places, the spec section says something the cut sheet does not, and the transmittal goes out late because the person who knows the process is on a jobsite.",
    handles: [
      "Submittal packages to spec",
      "Cut sheets marked and indexed",
      "Compliance checklists and prequalification packages",
      "Certification and insurance tracking",
      "Transmittals, logs and ball-in-court",
      "Resubmittal turnaround",
    ],
    deliverables: [
      "A spec-matched submittal package, indexed and ready to transmit",
      "Marked OEM cut sheets with selections and options called out",
      "A prequalification package assembled to the GC's checklist",
      "A live certification & insurance tracker with renewal dates",
      "A submittal log with ball-in-court and status per item",
    ],
    samples: ["Submittal cover sheet", "Marked cut sheet", "Compliance checklist", "Transmittal & log"],
    faqs: [
      { q: "How fast can you turn a submittal around?", a: "Standard packages run on the timeline set in your written scope; when you need it sooner, our rush option compresses that — priced before we start." },
      { q: "Do you stamp or certify engineering?", a: "No. We prepare and organize the package to spec; your contractor of record or engineer reviews and signs. We never alter engineered or legal content." },
      { q: "Can you match our GC's specific submittal format?", a: "Yes. We build to the spec section and the GC's checklist, using your letterhead and naming conventions." },
    ],
    related: ["smb", "agriculture"],
    cart: ["sub-pkg", "sub-week", "rush"],
    quotes: [],
  },
  {
    slug: "authors",
    name: "Authors & Personal Brands",
    img: "Stacked books and page proofs",
    headline: "Get the book finished, published, and selling.",
    problem:
      "The manuscript is done, or close, and the next steps are a maze — editorial, formatting, distribution, launch assets, the platform decisions nobody explains. Most manuscripts stall here rather than at the writing. Publishing runs under Redd Ladys Chronicles, our publishing imprint and a registered publisher in the Library of Congress Preassigned Control Number (PCN) Program.",
    handles: [
      "Editorial at the stage you are at",
      "Interior and eBook formatting",
      "Cover and distribution coordination",
      "Launch assets and media kit",
      "Podcast and media production",
      "The posting calendar around release",
    ],
    deliverables: [
      "A print-ready interior and a reflowable eBook file",
      "A cover concept coordinated through to distribution",
      "A launch kit: graphics, media one-sheet, and posting calendar",
      "Podcast or audiogram assets to promote the release",
      "An ISBN/registration path coordinated under Redd Ladys Chronicles",
    ],
    samples: ["Book cover concept", "Interior spread", "Launch graphic set", "Media one-sheet"],
    faqs: [
      { q: "Do I keep my rights and royalties?", a: "Yes. You own your work. Redd Ladys Chronicles is a publishing vendor that helps you produce and distribute — rights and contract terms are yours, and we flag any legal language to your attorney." },
      { q: "Can you help if my manuscript isn't finished?", a: "Yes — we meet you at your stage, whether that's developmental editing, line editing, or final formatting." },
      { q: "Do you guarantee sales?", a: "No one honestly can. We produce professional assets and coordinate distribution and launch; the results depend on many factors beyond production." },
    ],
    related: ["smb", "nonprofits"],
    cart: ["podcast", "media-asset", "graphic"],
    quotes: ["q-edit", "q-ebook", "q-book"],
  },
  {
    slug: "food",
    name: "Food & Hospitality",
    img: "Empty dining room, morning light",
    headline: "Run the business behind the kitchen.",
    problem:
      "Permits lapse, vendor paperwork piles up, and the marketing happens whenever somebody remembers. The food is the easy part; everything around it is what takes the hours.",
    handles: [
      "Permit and certification tracking",
      "Vendor and supplier documentation",
      "SOPs and training documents",
      "Menu and promotional graphics",
      "Event and catering coordination",
      "The posting calendar",
    ],
    deliverables: [
      "A permit & certification tracker with renewal reminders",
      "Organized vendor and supplier documentation",
      "SOPs and staff training documents on your letterhead",
      "Menu and promotional graphics in your brand",
      "A posting calendar you can hand to any staff member",
    ],
    samples: ["Menu design", "Promo graphic", "SOP document", "Event run-of-show"],
    faqs: [
      { q: "Do you issue food permits or certifications?", a: "No. We prepare and track the paperwork and deadlines; the issuing authority certifies. We keep you ahead of renewals so nothing lapses." },
      { q: "Can you handle our social media too?", a: "We build the posting calendar and the graphics; ongoing posting can be part of a plan or a standalone scope." },
      { q: "We run events and catering — can you coordinate those?", a: "Yes. Event and catering coordination, run-of-show, and vendor docs are all in scope." },
    ],
    related: ["smb", "authors"],
    cart: ["graphic", "brand-starter", "va-block"],
    quotes: ["q-doc", "q-event"],
  },
  {
    slug: "smb",
    name: "Small & Mid-Size Business",
    img: "Storefront facade detail",
    headline: "A whole back office for one monthly fee.",
    problem:
      "One person is doing the invoicing, the scheduling, the follow-up and the filing, and none of it is anybody's actual job. The work that grows the business waits until the administrative work is done, and it never is.",
    handles: [
      "Daily admin and inbox management",
      "Document production and templates",
      "Process documentation",
      "Marketing and brand assets",
      "Project coordination",
      "File architecture that survives turnover",
    ],
    deliverables: [
      "Daily admin and inbox coverage against your allotment",
      "A template library for the documents you send most",
      "Process documentation so the work survives turnover",
      "Marketing and brand assets in one consistent look",
      "A file architecture with naming conventions that hold",
    ],
    samples: ["Capability statement", "Template set", "Process SOP", "Brand asset sheet"],
    faqs: [
      { q: "Can I start with just one thing?", a: "Yes. You can book a standalone project paid in full at booking, or start a monthly plan for ongoing coverage. Larger custom work is scoped and quoted in writing first." },
      { q: "How do you handle our logins securely?", a: "Credentials are collected through a password manager, never kept in plain text, and returned at offboarding." },
      { q: "What if I need more than my plan allotment?", a: "Anything beyond your allotment is quoted in writing before it's done — no surprise invoices." },
    ],
    related: ["construction", "food"],
    cart: ["va-block"],
    quotes: ["q-doc"],
  },
  {
    slug: "nonprofits",
    name: "Nonprofits & Mission-Driven",
    img: "Community hall interior",
    headline: "Stay fundable and stay compliant.",
    problem:
      "Grant deadlines arrive faster than the reporting gets done, and the documentation a funder asks for lives in four people's inboxes.",
    handles: [
      "Grant research and prospect lists",
      "Application preparation and submission",
      "Funder reporting and compliance files",
      "Board and donor documents",
      "Program documentation",
      "Event coordination",
    ],
    deliverables: [
      "A researched grant prospect list matched to your mission",
      "Prepared applications assembled to each funder's checklist",
      "A funder reporting & compliance file, audit-ready",
      "Board and donor documents on your letterhead",
      "Program documentation that outlives staff turnover",
    ],
    samples: ["Grant prospect report", "Application narrative", "Program budget", "Board packet"],
    faqs: [
      { q: "Can you guarantee we'll win the grant?", a: "No. We research, prepare and submit strong, compliant applications; award decisions rest with the funder." },
      { q: "Do you handle reporting after we win?", a: "Post-award funder reporting is available, but it isn't automatically part of a standalone grant application. It's a separate service, and it may be included when your plan or a custom scope specifically states it — so nothing gets missed, but you always know exactly what's covered." },
      { q: "Are you our auditor?", a: "No. We prepare and organize documentation; we are not a substitute for a licensed auditor." },
    ],
    related: ["smb", "authors"],
    cart: ["grant-research"],
    quotes: ["q-grant-app"],
  },
  {
    slug: "agriculture",
    name: "Landowners & Agriculture",
    img: "Fenceline across open pasture",
    headline: "Records, programs and plans for working land.",
    problem:
      "Program paperwork, lease documents and stewardship records are scattered across a truck console, a filing cabinet and somebody's memory.",
    handles: [
      "Regenerative plan frameworks",
      "Seasonal stewardship calendars",
      "Record-keeping templates",
      "Program and cost-share paperwork",
      "Lease and vendor documentation",
      "Operations coordination",
    ],
    deliverables: [
      "A regenerative plan framework tailored to your land",
      "A seasonal stewardship calendar you can work from",
      "Record-keeping templates for the program you're enrolled in",
      "Assembled program and cost-share paperwork",
      "Organized lease and vendor documentation",
    ],
    samples: ["Stewardship calendar", "Land records template", "Regenerative plan", "Cost-share packet"],
    faqs: [
      { q: "Do you do surveying or agronomy?", a: "No — those are licensed specialties. We prepare records and frameworks and refer specialized work out to the right professionals." },
      { q: "Can you help with cost-share and program paperwork?", a: "Yes. We assemble and track program and cost-share documentation so deadlines don't slip." },
      { q: "I have records everywhere — where do we start?", a: "We build the file architecture and templates first, then bring your existing records into one organized place." },
    ],
    related: ["construction", "smb"],
    cart: [],
    quotes: ["q-ag"],
  },
];

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
