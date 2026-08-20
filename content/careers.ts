/** Open roles at Hill Country Consultants. Each job's `body` is markdown that
 *  renders on its /careers/[slug] page. Only the public posting lives here —
 *  never internal notes. Add a new object to JOBS to post another role. */

export type Job = {
  slug: string;
  title: string;
  type: string;       // e.g. "Contracted · Part-time"
  location: string;
  tagline: string;
  pay: string;        // short comp line for the card
  summary: string;    // one-paragraph blurb for the listing card
  open: boolean;      // show in the list
  body: string;       // markdown posting (public only)
};

const ENGAGEMENT_SPECIALIST = `## The role in one line

You find business owners who are drowning in paperwork, put them under contract with the right plan — and then you're the one who does the work. You sell it, you deliver it, you keep the client.

## About Hill Country Consultants

**The capability of a full staff. Without the payroll.**

One flat monthly fee puts a whole firm behind a business — admin, documentation, compliance, coordination, marketing, publishing and more. On site when it matters, virtual when it counts.

Four pillars sit behind every engagement: **Documentation, Compliance, Coordination, and Systems.** Underneath them run fourteen service lines, from construction submittals to grant applications to full app builds.

**Six industries served:** Construction & Contractors · Authors & Personal Brands · Food & Hospitality · Small & Mid-Size Business · Nonprofits & Mission-Driven · Landowners & Agriculture

## This is a dual role. Read this part carefully.

Most firms split these jobs. Someone sells, someone else delivers, and the client finds out in week three that what was promised isn't what's happening.

We don't do that. **You sell the contract and you service the account.** The business owner who signs with you sees your face again on Monday.

That means two things, and both are true:

**It makes you better at selling.** You will never oversell, because you'd be overselling to yourself. You'll learn fast what twenty-four submittals a month actually feels like, and your recommendations get sharper because of it.

**It means this is genuinely two jobs.** Sales-heavy while your book is small, delivery-heavy as it grows. If you want a role where you close and walk away, this isn't it.

## Side A · Bringing clients in

**You sell two ways, and knowing which one fits is most of the job.**

**Monthly plans** — three tiers. Every service line is available in all three; the tier sets how much of each a client gets, not which ones they're allowed to use.

**Standalone scopes** — à la carte work, priced per project and published on every service page. Quoted in writing before anything begins.

Current rates for both live on our website and in the employee portal. You'll know them cold, and you'll quote from the rate reference rather than from memory.

### The industries you'll work in

| Industry | What's usually breaking |
|---|---|
| **Construction & Contractors** | Submittals, closeout documents, prequalification packages, certifications and insurance expiring unnoticed |
| **Authors & Personal Brands** | A manuscript that's been "almost done" for two years, no platform, no launch plan |
| **Food & Hospitality** | Vendor paperwork, licensing and health documentation, scheduling chaos, no systems behind the counter |
| **Small & Mid-Size Business** | The owner is the admin department, and everything runs out of their inbox and their head |
| **Nonprofits & Mission-Driven** | Grant applications and funder reporting nobody has time to assemble, compliance files scattered |
| **Landowners & Agriculture** | Land documentation, program paperwork, lease and permit tracking, recordkeeping for a business run outdoors |

**What you'll do**

- **Find the conversation.** Referrals, local business networks, trade associations, job sites, chambers, events, warm follow-up on inbound leads.
- **Book the free 30-minute strategy session.** The front door for everything. It's genuinely free and you never have to pretend otherwise.
- **Run discovery.** A real conversation, not a pitch. Eleven to fourteen questions across the business. You listen more than you talk and you leave knowing three or four real problems.
- **Recommend.** Plan tier or standalone scope, matched to what you heard — not to what pays you most.
- **Run the math.** One hire gets one skill set at $5,500–$7,500/month once you count salary, benefits, PTO, equipment, software and management. For the same money or less, they get the whole firm.
- **Handle objections honestly.** Acknowledge, explore, respond, confirm. Never skip explore.
- **Ask for the business.** Clearly, once, in a sentence — then stop talking.
- **Read the terms back.** Word-accurate, every time — term length, payment schedule, deposit, accepted payment methods, and our refund policy.
- **Know our website cold.** Every plan, every service line, and every à-la-carte rate is published at hillcountryconsultants.com.

## Side B · Taking care of them

Once the contract is signed, you are the firm to that client. Depending on the account and the industry, that looks like:

**Documentation** — prepare, format and proof business documents; assemble construction submittal packages; build and maintain document templates; support grant applications and funder reporting; prepare manuscripts and publishing files for authors.

**Compliance** — track licenses, permits, insurance certificates, registrations and renewal dates; maintain compliance calendars and warn clients *before* a deadline; organize records so an audit isn't a fire drill; keep certification and vendor documentation current.

**Coordination** — inbox and calendar management; scheduling meetings, inspections, deliveries and travel; vendor and subcontractor follow-up; meeting notes and chasing action items until they're done; project tracking against milestones.

**Systems** — CRM setup, data entry and ongoing hygiene; build and maintain client workflows, checklists and shared file structures; AI workflow setup and training for client teams; maintain the client's shared credential vault and file organization.

**Client-facing rhythm — non-negotiable on every account**

- Daily work log, reconciled against the client's hour allotment
- Weekly report delivered every Friday
- Shared task board kept current, so a client never has to ask what's happening
- Onboarding tracker and 30-day roadmap executed in the first month

## What you own vs. what you don't

| You own | You have no authority over |
|---|---|
| The conversation | Pricing. **Zero exceptions, at any level.** |
| The plan or scope recommendation | Discounts, comps, or "throwing anything in" |
| Discovery accuracy | Specific turnaround dates on a sales call |
| The terms readback | Scope. If it isn't published, it isn't sold. |
| Delivery on your accounts | Work outside the client's contracted allotment |
| Every hour logged honestly | Anything not quoted in writing first |

## Who we're hiring

**No sales experience required.** We train from zero. What we can't train:

- You can hold a real conversation with a stranger and stay in it when it gets uncomfortable
- You listen more than you talk, and can sit in a silence without filling it
- **You are organized enough to run several client accounts at once without dropping one.**
- You write clearly and correctly — documents you prepare go to architects, funders, lenders and inspectors
- You are accurate under pressure — you'd rather confirm than guess
- You can be told no repeatedly and come back the next day
- Comfortable with Google Workspace or Microsoft 365, and quick on new software
- **Able to learn and navigate our website and employee portal independently.**
- Reliable transportation, valid driver's license, reliable internet, and a private space for client calls
- Comfortable working from your phone — the staff portal is built mobile-first

**Helps, doesn't gate:** you've worked inside construction, food service, agriculture, publishing, media or a nonprofit. Prior admin, executive assistant, office manager or coordinator experience transfers directly to delivery.

## How you get certified

You don't start selling on day one, and you don't start on a client account on day one either.

**Phase 1 — Foundation.** What we sell, what it costs, what the terms are, and which industries buy which services. Plus our delivery standards — the work log, the weekly report, the task board, the vault.

**Website & employee portal orientation.** Guided walkthrough of the site — every service page, every published rate, the plans comparison, and the booking flow — followed by full orientation on the employee portal.

**Phase 2 — Two-day intensive, eight modules, three gates.** Product (closed book on services, tiers, rates, terms), Discovery (scored live role-play), and Close (full role-play through signature and terms readback).

**Phase 3 — Supervised ramp.** Your first three contracts are reviewed before they reach the client; your first thirty days of delivery are reviewed weekly. Full authority after three clean contracts and one clean delivery month.

**Phase 4 — Ongoing.** Twenty minutes of live role-play and one recorded call reviewed weekly; monthly overpromise drill and closed-book price check; quarterly delivery-quality review.

## Hours

Mon & Fri 9–5 · Tue & Thu 11–7 · Wed & Sun closed · Sat by appointment. Central time.

**Baseline four paid hours per day.** Selling and client work both come out of that budget, so those hours have to be planned. Some accounts require more, and additional hours are approved in advance, account by account.

## Compensation

**Contracted, part-time. Baseline four paid hours per day, with additional approved hours available on accounts that require them.**

- **$10.00 per hour** base — sales activity, client work, and approved additional hours alike
- **15%** of the initial package or plan sale
- **5%** of every recurring payment after that, for as long as the client keeps paying
- **10%** on à-la-carte and standalone services

**Base pay review at $14,000+ in collected package and plan sales.** Once your plan and package sales reach that threshold, your base rate is reviewed and may be increased up to **$17.00 per hour**, based on delivery quality and retention. À-la-carte and standalone sales earn commission but do not count toward this threshold.

### What a plan is worth to you

| Plan | 15% initial | 5% monthly | First 12 months |
|---|---|---|---|
| Foundation · $1,500/mo | $225 | $75 × 11 | **$1,050** |
| Momentum · $4,250/mo | $637.50 | $212.50 × 11 | **$2,975** |
| Enterprise · $7,000/mo | $1,050 | $350 × 11 | **$4,900** |

The residual is the point. One client who stays is worth more than four who sign and leave — and since you're the one servicing them, keeping them is largely in your hands.

Commission is paid on collected funds, not on signature. Full terms are stated in your contract.

## To apply

Use the application below. Tell us about a time you had to explain something complicated to someone who didn't want to hear it — there's a place for it in the form.`;

export const JOBS: Job[] = [
  {
    slug: "engagement-specialist",
    title: "Engagement Specialist",
    type: "Contracted · Part-time",
    location: "Longview, TX · Atlanta, GA · Hybrid · Nationwide",
    tagline: "Clarity. Strategy. Organized Growth.",
    pay: "$10/hr base + 15% initial · 5% recurring · 10% à-la-carte",
    summary:
      "Find business owners drowning in paperwork, put them under contract with the right plan — then be the one who does the work. You sell it, deliver it, and keep the client. No sales experience required; we train from zero.",
    open: true,
    body: ENGAGEMENT_SPECIALIST,
  },
];

export const jobBySlug = (slug: string): Job | undefined => JOBS.find((j) => j.slug === slug);
export const openJobs = () => JOBS.filter((j) => j.open);
