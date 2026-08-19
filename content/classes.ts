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

export interface ClassDetail { objectives: string[]; modules: string[] }

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

/** Per-class learning objectives and module outline. */
export const CLASS_DETAIL: Record<string, ClassDetail> = {
  "operations-and-systems": {
    objectives: ["Map your core processes end to end", "Turn a map into a written SOP the team can run", "Set a weekly coordination cadence and clean hand-offs"],
    modules: ["Finding the process that lives in one head", "Mapping it end to end", "Writing the SOP", "Compliance & records checklist", "Rolling it out to the team"],
  },
  "winning-work": {
    objectives: ["Present the company so it wins work on paper", "Run the submittal process without avoidable rejections", "Build reusable capability and submittal tools"],
    modules: ["Capabilities statement that wins bids", "Certification & compliance basics", "The submittal process, start to finish", "Marking a datasheet to standard", "Your reusable submittal checklist"],
  },
  "brand-story-and-market-presence": {
    objectives: ["Define a consistent brand voice", "Turn one idea into a month of content", "Build a content plan that carries your expertise"],
    modules: ["Brand & voice fundamentals", "Repurposing one idea into five assets", "Building a 30-day content calendar", "A content plan you can sustain"],
  },
  "ai-to-do-the-work": {
    objectives: ["Identify the repetitive work worth automating", "Stand up working automations with guardrails", "Keep a human in the loop with quality controls"],
    modules: ["Auditing your repetitive work", "Building two to three automations", "A reusable prompt library", "Review & quality guardrails", "Rolling it out to the department"],
  },
  "business-foundations-and-growth": {
    objectives: ["Put core structure and documentation in order", "Adopt a simple planning framework", "Leave with a growth roadmap"],
    modules: ["The business-systems checklist", "Core structure & documentation", "A simple planning framework", "Building your growth roadmap"],
  },
  "grants-and-nonprofit-readiness": {
    objectives: ["Adopt a repeatable grant research method", "Outline a fundable application", "Get audit- and reporting-ready"],
    modules: ["A repeatable grant research method", "Outlining an application", "Compliance & reporting checklist", "An audit-ready operating baseline"],
  },
  "regenerative-agriculture-and-land": {
    objectives: ["Build a regenerative plan outline around your goals", "Set a seasonal stewardship calendar", "Know what to keep and what to refer out"],
    modules: ["A regenerative plan outline", "Your seasonal stewardship calendar", "Record-keeping templates", "What to refer to a licensed professional"],
  },
  "food-nutrition-and-wellness": {
    objectives: ["Apply menu/program design fundamentals", "Outline a practical workplace wellness program", "Protect margin with a best-practice checklist"],
    modules: ["Menu / program design fundamentals", "A workplace wellness outline", "A food-business best-practice checklist"],
  },
};

/** Shared facts that apply to every class. */
export const TRAINING_INFO = {
  delivery: "Every class is delivered on-site or live-virtual — you choose. The content is the same either way; on-site adds the hands-on build lab in the room.",
  travel: "On-site travel and lodging are quoted per booking based on your location.",
  certificate: "Each participant receives a certificate of completion. (This is a certificate of completion, not a professional certification.)",
  materials: "Every attendee gets a workbook and a resource pack, and each class includes a hands-on build lab that produces real deliverables your team keeps.",
  customization: "Classes are tailored to your team, tools, and industry — we adjust the examples, exercises, and build lab to your real work before the session.",
  postSupport: "You leave with the deliverables built in the room, plus follow-up materials; ongoing implementation support is available through our service lines.",
  instructor: "Taught by the HCC specialist who does this work day to day, so the examples and the build lab come from real engagements.",
};

export const TRAINING_FAQS: { q: string; a: string }[] = [
  { q: "Is the class on-site or virtual?", a: "Either — you choose. Every class runs on-site or live-virtual with the same content; on-site includes the hands-on build lab in the room." },
  { q: "Can you tailor it to our team and industry?", a: "Yes. We adjust the examples, exercises, and build lab to your tools, industry, and real work before the session." },
  { q: "Do participants get a certificate?", a: "Yes — a certificate of completion for each participant. It's a certificate of completion, not a professional certification." },
  { q: "What do participants receive?", a: "A workbook, a resource pack, and the deliverables built during the hands-on lab, which your team keeps." },
  { q: "How are travel costs handled for on-site training?", a: "On-site travel and lodging are quoted per booking based on your location." },
  { q: "How do we book — do we pay in full up front?", a: "You can request a training date or schedule a consultation to confirm scope and timing, or book and pay directly. Reach out and we'll set the right path for your team." },
];

/** A sample agenda scaled to class length. */
export function sampleAgenda(isFullDay: boolean): { t: string; d: string }[] {
  return isFullDay
    ? [
        { t: "Welcome & goals", d: "Frame the day and the deliverables we'll build." },
        { t: "Teach — part one", d: "Core concepts, grounded in your real work." },
        { t: "Build lab — part one", d: "Hands-on: start building your deliverables." },
        { t: "Lunch", d: "Break." },
        { t: "Teach — part two", d: "The rest of the method and the harder cases." },
        { t: "Build lab — part two", d: "Finish the deliverables with guidance." },
        { t: "Rollout & wrap", d: "A plan to take it back to the team." },
      ]
    : [
        { t: "Welcome & goals", d: "Frame the session and what we'll build." },
        { t: "Teach", d: "Core concepts, grounded in your real work." },
        { t: "Build lab", d: "Hands-on: build your deliverables with guidance." },
        { t: "Rollout & wrap", d: "A plan to take it back to the team." },
      ];
}
