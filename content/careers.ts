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
- **Based in the United States** — this role is open to U.S.-based applicants only
- **Your equipment:** a Windows computer with a **dual-monitor** setup, a **wired Ethernet** connection (not Wi-Fi only), and a **smartphone and/or tablet** that can run apps
- Comfortable working from your phone — the staff portal is built mobile-first

**Security & data protection — required of everyone**

- **Consent to a background check**, and legal authorization to work in the United States (18 or older)
- **A supported, auto-updating Windows** with current antivirus, full-disk encryption (BitLocker), a password login, and automatic screen-lock — on a computer not shared with anyone else
- **A secured home network** (WPA2/WPA3 Wi-Fi with the default router password changed); you never do client work over public or unsecured Wi-Fi
- **Two-factor authentication (2FA)** on every work account, and a password manager with strong, unique passwords
- **Confidentiality:** sign a confidentiality/NDA agreement, keep client data only in approved company tools (never personal email, cloud, or USB drives), keep your screen private and lock your computer when you step away, shred any printed client material, and return or delete all client data if you leave

**Helps, doesn't gate:** you've worked inside construction, food service, agriculture, publishing, media or a nonprofit. Prior admin, executive assistant, office manager or coordinator experience transfers directly to delivery.

## How you get certified

You don't start selling on day one, and you don't start on a client account on day one either.

**Phase 1 — Foundation.** What we sell, what it costs, what the terms are, and which industries buy which services. Plus our delivery standards — the work log, the weekly report, the task board, the vault.

**Website & employee portal orientation.** Guided walkthrough of the site — every service page, every published rate, the plans comparison, and the booking flow — followed by full orientation on the employee portal.

**Phase 2 — Two-day intensive, eight modules, three gates.** Product (closed book on services, tiers, rates, terms), Discovery (scored live role-play), and Close (full role-play through signature and terms readback).

**Phase 3 — Supervised ramp.** Your first three contracts are reviewed before they reach the client; your first thirty days of delivery are reviewed weekly. Full authority after three clean contracts and one clean delivery month.

**Phase 4 — Ongoing.** Twenty minutes of live role-play and one recorded call reviewed weekly; monthly overpromise drill and closed-book price check; quarterly delivery-quality review.

## Hours

A typical week runs Mon & Fri 9–5 · Tue & Thu 11–7 · Wed & Sun closed · Sat by appointment — set to your time zone and coordinated with your accounts. This is a fully remote role — you work from anywhere in the U.S. with reliable internet.

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

const BUSINESS_MANAGER = `## The role in one line

You run the firm day to day so the owner can build it — approving the work that goes out, holding the standard on what gets delivered, keeping clients with us, growing the accounts we already have, and making sure we never sell more than we can actually do.

## About Hill Country Consultants

**The capability of a full staff. Without the payroll.**

One flat monthly fee puts a whole firm behind a business — admin, documentation, compliance, coordination, marketing, publishing and more. On site when it matters, virtual when it counts.

Four pillars sit behind every engagement: **Documentation, Compliance, Coordination, and Systems**, across six industries: Construction & Contractors · Authors & Personal Brands · Food & Hospitality · Small & Mid-Size Business · Nonprofits & Mission-Driven · Landowners & Agriculture.

## Why this role exists

We're honest about where we are. Every proposal, every exception, every delivery handoff, every new specialist's first three contracts, every collections question and every capacity call currently lands on one desk. That works until it doesn't, and we're at the point where it doesn't.

**This is the firm's first management hire.** You're not inheriting a machine — you're helping assemble one that's still being built. You'll manage the staff, run the day, catch what's breaking, and bring the Administrator decisions that are ready to make instead of problems that aren't.

If you need a role where the systems already work and you maintain them, this isn't that. If you've ever looked at a growing business and thought *"I could organize this,"* it is exactly that.

## What you'll own

### 1 · The daily management meeting

**You host it, every business day.** It's the heartbeat of the firm — where the day gets set, blockers surface before they cost a client, and nobody works a whole day in the wrong direction.

- Set the agenda and run it on time, start and finish
- Confirm what each specialist is doing that day: sales activity, client deliverables, deadlines in play
- Surface blockers and resolve them in the room, or assign the resolution before it ends
- Review yesterday against commitments — what shipped, what didn't, why
- Flag capacity strain and approaching deadlines early
- Publish notes and action items to the team afterward, so decisions are documented and not just spoken

Running the same meeting well every day, especially on days when nothing seems to be happening, is a real skill. It's also the discipline this role is built on.

### 2 · Sales operations and quality control

- **Review every proposal before it goes up for approval.** Every exception request routes to you first. You're the filter between what a specialist wants to promise and what the firm can actually deliver — you work it up, mark what's wrong, and forward it with a recommendation. The Administrator releases it.
- **Review the first three contracts** for every new Engagement Specialist during their supervised ramp before they go for approval, with a debrief inside 48 hours — one behavior coached at a time.
- **Run weekly coaching:** twenty minutes of live role-play and one recorded call reviewed, per specialist, permanently.
- **Run the monthly drills:** the overpromise drill and the closed-book price check. Nobody quotes from memory, including you.
- **Maintain the rate reference** in the employee portal so it is never wrong. A stale rate sheet is how a specialist quotes a price we can't honor.

### 3 · Capacity and intake control

This may be the most consequential thing you do.

Sales can outrun delivery, and when it does the damage lands on clients who already paid us. You build and defend the monthly intake ceiling — how much new work the firm can accept, matched against the hours we actually have. You bring the number and the math to the Administrator, who sets it. Then you're the one who holds the line day to day, telling a specialist *not this month* when their commission depends on hearing yes. That takes spine.

- Track committed delivery hours against available hours, continuously
- Recommend the monthly intake ceiling, then enforce the approved number
- Flag when an account exceeds what one specialist can service, and route it
- Forecast when the next hire is needed — before the strain shows up in client work

### 4 · Delivery standards

- Review every **Delivery Handoff** within 24 hours of signature: what was sold, what was promised, first-30-day deadlines, kickoff date
- Audit **daily work logs** against client hour allotments — clients pay for hours and we account for every one
- Spot-check outbound deliverables for quality. Submittals go to architects. Grant applications go to funders. Compliance files go to inspectors. Our name is on all of it.
- Confirm the **Friday weekly report** goes out on every account, every week, without exception
- Own client escalations before they become cancellations

### 5 · Client retention

**This is the number you're paid on, and it's the number the firm lives on.** A client who stays two years is worth more than three who leave at month four — and far cheaper than replacing them. Keeping people happy is not a soft duty here. It's an owned outcome with your name on it.

**Know where every client stands, before they tell you**

- Own the renewal calendar. Every contract end date, tracked, with the conversation started well before it arrives — never in the final week.
- Watch the early warning signs: a client going quiet, unused hours piling up month after month, skipped check-ins, slower payments, a tone shift in email. Churn almost always announces itself before it happens.
- Review work logs and weekly reports for accounts that are *technically* fine but where nothing meaningful is getting done.

**Make the value visible**

- Clients don't renew because we worked hard. They renew because they can *see* what they got. Make sure they can.
- Run periodic account reviews: here's what we delivered, here's what it saved you, here's what's next.
- Make sure every client is actually using what they're paying for. A Momentum client using Foundation-level service is a cancellation waiting for a slow month — find the unused service lines in their tier and put them to work.
- Confirm onboarding lands right. The first 30 days set whether a client ever trusts us, and it's the cheapest place to prevent a loss.

**Handle the hard conversations**

- Own client escalations personally before they become cancellations
- Take the save conversation when a client signals they're leaving — find out what actually went wrong and, where we can fix it, fix it
- When a client does leave, find out why and write it down. A loss you don't understand is a loss you'll repeat.
- Track retention as a real number, reported quarterly

**Turn good relationships into growth**

- Ask satisfied clients for referrals and testimonials. Nobody sells this firm better than a client who's had a good year with us.
- Spot genuine expansion opportunities — a client who's outgrown their tier — and route them to the specialist. Never sell a client something that doesn't help them; that's the fastest way to lose the ones you have.

### 6 · Sales — about 10% of the role

You are not primarily a salesperson, but you do sell. Roughly four hours of a forty-hour week, and it comes from three places:

**Expansion on accounts you already know.** This is the natural one. You're the person who sees a client outgrowing their tier, or paying for a plan while their real problem sits in a service line they've never used. You already know the account better than anyone. Have the conversation.

**Referrals from happy clients.** Retention and referral are the same muscle. A client who's had a good year with us is our best source of the next one, and asking is your job.

**Coverage.** When a lead comes in and no specialist is free, or a prospect needs someone senior in the room, you take it. You'll be certified through the same three gates every specialist passes, so you can run a discovery call and close a contract properly.

**The rules that apply to everyone apply to you.**

- Zero pricing exceptions. You review other people's exception requests; your own go straight to the Administrator with no exceptions and no shortcuts.
- Every hard line in this document applies to your sales too
- You quote from the rate reference, not from memory
- Every deal you close gets a delivery handoff like anyone else's

**And one rule that applies only to you:** your own deals never move the intake ceiling. If the firm is at capacity, it's at capacity — including for work you sold. You will be the only person in a position to quietly bend that, which is exactly why it's written down.

### 7 · Money

- Invoicing, payment schedules, and the five-business-day grace period
- Collections follow-up — firmly, early, and without apology
- Calculate and verify commissions, residuals and any clawbacks, and submit them for release
- Track revenue against capacity so we know which service lines actually earn
- Expense tracking, vendor and contractor payments
- Coordinate with the firm's bookkeeper and CPA

### 8 · People

**Every employee in this firm reports to you.** You're their manager — the person they come to, and the person accountable for whether they succeed.

- Recruit, screen and interview Engagement Specialists, and bring finalists forward with a recommendation
- Run Phase 1 foundation training and administer the three certification gates
- Manage schedules, and submit additional-hour requests on accounts that need them
- Hold performance conversations — the encouraging ones and the hard ones. Corrective action goes up for approval before it's taken.
- Maintain personnel records and onboarding documentation
- Be reachable. A remote team with an unreachable manager isn't managed.

### 9 · Systems, build and design

We're a firm that sells documentation, systems and brand work. We're expected to look like it and run like it. You're the person who makes that true internally.

**Systems and process**

- Own the employee portal: lead intake, discovery notes, proposal requests, delivery handoff, rate reference, and resources
- Build the process documentation this firm still needs, so the next hire onboards from a document instead of a conversation
- Identify what's breaking, bring a fix with the reasoning attached, and implement it once approved

**Coding and technical build**

- Maintain and update the public website — pages, copy, service and rate changes, forms, links — working directly in the code where the builder won't do it
- Build and maintain the employee portal: pages, gated access, forms, and where each submission lands
- Connect our platforms to each other so information stops being retyped — forms into trackers, intake into the CRM, notifications where they're needed
- Read, modify and troubleshoot existing code rather than waiting on a developer for every small change
- Build internal tools when buying one doesn't make sense — trackers, calculators, dashboards
- Support the Systems & Automation service line, including AI workflow setup for client teams

**Graphic design**

- Design internal and client-facing materials: one-sheets, proposals, capability documents, reports, presentations
- Produce marketing and social graphics, and support brand work on client accounts
- Hold brand consistency across everything the firm puts out — colors, type, logo usage, layout. A proposal that looks thrown together undercuts a firm that sells organization.
- Build reusable templates so specialists produce on-brand work without designing from scratch every time

## Where this role sits

**The Administrator has authority over managers. You have authority over everyone else.**

> **Administrator** → **Business Manager** → **Engagement Specialists · all staff**

**You are the firm's line of authority over its people.** Every employee reports to you, takes direction from you, and answers to you. Specialists bring you their questions, their problems, and their exceptions — not to the Administrator. You assign the work, set the schedules, run the coaching, hold the standard, and handle it when someone isn't meeting it.

Nobody on this team goes around you, and you don't go around anybody. If a specialist has a concern about you, it goes to the Administrator — that's the one exception, and it's how it should work.

**You report to the Administrator, and the Administrator approves your decisions before they take effect.**

That distinction matters, so here it is plainly:

| You direct — no approval needed | The Administrator approves before it takes effect |
|---|---|
| Who does what work, and when | Anything that binds the firm to a client |
| Daily priorities and assignments | Every proposal, quote and exception |
| Schedules and coverage | Hires, terminations and corrective action |
| How a problem gets solved internally | Money going out — payroll, commissions, vendors |
| Coaching, feedback and standards | The monthly intake ceiling |
| Who runs which account | Pricing, policy and process changes |
| The daily meeting and its agenda | Your own sales proposals — never self-approved |

**In short: you run the people and the day. The Administrator approves anything that commits the firm's money, its clients, or its policy.**

**What that means in practice**

- Your job is to make approval fast. Bring complete work-ups with a clear recommendation and reasoning attached — not open questions, not raw problems.
- If it's a close call, say which way you'd go and why. A recommendation you're willing to defend beats a neutral summary every time.
- Nothing is said to a client, vendor, or applicant as settled until it's approved. *"Let me confirm that and come right back to you"* is a professional answer and you'll use it often.
- When something is genuinely urgent, escalate immediately rather than acting first and reporting after.

**This is real management authority inside a firm that keeps final approval at the top.** If you need to commit the company without checking, this isn't the seat. If you're strong at running people and handing over decisions that are ready to make, you'll do well here — and what you carry grows as the firm does.

## Who we're hiring

**Required**

- **A bachelor's degree**
- **Five or more years** managing operations, a team, or a book of client accounts
- You can hold several moving projects and several people in your head at once without dropping one
- You are comfortable telling someone no, including someone whose income depends on yes
- **You've actually managed people**, not just projects — assigned work, given hard feedback, and been the one accountable when someone underperformed
- **You can work inside an approval structure without stalling or resenting it.** You'll prepare a great deal you don't get the final say on, and you'll do it again the next day.
- **You can hold a client relationship.** You've kept accounts, handled unhappy customers, and turned a complaint into a longer relationship rather than an exit.
- **You can ask for business without flinching.** Not a career closer — but able to name a price, ask a client to expand, and request a referral without apologizing for it.
- Strong written communication — you'll write process documents, coaching notes, meeting summaries, and client escalation responses
- Numbers literacy: invoicing, commission math, hours against allotments, revenue against capacity
- A dedicated, quiet workspace, reliable high-speed internet, and a setup you can host a video meeting from every morning
- **Based in the United States.** This role is open to U.S.-based applicants only.
- **Your equipment.** A Windows computer with a **dual-monitor** setup, a **wired Ethernet** connection (not Wi-Fi only), and a **smartphone and/or tablet** that can run apps.

**Security & data protection — required of everyone, held to a higher bar for this seat**

- **Consent to a background check** — this role handles money and client accounts — and legal authorization to work in the United States (18 or older)
- **A supported, auto-updating Windows** with current antivirus, full-disk encryption (BitLocker), a password login, and automatic screen-lock — on a computer not shared with anyone else
- **A secured home network** (WPA2/WPA3 Wi-Fi with the default router password changed); you never do client work over public or unsecured Wi-Fi
- **Two-factor authentication (2FA)** on every work account, and a password manager with strong, unique passwords
- **Confidentiality:** sign a confidentiality/NDA agreement, keep client data only in approved company tools (never personal email, cloud, or USB drives), keep your screen private and lock your computer when you step away, shred any printed client material, and return or delete all client data if you leave

**Technology — this one is not negotiable**

You will live in software all day, across several platforms at once, and you'll be the person others come to when something won't work.

- **Strong general computer skills.** Comfortable troubleshooting your own problems before asking anyone.
- **Fluent in a full productivity suite** — Google Workspace or Microsoft 365: documents, spreadsheets, shared drives, calendars, video meetings.
- **Comfortable running several platforms simultaneously** — our employee portal, our website, a CRM, project and task tracking, video conferencing, e-signature, invoicing and payment tools, cloud storage, and a shared credential vault.
- **Quick to learn new software without hand-holding.** You'll be asked to evaluate and roll out tools, not just use the ones already here.
- **Spreadsheet capable.** Formulas, sorting, filtering, and building a simple tracker from scratch — the capacity model is a spreadsheet before it's anything else.
- Able to teach a tool to someone else once you've learned it, since you'll be onboarding every new specialist.

**Coding and programming — required**

- **Working knowledge of HTML, CSS and JavaScript.** You should be able to open a page, find what's wrong, fix it, and know you didn't break something else.
- Comfortable inside a website builder *and* in the underlying code when the builder won't do what's needed
- Understand how APIs, integrations and webhooks connect one platform to another — and able to set them up
- Experience with automation tools — Zapier, Make, or the equivalent
- Able to read documentation and work out an unfamiliar system without being walked through it
- Version control and basic debugging habits: change one thing, test it, keep a record of what you changed

You will not be building enterprise software. You will be the person who makes our website, our portals and our platforms work together — and who fixes it Tuesday morning instead of waiting a week for a contractor.

**Graphic design — required**

- **Fluent in a professional design tool** — Canva at minimum; Adobe Creative Suite or Figma preferred
- Able to design a clean, professional business document from a blank page: proposals, one-sheets, reports, decks
- Working understanding of layout, typography, color and hierarchy — enough to know *why* something looks unprofessional, not just that it does
- Can build and maintain brand templates others can use without breaking them
- Comfortable producing social and marketing graphics at the sizes each platform actually needs
- A portfolio or work samples. We'll ask.

**Strongly preferred**

- Experience in a service business where hours are sold and delivered — agency, consulting, staffing, professional services
- Account management, client success, or retention experience in a recurring-revenue business
- Any exposure to construction, food service, agriculture, publishing, media or nonprofit work
- You've built a process from nothing before, not just followed one
- Bookkeeping or light financial operations experience

**Work arrangement:** Remote — you work from anywhere in the U.S. with reliable internet. The daily management meeting runs by video, and everything you need — the employee portal, the rate reference, client files, the forms — is online and available to you wherever you are.

Remote does not mean loosely supervised or loosely supervising. You'll be the most visible person on this team: first on the call every morning, and the one specialists reach when something breaks. If you've worked remote before and know how to build presence without a hallway, that experience matters more here than it would in an office.

## What we can't train

- **Judgment.** Half this job is working out the right answer quickly with incomplete information — then making the case for it well enough that a decision can be made on the spot.
- **Follow-through.** A Friday report that goes out 47 weeks out of 52 is a broken system.
- **Directness delivered with respect.** You'll tell a specialist their proposal is wrong, a client their expectation isn't in the contract, and the owner that we're at capacity.
- **Reading a room you can't see.** Much of retention is noticing that a client who used to reply in an hour now takes three days, and picking up the phone about it before anyone asks you to.

## Your first 90 days

**Days 1–30 · Learn the machine.** Every service line, every rate, every term. Sit in on discovery calls. Read every active client file. Shadow delivery on real accounts. Meet every person on the team one on one. Ask why about everything — this is the only window where you get to.

**Days 31–60 · Take the controls.** Assume the daily management meeting as host. Take first-line proposal review and delivery handoff review. Build the capacity model and bring the first intake ceiling recommendation forward. Start weekly coaching.

**Certification runs alongside all of this.** You'll pass the same three gates every specialist does — Product, Discovery, and Close — before selling anything on your own.

**Days 61–90 · Fix something.** Identify the three worst operational bottlenecks and resolve at least one completely. Document two processes that currently live only in someone's head. Audit the website and portal, and build one template set specialists can actually use. Own collections end to end. Establish the renewal calendar and complete a first account review with every active client.

## How you'll be measured

| Area | What good looks like |
|---|---|
| **Delivery** | Weekly reports out on every account, every week. Work logs reconciled. Zero missed contract commitments. |
| **Quality** | Nothing reaches a client without approval. Work-ups complete enough to be decided on the first pass. Deliverables that don't come back. |
| **Capacity** | The firm never sells more than it can service, including work you sold. |
| **Retention** | Clients still with us at month twelve. Renewals started early, not in the final week. Every loss understood and written up. |
| **Money** | Receivables current. Commissions accurate and on time. |
| **Team** | Specialists certified, coached, and producing. Problems reaching you before they reach the Administrator. |
| **Sales** | Expansion and referral conversations happening on existing accounts — never at the expense of capacity discipline. |
| **Systems & brand** | Website and portals current and working. Everything the firm sends out looks like it came from the same firm. |
| **The daily meeting** | Held every business day, on time, with notes published. |
| **The Administrator's day** | Decisions arriving ready to make — complete, recommended, and not needing to be sent back for more. |

That last one is the real test. The Administrator will still approve everything in month six — that's the structure. What should change is *how much work approval takes*. If items come back for rework, or arrive without a recommendation, or surface as problems instead of decisions, the hire isn't landing.

## Compensation

**$40,000 per year, salaried.** Remote — work from anywhere in the U.S.

**Quarterly client-retention bonus — 5% of quarterly profits.** Retention is the number this role most directly controls, and the bonus is tied to it. Keep clients with us and you share in what the firm earns.

Schedule is set with the owner; the daily management meeting anchors every business morning.

## To apply

Use the application below. Tell us about a system or process you built from nothing — what was broken before, what you put in place, how you got it approved, and how you knew it worked.

**Please include work samples:** something you designed, and something you built or coded.`;

export const JOBS: Job[] = [
  {
    slug: "business-manager",
    title: "Business Manager",
    type: "Full-time · Salaried · Remote",
    location: "Remote · United States",
    tagline: "Clarity. Strategy. Organized Growth.",
    pay: "$40,000/yr salaried + 5% quarterly retention bonus",
    summary:
      "The firm's first management hire — run the firm day to day so the owner can build it. Approve the work that goes out, hold the delivery standard, keep and grow client accounts, manage the team, and defend the capacity line. Real management authority under an approval structure.",
    open: true,
    body: BUSINESS_MANAGER,
  },
  {
    slug: "engagement-specialist",
    title: "Engagement Specialist",
    type: "Contracted · Part-time · Remote",
    location: "Remote · United States",
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
