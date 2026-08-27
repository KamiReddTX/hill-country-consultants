/** Open roles at Hill Country Consultants. Each job's `body` is markdown that
 *  renders on its /careers/[slug] page. Only the public posting lives here —
 *  never internal notes. Bodies are the authoritative uploaded JD text (2026-08).
 *  Add a new object to JOBS to post another role. */

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

const ENGAGEMENT_SPECIALIST = `# Engagement Specialist
**Hill Country Consultants · Remote / Hybrid — United States · Part-time**

*Clarity. Strategy. Organized Growth.*

---

## About us

Hill Country Consultants gives small and mid-size businesses the capability of a full staff without the payroll. For one flat monthly fee, we handle the administrative work that quietly eats a business alive: documentation, compliance, coordination, and the systems that hold it all together.

We serve six industries — construction and contractors, authors and personal brands, food and hospitality, small and mid-size business, nonprofits, and landowners and agriculture. We've been working with businesses nationwide since 2024.

---

## The role

**You bring the client in. Then you're the one who takes care of them.**

Most firms split those two jobs. Someone sells, someone else delivers, and the client finds out in week three that what was promised isn't what's happening. We don't work that way. The business owner who signs with you sees your face again on Monday.

**About 75% client work, about 25% sales.** The majority of your week is taking care of the accounts you hold. The rest is bringing in new ones — and you won't start from a blank page. You'll be given a local leads sheet to work from on day one.

It's an unusual structure, and it's the reason people stay in this seat. You're never selling something you'll have to hand off and hope goes well. And you're never handed an account you had no part in shaping.

---

## What you'll do

**Bringing clients in · about 25%**

- Work the local leads sheet you're given, and build your pipeline from there
- Meet business owners through referrals, professional networks, trade associations, chambers and industry events
- Follow up on inbound inquiries
- Run free 30-minute strategy sessions
- Ask good questions and listen — you'll leave every conversation knowing what that business actually struggles with
- Recommend the right level of service based on what you heard
- Walk clients through terms accurately and close the agreement

**Taking care of them · about 75%**

Once the agreement is signed, you're the firm to that client:

- **Assemble construction submittal packages** — manufacturer cut sheets, submittal index, marked project data, Bates numbering, transmittals, compliance checklists and RFIs, all on the client's letterhead. Construction is our largest industry and this is our most technical service; you'll be trained on it and it will be a real part of your week.
- Prepare, format and proof business documents, reports, forms and packages
- Track licenses, permits, insurance certificates and renewal deadlines — and give clients warning before a deadline, not after
- Manage inboxes and calendars; handle scheduling, travel and appointment coordination
- Follow up with vendors, subcontractors and stakeholders until things actually get done
- Set up and maintain CRM records, files and organized systems
- Track projects against milestones and deadlines
- Support social media scheduling, email campaigns and light graphics on some accounts
- Send each client a weekly summary of what was done, and keep a shared task board current so they never have to ask

Depending on the client, that work might be submittal packages for a contractor, grant applications for a nonprofit, compliance calendars for a restaurant, or manuscript preparation for an author. We'll train you on what your accounts need.

---

## What we're looking for

- **At least two years of sales experience.** Retainers, services, memberships, retail, insurance, real estate, recruiting, fundraising, event or ad sales — the product matters far less than whether you've sat in front of someone, asked for a decision, and handled being told no. Account management or client success where you carried a renewal or expansion number counts too.
- You can hold a real conversation with a stranger and stay in it when it gets uncomfortable
- You listen more than you talk
- **You're organized enough to run several client accounts at once without dropping one.** This is the part of the job that separates people.
- You write clearly and correctly — documents you prepare go to architects, funders, lenders and inspectors
- You'd rather say *"let me confirm that and get right back to you"* than guess
- You can hear no and come back the next day
- Comfortable with Google Workspace or Microsoft 365, and quick on new software
- Able to find your way around a website and an internal portal on your own
- Reliable high-speed internet and a quiet, private space you can take client calls from

**Helpful but not required:** experience in construction — submittals, bids, prequalification or project documentation is a strong advantage, since it's our largest industry. Also helpful: food service, agriculture, publishing, media or nonprofit work. Prior administrative, executive assistant, office manager or coordinator experience transfers directly.

---

## What we offer

- **Paid training.** A structured two-day program covering discovery, objection handling and closing the way we do it, plus our service standards. You bring the instinct; we give you the structure.
- **A real onboarding.** Your first weeks are supported and reviewed, with coaching after every client conversation. You won't be handed a phone list and left alone.
- **Ongoing coaching** — not a one-time orientation that's forgotten by month three.
- **Tools that work from your phone.** Everything you need is online and mobile-friendly.
- **Something worth selling.** Every client gets a 30-day roadmap, a shared task board, weekly reports and a running work log. Most firms your prospects have hired before couldn't tell them what happened last week. You can show them.

---

## Schedule

**You work your own time zone.** We serve clients nationwide and we staff across all U.S. time zones, so your hours run on local time wherever you are — not on somebody else's clock.

Firm hours are Monday & Friday 9–5 · Tuesday & Thursday 11–7 · Wednesday & Sunday closed · Saturday by appointment, applied in your zone. You'll be matched to clients where that schedule works for both of you.

Part-time: **four paid hours per day**, flexible within those windows. Additional approved hours are available on accounts that need them.



---

## Who you'll work with

You report to an **Accounts Manager**, who is your day-to-day support — they approve your work, coach you, and are the person you go to when something needs a decision. Accounts Managers report to our Business Manager, who reports to the Administrator.

It's a small firm. You'll know everyone.

---

## Equipment and security

Because we handle client data, every role meets the same baseline:

- **A Windows computer** with a **dual-monitor** setup
- A **wired Ethernet** connection — not Wi-Fi only
- A **smartphone and/or tablet** that can run apps
- Antivirus, and an updated, encrypted Windows installation
- Two-factor authentication on all work accounts
- A secured home network
- A signed confidentiality agreement
- Consent to a background check

---

## Compensation

**$10.00 per hour** base, for all hours — selling and client work alike.

**Commission on top of base:**
- **15%** of every initial sale
- **5%** of every recurring payment after that, for as long as that client stays with us
- **10%** on standalone and one-time services

**Base pay grows with results.** Your base rate is reviewed within your first 90 days and quarterly after that — and once you reach $14,000 in cumulative sales, it can increase up to **$17.00 per hour**.

The recurring commission is the point. A client who stays is worth far more than one who signs and leaves — and since you're the one doing their work, keeping them is largely in your hands. We're direct about this: the base is a floor, not the income. This role is built for someone who wants their effort to show up in their check.

---

## To apply

**info@hillcountryconsultants.com · 470-478-1590**

Tell us about a time you had to explain something complicated to someone who didn't want to hear it.

*Must be legally authorized to work in the United States and working from within the U.S.*

---

*Hill Country Consultants · info@hillcountryconsultants.com · 470-478-1590 · Serving businesses nationwide since 2024*`;

const CREATIVE_SPECIALIST = `# Creative Specialist
**Hill Country Consultants · Remote / Hybrid — United States · Part-time**

*Clarity. Strategy. Organized Growth.*

---

## About us

Hill Country Consultants gives small and mid-size businesses the capability of a full staff without the payroll. For one flat monthly fee, we handle the work that keeps a business running and looking like it means business — documentation, compliance, coordination, systems, brand and marketing.

We serve six industries — construction and contractors, authors and personal brands, food and hospitality, small and mid-size business, nonprofits, and landowners and agriculture. We've been working with businesses nationwide since 2024.

---

## The role

**You make the work. About a quarter of the time, you're also the one who brings it in.**

Our clients have a common problem: what they've built is better than what it looks like. A contractor who wins real work and submits a capability statement made in Word. A nonprofit doing serious work with materials that undercut it in front of funders. A restaurant with a great product and a different look on every menu, sign and post.

You fix that. Graphics, websites, apps, brand systems, print, video — if it's creative or it's built, it's yours.

**About 75% creative work, about 25% sales.** You were hired to design and build; that's most of your week. But you'll also sit with prospective clients, because the person who explains creative work best is the person who does it — and a client who meets you in the first conversation trusts the first draft more.

If you want a seat where a brief lands in your inbox and you never speak to the person it came from, this isn't it. If you'd rather understand a business before designing for it, it is.

---

## The creative work

**Brand and graphics**
- Brand systems — logo or wordmark, palette, typography, usage rules, and a guide a client's team can actually follow
- Social graphics, flyers, ad and email creative, sized correctly per platform
- Multi-asset campaigns and content calendars
- Business documents that have to look serious — capability statements, one-sheets, proposals, reports, decks
- Reusable templates so a client's team can produce on-brand work without you

**Web and app development**
- Design and build client websites — landing pages, multi-page sites, online stores
- **Build progressive web apps (PWAs) and custom app products** — devotional apps, guided journals, trackers, course delivery, client tools
- Scope a build with a client, wireframe it, build it, test it across devices, and deploy it
- Work on whatever platform a client is already on, or recommend the right one when they're starting fresh
- Responsive design that holds up on a phone, not just a desktop preview
- Forms, email capture and integrations that deliver where they're supposed to
- Basic SEO, image optimization and page speed
- Hosting, deployment and content integration
- Ongoing site and app maintenance — content changes, new pages, updates, seasonal work

**Print and production**
- Print-ready files to specification: bleed, trim, margins, color profile, resolution
- Publishing design where the account calls for it — covers, interiors, companion products
- Event and environmental collateral — signage, banners, programs
- Merchandise and promotional product design

**Media**
- Short-form video for social — cut, captioned, sized per platform
- Audiograms and clips pulled from longer recordings
- Motion graphics, animated assets and trailers
- Audio cleanup and leveling
- Show art, cover art and channel assets

Every piece is on the client's brand, not yours. Consistency is the product.

---

## The sales side

You're not a full-time salesperson, and we won't train you to sound like one. You're a creative professional who can sit with a business owner, understand what they're trying to build, and explain what it would take.

- Work the local leads sheet you're given, and build your pipeline from there
- Referrals, professional networks, trade associations, chambers and events
- Follow-up on inbound inquiries
- Growth on accounts you already serve — a client who trusts your work is the easiest next conversation you'll have
- Run free 30-minute strategy sessions
- Scope honestly. You know what the work takes, because you'll be doing it.

---

## What we're looking for

**Design**
- **A portfolio.** Real work, for real people, with the brief behind it. We'd rather see three projects you can explain than twenty you can't.
- Working command of layout, typography, color and hierarchy — enough to know *why* something isn't working, not just that it isn't
- Print production knowledge — bleed, trim, margins, CMYK vs. RGB, resolution, and what a printer will reject
- Able to design in a brand that isn't yours and keep your own taste out of it
- Organized with files, versions and handoffs

**Equipment — specific to this role**

You'll need **both a Windows laptop and a Mac laptop**, each meeting our full security baseline (see below). Clients work on both, files behave differently across them, and we test what we ship.

**Software**
- **Adobe Illustrator** — logos, wordmarks, vector work that scales from a business card to a banner
- **Adobe InDesign** — multi-page layout: proposals, reports, book interiors, print collateral
- **Adobe Photoshop** — image editing, retouching, prepping photography for print and web
- **Adobe Express** (formerly Adobe Spark) — fast-turn social and marketing assets
- **Canva** — many clients work in it, and you'll build so they can maintain what you hand over

**Video and audio**
- Short-form video editing — cuts, captions, titles, correct aspect ratios
- Motion graphics at a working level
- Audio cleanup, leveling and assembly
- Premiere Pro, After Effects, DaVinci Resolve, CapCut, Audition, Descript or equivalents. We care that you can cut a clean piece, not which tool you use.

**Web and app development**
- **Wix**, **WordPress** and **Shopify** — storefront and site design, theme customization, page structure, and the settings that break things
- Squarespace, Webflow or Framer are a plus
- **HTML, CSS and JavaScript.** Web and app development is part of this role, not an occasional extra. When a platform won't do what the design needs, you open the code and fix it.
- **Able to build a progressive web app** — installable on iOS and Android, working offline, deployed and hosted. If you haven't built one, you should be able to show us something close and convince us you'll get there fast.
- Comfortable with device testing, debugging and reading a console
- Hosting, domain, DNS and deployment

**AI tools**
- Comfortable and current with AI tools in a creative and production workflow
- Able to set up AI workflows for client teams and train them to use them — this is a service we sell, and you'll help deliver it
- Sound judgment about licensing and rights on anything AI-generated

**The rest**
- **At least two years of sales experience.** You've sold work before — freelance projects, studio new business, retail, services, fundraising. If you've spent two years finding your own clients, scoping the work and setting your own rates, that's exactly what we mean. Say so in your application.
- You're organized enough to run several client accounts at once without dropping one
- You can take a revision request without taking it personally, and a no without disappearing
- Comfortable with Google Workspace or Microsoft 365, and quick on new software
- Reliable high-speed internet and a quiet, private space you can take client calls from

**Helpful but not required:** Figma · React or a modern JS framework · backend, database or API experience · app store submission · e-commerce merchandising · photography or art direction · illustration · prior agency, in-house, print shop or freelance client work

---

## What we offer

- **Paid training** on our services and our sales process. You bring the creative ability; we give you the structure.
- **A real onboarding.** Your first weeks are supported and reviewed, with coaching along the way.
- **Variety.** Six industries, and no two accounts alike. If you're tired of designing the same thing for the same kind of client, this isn't that.
- **Ongoing coaching**, including regular review of the work you ship.

---

## Schedule

**You work your own time zone.** We serve clients nationwide and we staff across all U.S. time zones, so your hours run on local time wherever you are — not on somebody else's clock.

Firm hours are Monday & Friday 9–5 · Tuesday & Thursday 11–7 · Wednesday & Sunday closed · Saturday by appointment, applied in your zone. You'll be matched to clients where that schedule works for both of you.

Part-time: **four paid hours per day**, flexible within those windows. Additional approved hours are available on accounts that need them.



---

## Who you'll work with

You report to an **Accounts Manager**, who is your day-to-day support — they approve your work, coach you, and are the person you go to when something needs a decision. Accounts Managers report to our Business Manager, who reports to the Administrator.

It's a small firm. You'll know everyone.

---

## Equipment and security

Because we handle client data, every role meets the same baseline. **This role requires both a Windows laptop and a Mac laptop**, each meeting every item below:

- **A Windows laptop and a Mac laptop**, with a **dual-monitor** setup
- A **wired Ethernet** connection — not Wi-Fi only
- A **smartphone and/or tablet** that can run apps
- Antivirus, and an updated, encrypted Windows installation
- Two-factor authentication on all work accounts
- A secured home network
- A signed confidentiality agreement
- Consent to a background check

---

## Compensation

**$15.00 per hour** base, for all hours — creative work and sales alike.

**Commission on top of base:**
- **15%** of every initial sale
- **5%** of every recurring payment after that, for as long as that client stays with us
- **10%** on standalone and one-time services

**Base pay grows with results.** Your base rate is reviewed within your first 90 days and quarterly after that — and once you reach $14,000 in cumulative sales, it can increase from there.

The recurring commission is the point. A client who stays is worth far more than one who signs and leaves — and since you're the one doing their work, keeping them is largely in your hands.

---

## To apply

**info@hillcountryconsultants.com · 470-478-1590**

**Send your portfolio, links to two sites you've built (tell us which platform each is on), one piece of video or motion work, and anything you've built that runs as an app.**

Then tell us about a project where the client asked for something you thought was wrong — what you did, and how it ended.

*Must be legally authorized to work in the United States and working from within the U.S.*

---

*Hill Country Consultants · info@hillcountryconsultants.com · 470-478-1590 · Serving businesses nationwide since 2024*`;

const ACCOUNTS_MANAGER = `# Accounts Manager
**Hill Country Consultants · Remote / Hybrid — United States · Full-time**

*Clarity. Strategy. Organized Growth.*

---

## About us

Hill Country Consultants gives small and mid-size businesses the capability of a full staff without the payroll. For one flat monthly fee, we handle documentation, compliance, coordination, systems, brand and marketing — the work that quietly eats a growing business alive.

We serve six industries — construction and contractors, authors and personal brands, food and hospitality, small and mid-size business, nonprofits, and landowners and agriculture. We've been working with businesses nationwide since 2024.

---

## The role

**Most firms would call this a Sales Manager. We call it an Accounts Manager, because the job doesn't stop at the signature.**

You lead our Engagement Specialists and Creative Specialists — the people who bring clients in and then do the work for them. You set their targets, coach them every week, run the training that makes them good, and carry your own book alongside theirs.

You report to a Business Manager. The specialists report to you.

This is a hands-on seat, not a spreadsheet seat. At our size you'll own the playbook, help recruit, coach live, and close deals yourself. If you want to manage from a dashboard, this isn't it.

---

## What you'll own

### Leading the team

- Set individual and team targets, and review attainment weekly
- Coach through deal reviews, call reviews and live sessions — the single highest-value thing you'll do
- Run one-on-ones that people actually look forward to
- Recruit, interview and onboard new specialists alongside your Business Manager
- Ramp new hires: get them from certified to producing without letting them flounder
- Hold people accountable kindly and clearly, and know when someone isn't going to make it

### Weekly sales training — staff and clients

This is a distinctive part of the job, and it's two audiences.

**Your team, every week.** Live role-play, call review, objection handling, discovery practice, and a drill on our services and rates. Most of what anyone learns in an onboarding is gone in ninety days without this — you're the reason it sticks.

**Our clients, every week.** We teach sales to the businesses we serve. You'll deliver that training: discovery, follow-up, closing, pipeline discipline — adapted for a contractor, a nonprofit, an author, a restaurant owner. It's a real service line, and you're the one delivering it.

Being good in front of a room matters here as much as being good in a deal.

### Pipeline and forecasting

- Own the pipeline across your team — stage discipline, next steps current, nothing sitting untouched
- Forecast honestly. Call the number, flag the risk early, and don't let optimism into the sheet.
- Review proposals before they go up, so nothing reaches a client that we can't deliver
- Make sure every specialist is working their leads sheet and building beyond it

### Your own book

You carry your own accounts. You'll be given a leads sheet to start, and you're expected to build from there.

- Run strategy sessions and close agreements yourself
- Take the accounts that need someone senior in the room
- Stay close enough to the work that your coaching is credible — a manager who hasn't closed in a year stops being listened to

### Client retention

- Know where every account in your book stands, and step in before a client goes quiet
- Own renewals early, never in the final week
- Handle escalations personally
- Make the value visible — clients renew because they can *see* what they got
- Turn good relationships into referrals

---

## What we're looking for

- **A bachelor's degree**
- **Ten or more years of sales experience**, with a verifiable record of hitting a number
- **Five or more years** managing a team or a book of client accounts
- **You've coached people, not just supervised them.** You can take an average performer and make them better, and you can explain how.
- Comfortable in front of a room — you'll train staff and clients weekly
- You're comfortable telling someone no, including someone whose income depends on yes
- You can hold several people and several deals in your head at once without dropping one
- Strong written communication — coaching notes, training materials, client responses
- Numbers literacy: pipeline math, commission math, forecasting, hours against capacity
- Fluent in Google Workspace or Microsoft 365, a CRM, and quick on new software

**Preferred:** experience in a service business where hours are sold and delivered — agency, consulting, staffing, professional services. Experience building a sales playbook or training program from scratch. Any exposure to construction, food service, agriculture, publishing, media or nonprofit work.

---

## What we can't train

- **Coaching instinct.** Knowing which one thing to correct today, and leaving the other four alone.
- **Follow-through.** Weekly training that happens 47 weeks out of 52 is a broken system.
- **Credibility.** Your team will know within a month whether you can actually do what you're teaching.
- **Reading a room you can't see.** Much of retention is noticing a client who used to reply in an hour now takes three days, and picking up the phone before anyone asks you to.

---

## Schedule

Full-time, aligned to your Business Manager's coverage zone — Eastern or Pacific. Your team may be spread across time zones, and part of the job is being reachable when they need you.

---

## Equipment and security

Because we handle client data, every role meets the same baseline:

- **A Windows computer** with a **dual-monitor** setup
- A **wired Ethernet** connection — not Wi-Fi only
- A **smartphone and/or tablet** that can run apps
- Antivirus, and an updated, encrypted Windows installation
- Two-factor authentication on all work accounts
- A secured home network
- A signed confidentiality agreement
- Consent to a background check

---

## Compensation

**$32,564 per year** starting base.

**Commission:**
- **15%** of every initial sale
- **10%** of every recurring payment after that, for as long as that client stays with us
- **5%** on retained accounts — paid on the accounts you keep

**Quarterly bonus — 2.5% of quarterly profits.**

This is a commission-weighted seat by design. The base is a floor; the earnings come from what you and your team build and keep. Three of the four components pay on retention rather than on signatures, which is deliberate — we'd rather you keep twenty clients than sign forty and lose half.

---

## To apply

**info@hillcountryconsultants.com · 470-478-1590**

Tell us about someone you coached who got measurably better — what they were doing wrong, what you changed, and how you knew it worked.

*Must be legally authorized to work in the United States and working from within the U.S.*

---

*Hill Country Consultants · info@hillcountryconsultants.com · 470-478-1590 · Serving businesses nationwide since 2024*`;

const BUSINESS_MANAGER = `# Business Manager
**Hill Country Consultants · Remote / Hybrid — United States · Full-time, Salaried**

### Two positions open — one Eastern, one Pacific

*Clarity. Strategy. Organized Growth.*

---

## About us

Hill Country Consultants gives small and mid-size businesses the capability of a full staff without the payroll. For one flat monthly fee, we handle documentation, compliance, coordination, systems, brand and marketing — the work that quietly eats a growing business alive.

We serve six industries — construction and contractors, authors and personal brands, food and hospitality, small and mid-size business, nonprofits, and landowners and agriculture. We've been working with businesses nationwide since 2024.

---

## The role

**You run the entire business day to day, reporting only to the Administrator.**

We're hiring two Business Managers — **one covering Eastern hours, one covering Pacific.** We serve clients and staff across every U.S. time zone, and a firm that operates coast to coast needs management awake at both ends of the day. You'll cover your window, host your own morning meeting, and lead the Accounts Managers — and through them, the specialists — in your coverage area.

**This role splits roughly in half: 50% sales, 50% running the firm.** You're not a manager who occasionally sells. You carry real new business alongside real management responsibility, and you'll be expected to be good at both. You won't start from a blank page — you'll be given a local leads sheet to work from on day one.

These are our first management hires. You're not inheriting a finished machine — you're helping assemble one, and you'll have a real hand in how it ends up working.

**Where you sit:** you report to the Administrator. Our Accounts Managers report to you, and our Engagement Specialists and Creative Specialists report to them. You're the top of the operating structure — everything below the owner runs through you.

You'll build and lead that team, keep our clients, manage our vendors, hold the quality standard on everything that goes out the door, and make sure we never sell more work than we can actually deliver. It's a broad seat with genuine influence, and it suits someone who has looked at a growing business and thought *I could organize this.*

---

## What you'll own

**The daily management meeting**

You host it every business day by video, at the start of your coverage window, with your Accounts Managers. It's the heartbeat of the firm — where the day gets set, blockers surface before they cost a client, and nobody works a whole day in the wrong direction. You set the agenda, run it on time, resolve what can be resolved in the room, and publish notes afterward.

You'll also hand off cleanly to your counterpart in the other zone, so nothing falls into the gap between coverage windows.

**Client retention**

This is the number the firm lives on, and it's yours.

- Know where every client stands before they tell you — watch for the quiet ones, the unused hours, the slower replies
- Own renewals early, never in the final week
- Make the value visible. Clients don't renew because we worked hard; they renew because they can *see* what they got.
- Handle escalations personally, before they become cancellations
- When a client does leave, find out why and make sure it doesn't happen twice
- Turn good relationships into referrals and testimonials

**The team**

Accounts Managers in your coverage zone report directly to you. Through them, you're responsible for every Engagement Specialist and Creative Specialist in your zone.

- Recruit, screen and interview across all roles
- Develop your Accounts Managers into people who can run their own books well
- Set the standard for onboarding, training and coaching, and make sure it actually happens
- Manage schedules, coverage and capacity across the zone
- Hold performance conversations, the encouraging ones and the hard ones
- Step in directly when an account or a specialist needs it

**Quality and capacity**

- Review proposals and quotes before they reach a client
- Confirm what was sold matches what gets delivered
- Spot-check work going out the door. Our documents go to architects, funders and inspectors — our name is on all of it.
- Track committed work against the hours we actually have, and flag when we're approaching the line

**Construction submittals**

Construction is our largest industry, and this is our most technical service. You'll carry submittal work directly — not just supervise it.

- Assemble submittal packages: manufacturer cut sheets, index, marked project data, Bates numbering, transmittals, compliance checklists and RFIs on the client's letterhead
- Review packages before they go to a contractor of record for signature
- Set the standard for how specialists produce them, and train against it
- Step in on high-stakes or high-volume packages

*(We prepare and organize. We don't stamp or certify engineering — the client's contractor of record reviews and signs.)*

**Vendor relations**

- Source, vet and negotiate with vendors, contractors and specialty providers
- Manage our preferred vendor relationships and keep that bench current
- Hold vendors to scope, timeline and quality — the same standard we hold ourselves to
- Own contracts, renewals and pricing with every outside provider
- Bring in outside help when a client need falls outside what our team covers — for example, in-person event planning and on-site event coordination are delivered through our event vendor, and you own that relationship

**Money**

- Invoicing, payment schedules and collections follow-up
- Commission calculation and verification
- Expense tracking, vendor and contractor payments
- Coordinate with our bookkeeper and CPA

**Systems, build and design**

- Maintain our website — pages, copy, service updates, forms
- Build and maintain our internal staff portal
- Connect our platforms so information stops getting retyped
- Build internal tools when buying one doesn't make sense
- Design internal and client-facing materials — one-sheets, proposals, reports, presentations
- Hold brand consistency across everything the firm puts out
- Write the process documentation this firm still needs

**Sales — about half the role**

- Work the local leads sheet you're given, and build your own pipeline from there
- Meet business owners through referrals, professional networks, trade associations, chambers and industry events
- Run free 30-minute strategy sessions
- Recommend the right level of service based on what you heard, and close the agreement
- Grow existing accounts — you'll know them better than anyone, since you're also the one keeping them
- Step in when a prospect needs someone senior in the room

---

## What we're looking for

- **A bachelor's degree**
- **Five or more years of sales experience.** Half this job is selling, and we need someone who has carried a number before — services, retainers, B2B, professional services, insurance, real estate, recruiting or similar.
- **Five or more years** managing operations, a team, or a book of client accounts — including managing other managers, or being ready to
- **Notary commission — current, or eligible and willing to become commissioned.** We offer notary services to clients, and we need it covered in both coverage zones. If you're not currently commissioned, you'll be expected to obtain it in your state shortly after starting.
- **You've actually managed people** — assigned work, given hard feedback, and been accountable when someone underperformed
- You can hold several moving projects and several people in your head at once without dropping one
- You're comfortable telling someone no, including someone whose income depends on yes
- **You can hold a client relationship.** You've kept accounts, handled unhappy customers, and turned a complaint into a longer relationship rather than an exit.
- Strong written communication — process documents, coaching notes, meeting summaries, client responses
- Numbers literacy: invoicing, commission math, hours against budgets, revenue against capacity
- **Construction document experience is a strong advantage** — submittals, bids, prequalification or project documentation. If you haven't done it, you'll be trained, but you'll be expected to become genuinely good at it.
- A dedicated, quiet workspace, reliable high-speed internet, and a setup you can host a video meeting from every morning

**Technology — not negotiable**

You'll live in software all day, across several platforms at once, and you'll be who others come to when something won't work.

- Strong general computer skills — you troubleshoot your own problems before asking anyone
- Fluent in Google Workspace or Microsoft 365
- Comfortable running several platforms at once — our portal, our website, a CRM, project tracking, video conferencing, e-signature, invoicing, cloud storage
- Quick to learn new software without hand-holding
- Spreadsheet capable — formulas, filtering, and building a tracker from scratch
- Able to teach a tool to someone else once you've learned it

**Coding and programming**

- Working knowledge of HTML, CSS and JavaScript — able to open a page, find what's wrong, fix it, and know you didn't break something else
- Comfortable inside a website builder *and* in the underlying code when the builder won't cooperate
- Understand how APIs, integrations and webhooks connect platforms — and able to set them up
- Experience with automation tools such as Zapier or Make
- Able to read documentation and work out an unfamiliar system on your own

You won't be building enterprise software. You'll be the person who makes our systems work together, and who fixes it Tuesday morning instead of waiting a week for a contractor.

**Graphic design**

- Fluent in a professional design tool — Canva at minimum; Adobe Creative Suite or Figma preferred
- Able to design a clean, professional business document from a blank page
- Working understanding of layout, typography, color and hierarchy
- Can build and maintain brand templates others can use without breaking them
- A portfolio or work samples. We'll ask.

**Preferred:** experience in a service business where hours are sold and delivered — agency, consulting, staffing, professional services. Account management or client retention experience in a recurring-revenue business. Bookkeeping or light financial operations. Any exposure to construction, food service, agriculture, publishing, media or nonprofit work.

---

## What we can't train

- **The ability to switch gears.** You'll close a deal in the morning and handle a client escalation and a payroll question in the afternoon. Both halves of this job have to get done.
- **Judgment.** Half this job is working out the right answer quickly with incomplete information, then making the case for it well.
- **Follow-through.** A report that goes out 47 weeks out of 52 is a broken system.
- **Directness delivered with respect.** You'll tell a specialist their proposal is wrong and a client their expectation isn't in the agreement.
- **Reading a room you can't see.** Much of retention is noticing a client who used to reply in an hour now takes three days, and picking up the phone before anyone asks you to.

---

## Your first 90 days

**Days 1–30.** Learn the business — every service, every rate, every term. Sit in on client conversations. Read every active client file. Meet everyone one on one.

**Days 31–60.** Take the controls. Host the daily meeting. Take on proposal review and quality checks. Build the capacity picture. Start weekly coaching. Begin working your leads sheet and running your own strategy sessions.

**Days 61–90.** Fix something. Build out your Accounts Manager bench, or develop the one you have. Find the three worst bottlenecks and resolve at least one. Document two processes that currently live only in someone's head. Own collections end to end. Establish the renewal calendar and complete a first review with every active client.

---

## Compensation

**$40,000 per year, salaried.** Remote / Hybrid — primarily remote, with local and regional on-site as needed.

**Commission on your own sales:**
- **10%** of every initial sale
- **5%** of every recurring payment after that, for as long as that client stays with us

**Quarterly client-retention bonus — 5% of quarterly profits.** Retention is the number this role most directly controls, and the bonus is tied to it. Keep clients with us and you share in what the firm earns.

Half this job is selling, so the commission isn't a rounding error — it's a real part of what you take home, and the recurring piece keeps paying as long as your clients stay.

**Specify which position you're applying for — Eastern or Pacific.** You'll work standard business hours in that zone, and the daily management meeting anchors every business morning.

---

## Equipment and security

Because we handle client data, every role meets the same baseline:

- **A Windows computer** with a **dual-monitor** setup
- A **wired Ethernet** connection — not Wi-Fi only
- A **smartphone and/or tablet** that can run apps
- Antivirus, and an updated, encrypted Windows installation
- Two-factor authentication on all work accounts
- A secured home network
- A signed confidentiality agreement
- Consent to a background check

---

## To apply

**info@hillcountryconsultants.com · 470-478-1590**

**Tell us which position you're applying for — Eastern or Pacific.**

Then tell us about a system or process you built from nothing — what was broken before, what you put in place, how you got it approved, and how you knew it worked.

**Please include work samples:** something you designed, and something you built or coded.

*Must be legally authorized to work in the United States and working from within the U.S.*

---

*Hill Country Consultants · info@hillcountryconsultants.com · 470-478-1590 · Serving businesses nationwide since 2024*`;

export const JOBS: Job[] = [
  {
    slug: "business-manager",
    title: "Business Manager",
    type: "Full-time · Salaried",
    location: "Remote / Hybrid · United States",
    tagline: "Clarity. Strategy. Organized Growth.",
    pay: "$40,000/yr salaried + 10% / 5% commission + 5% quarterly retention bonus",
    summary:
      "Two positions open — one Eastern, one Pacific. The firm's top operating seat below the owner: run the business day to day, lead the Accounts Managers (and through them the specialists), keep and grow clients, own vendors and quality, and carry real new business — roughly 50% sales, 50% running the firm.",
    open: true,
    body: BUSINESS_MANAGER,
  },
  {
    slug: "accounts-manager",
    title: "Accounts Manager",
    type: "Full-time · Salaried",
    location: "Remote / Hybrid · United States",
    tagline: "Clarity. Strategy. Organized Growth.",
    pay: "$32,564/yr base + 15% initial · 10% recurring · 5% retention + 2.5% quarterly bonus",
    summary:
      "Most firms would call this a Sales Manager — we don't, because the job doesn't stop at the signature. Lead our Engagement and Creative Specialists: set targets, coach weekly, run staff and client sales training, own the pipeline and forecast, and carry your own book alongside theirs. Reports to a Business Manager.",
    open: true,
    body: ACCOUNTS_MANAGER,
  },
  {
    slug: "engagement-specialist",
    title: "Engagement Specialist",
    type: "Contracted · Part-time",
    location: "Remote / Hybrid · United States",
    tagline: "Clarity. Strategy. Organized Growth.",
    pay: "$10/hr base (reviewed up to $17 with results) + 15% initial · 5% recurring · 10% standalone",
    summary:
      "You bring the client in, then you're the one who takes care of them — about 75% client work, 25% sales. Assemble construction submittals, run compliance and coordination, keep the account, and sell the next one. Two years of sales experience wanted; paid training on the rest. Reports to an Accounts Manager.",
    open: true,
    body: ENGAGEMENT_SPECIALIST,
  },
  {
    slug: "creative-specialist",
    title: "Creative Specialist",
    type: "Contracted · Part-time",
    location: "Remote / Hybrid · United States",
    tagline: "Clarity. Strategy. Organized Growth.",
    pay: "$15/hr base + 15% initial · 5% recurring · 10% standalone",
    summary:
      "You make the work — graphics, brand systems, websites, PWAs and custom apps, print, video — and about a quarter of the time you're the one who brings it in. Roughly 75% creative, 25% sales. Requires a portfolio, both a Windows and a Mac laptop, and two years of sales experience. Reports to an Accounts Manager.",
    open: true,
    body: CREATIVE_SPECIALIST,
  },
];

export const jobBySlug = (slug: string): Job | undefined => JOBS.find((j) => j.slug === slug);
export const openJobs = () => JOBS.filter((j) => j.open);
