/**
 * Six industries — verbatim from the approved build. Each preloads a set of
 * services on /book (fixed BOOK_ITEMS + scoped QUOTE_ITEMS). No photos of people.
 */

export interface Industry {
  slug: string;
  name: string;
  img: string;        // placeholder label / image direction (becomes alt when a photo is added)
  headline: string;   // the outcome for that trade
  problem: string;    // one paragraph naming what actually goes wrong
  handles: string[];  // what we handle
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
    cart: ["sub-pkg", "sub-week", "rush"],
    quotes: [],
  },
  {
    slug: "authors",
    name: "Authors & Personal Brands",
    img: "Stacked books and page proofs",
    headline: "Get the book finished, published, and selling.",
    problem:
      "The manuscript is done, or close, and the next steps are a maze — editorial, formatting, distribution, launch assets, the platform decisions nobody explains. Most manuscripts stall here rather than at the writing. Publishing runs under Redd Ladys Chronicles, our publishing vendor registered with the Library of Congress.",
    handles: [
      "Editorial at the stage you are at",
      "Interior and eBook formatting",
      "Cover and distribution coordination",
      "Launch assets and media kit",
      "Podcast and media production",
      "The posting calendar around release",
    ],
    cart: ["podcast", "media-asset", "graphic"],
    quotes: [],
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
    cart: ["graphic", "brand-starter"],
    quotes: [],
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
    cart: [],
    quotes: ["q-ag"],
  },
];

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
