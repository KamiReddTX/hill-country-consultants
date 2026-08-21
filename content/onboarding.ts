/** Standard onboarding checklist auto-seeded onto every new client. Both the
 *  paid-booking path (Stripe webhook) and the manual add-client path seed this,
 *  so a client's portal + the staff Checklists tab are populated from minute one.
 *  Sections/labels are the "welcome sequence" of guided first-30-day steps. */

export const ONBOARDING_CHECKLIST: { section: string; items: string[] }[] = [
  {
    section: "Kickoff · Week 1",
    items: [
      "Schedule your kickoff call",
      "Confirm your main point of contact",
      "Review your plan scope and monthly hour allotment",
    ],
  },
  {
    section: "Access & credentials",
    items: [
      "Add your logins securely to your credential vault",
      "Grant access to the tools we'll manage (email, socials, drives, etc.)",
      "Complete any intake forms we send",
    ],
  },
  {
    section: "First deliverables · First 30 days",
    items: [
      "Agree on your first-30-day priorities",
      "Review and approve the initial task list on your board",
    ],
  },
  {
    section: "Ongoing cadence",
    items: [
      "Look for your weekly report every Friday",
      "Book your 30-day review",
    ],
  },
];
