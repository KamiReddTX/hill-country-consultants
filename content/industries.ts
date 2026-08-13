/**
 * Six industries — verbatim from the prototype. Each maps to a starter bundle
 * (fixed items + quote requests) and the service lines most relevant to it.
 */
import type { ServiceKey } from "@/content/services";

export interface Industry {
  slug: string;
  name: string;
  img: string;
  blurb: string;
  pain: string;
  start: string;
  cart: string[];   // BOOK_ITEMS ids
  quotes: string[]; // QUOTE_ITEMS ids
  services: ServiceKey[];
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "construction-and-contractors",
    name: "Construction & Contractors",
    img: "Drop photo — steel framing against sky",
    blurb: "Submittals, compliance files, bid paperwork and the daily admin that keeps a jobsite moving — prepared to standard, on your letterhead.",
    pain: "Rejected submittals cost a week you did not have, certifications lapse quietly, and the person who knows the process is on a jobsite.",
    start: "One submittal package and 10 VA hours, with a quote on your compliance library.",
    cart: ["sub-pkg", "va-block"], quotes: ["q-doc"],
    services: ["submittals", "compliance", "pm", "va", "systems", "trainingSvc"],
  },
  {
    slug: "authors-and-personal-brands",
    name: "Authors & Personal Brands",
    img: "Drop photo — stacked books and page proofs",
    blurb: "From manuscript to launch, plus the brand, media and events that carry a book after release.",
    pain: "The manuscript is finished and there is no team to edit, format, publish, or launch it.",
    start: "Quotes on editorial and full book production, plus launch media assets.",
    cart: ["media-asset"], quotes: ["q-edit", "q-book"],
    services: ["publishing", "media", "marketing", "brand", "events", "digital"],
  },
  {
    slug: "food-and-hospitality",
    name: "Food & Hospitality",
    img: "Drop photo — empty dining room, morning light",
    blurb: "The back office behind a food business — systems, documentation, marketing and team training.",
    pain: "Menus, staffing and programs run on instinct, and nothing is written down when someone leaves.",
    start: "Marketing graphics to stay visible, plus a quote on systems and SOPs.",
    cart: ["graphic"], quotes: ["q-systems"],
    services: ["systems", "marketing", "brand", "va", "trainingSvc", "events"],
  },
  {
    slug: "small-and-mid-size-business",
    name: "Small & Mid-Size Business",
    img: "Drop photo — storefront facade detail",
    blurb: "The whole back office — admin, coordination, documentation, brand and digital — for one flat monthly fee.",
    pain: "The owner is the admin, the marketer and the bookkeeper, and the work that grows the business waits.",
    start: "10 VA hours to get your time back, plus a quote on systems that hold.",
    cart: ["va-block"], quotes: ["q-systems"],
    services: ["va", "pm", "systems", "compliance", "marketing", "brand", "digital"],
  },
  {
    slug: "nonprofits-and-mission-driven",
    name: "Nonprofits & Mission-Driven",
    img: "Drop photo — community hall interior",
    blurb: "Grant research through submission and reporting, with the documentation and events that keep you fundable.",
    pain: "Fundable grants go unclaimed, compliance files are thin, and reporting lands on whoever has time.",
    start: "A grant research report, plus a quote on your first application.",
    cart: ["grant-research"], quotes: ["q-grant-app"],
    services: ["grants", "compliance", "va", "events", "marketing", "trainingSvc"],
  },
  {
    slug: "landowners-and-agriculture",
    name: "Landowners & Agriculture",
    img: "Drop photo — fenceline across open pasture",
    blurb: "Regenerative planning, stewardship records and the program paperwork a working property needs.",
    pain: "The land is working but nothing is documented, and program deadlines pass unnoticed.",
    start: "A grant research report, plus a quote on land planning.",
    cart: ["grant-research"], quotes: ["q-ag"],
    services: ["ag", "grants", "compliance", "va", "systems", "pm"],
  },
];

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
