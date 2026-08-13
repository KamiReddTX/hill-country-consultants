/**
 * Eight corporate training classes — verbatim from the prototype.
 * Booking a class adds the matching fixed item (class-half / class-full).
 */
export interface TrainingClass {
  slug: string;
  no: string;
  name: string;
  who: string;
  format: string; // carries the standalone price + duration
  why: string;
  leave: string[];
  bookItem: "class-half" | "class-full";
}

export const CLASSES: TrainingClass[] = [
  { slug: "operations-and-systems", no: "Class 01", name: "Operations & Systems That Run Without You", who: "owners, operations & admin teams", format: "Full day, 6h — $4,500", bookItem: "class-full",
    why: "The process lives in one person’s head, so nothing runs when they are out. This class gets it written down and running as a cadence.",
    leave: ["Your core processes mapped end to end", "One written SOP built from that map", "A compliance and records checklist that holds up", "A weekly coordination cadence and hand-off plan", "A rollout plan for the rest of the team"] },
  { slug: "winning-work", no: "Class 02", name: "Winning Work: Capabilities, Compliance & the Submittal Process", who: "contractors, subs & project teams", format: "Full day, 6h — $4,500", bookItem: "class-full",
    why: "Work gets won or lost on paper. This class covers how to present the company and move submittals through review without avoidable rejections.",
    leave: ["A drafted capabilities statement", "Certification and compliance basics for bidding", "The submittal process start to finish", "A marked-up sample datasheet to standard", "A reusable submittal checklist"] },
  { slug: "brand-story-and-market-presence", no: "Class 03", name: "Brand, Story & Market Presence", who: "founders, marketing & client-facing teams", format: "Half day, 4h — $3,000", bookItem: "class-half",
    why: "An inconsistent brand makes a capable company look small. This class defines the voice and builds a month of content in the room.",
    leave: ["A brand and voice kit", "One idea repurposed into five assets", "A 30-day content calendar", "A content plan that carries your expertise"] },
  { slug: "ai-to-do-the-work", no: "Class 04", name: "AI to Do the Work", who: "any team, any industry", format: "Half day, 4h — $3,000", bookItem: "class-half",
    why: "Your team is retyping the same drafts, data pulls, reports and follow-ups every week. This class hands that work to AI with guardrails and a human in the loop.",
    leave: ["An audit of your repetitive work", "Two to three working automations", "A reusable prompt library", "Review and quality guardrails", "A rollout plan for the department"] },
  { slug: "business-foundations-and-growth", no: "Class 05", name: "Business Foundations & Growth", who: "new & growing businesses", format: "Full day, 6h — $4,500", bookItem: "class-full",
    why: "Most businesses break at structure, not effort. This class puts the core documentation, systems and planning in place before growth exposes the gaps.",
    leave: ["A completed business-systems checklist", "Core structure and documentation in order", "A simple planning framework", "A growth roadmap"] },
  { slug: "grants-and-nonprofit-readiness", no: "Class 06", name: "Grants & Nonprofit Readiness", who: "nonprofits & mission-driven orgs", format: "Half day, 4h — $3,000", bookItem: "class-half",
    why: "Fundable grants go unclaimed because nobody has the time to find them or the templates to answer them well. This class fixes both.",
    leave: ["A repeatable grant research method", "An outlined application", "A compliance and reporting checklist", "An audit-ready operating baseline"] },
  { slug: "regenerative-agriculture-and-land", no: "Class 07", name: "Regenerative Agriculture & Land", who: "landowners, ag operations & producers", format: "Half day, 4h — $3,000", bookItem: "class-half",
    why: "Working land needs a plan and a paper trail. This class builds both around your goals and your season.",
    leave: ["A regenerative plan outline", "A seasonal stewardship calendar", "Record-keeping templates", "Notes on what to refer out"] },
  { slug: "food-nutrition-and-wellness", no: "Class 08", name: "Food, Nutrition & Wellness", who: "food, hospitality & workplace-wellness teams", format: "Half day, 4h — $3,000", bookItem: "class-half",
    why: "Menus and programs get built on instinct and then cost margin. This class gives the design fundamentals and a practical wellness program.",
    leave: ["A menu or program framework", "A workplace wellness outline", "A food-business best-practice checklist"] },
];

export const classBySlug = (slug: string) => CLASSES.find((c) => c.slug === slug);
