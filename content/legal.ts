/**
 * Legal pages — verbatim from the prototype. Counsel must review before launch
 * (Terms, Refund & Cancellation, Privacy). "All sales final" is load-bearing:
 * the consent record + itemised scope + delivery record are the dispute evidence.
 */
export interface LegalSection { t: string; lines: string[] }
export interface LegalPage {
  slug: string; // route under /
  nav: string;
  kicker: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const UPDATED = "Last updated August 12, 2026";

export const LEGAL: Record<"policies" | "terms" | "refund-policy" | "privacy", LegalPage> = {
  policies: {
    slug: "policies", nav: "Policies & Procedures", kicker: "Policies & procedures",
    title: "How we work, in writing", updated: UPDATED,
    intro: "The operating terms every engagement runs on. These are the same commitments carried in your proposal and contract.",
    sections: [
      { t: "Scope and pricing", lines: ["Scope and pricing are agreed in writing before work begins.", "Anything beyond the agreed scope is quoted before it is done.", "Standalone rates are starting points, subject to scope.", "Hard costs — printing, licensing, hosting, venue, catering, paid ads, ISBN and print runs — are billed at cost."] },
      { t: "Plans and terms", lines: ["Plans run a standard 12-month term. A quarterly option is available.", "Monthly fees are split — first half due on the 1st, second half by the 15th — or paid in full.", "A five business-day grace period applies to monthly fees.", "Standalone projects are paid in full at booking, or as set out in your written quote.", "Renewal happens at the end of the term. Tiers can move up or down at renewal."] },
      { t: "Payment methods", lines: ["Credit card, Zelle, or Cash App.", "No checks or money orders.", "Payments made on this site cover the amount shown at booking. Scoped work is invoiced after the written quote is accepted."] },
      { t: "Allotments and overage", lines: ["Each plan tier sets the monthly volume across every service line.", "Submittals beyond your allotment are $450 per week at any volume.", "Additional virtual assistant hours are $55 Foundation, $50 Momentum, $40 Enterprise.", "Rush turnaround is $550 per job and is never included in any plan.", "Unused allotment does not roll over. Unused capacity is reviewed at your tier cadence."] },
      { t: "Delivery and revisions", lines: ["Every deliverable passes a pre-delivery review before it reaches you.", "One revision round is included on standard deliverables. Further revisions are quoted and billed separately.", "Turnaround is standard at Foundation, priority in queue at Momentum, and priority on everything at Enterprise.", "Work is delivered on your brand and verified for accuracy before release."] },
      { t: "Confidentiality and credentials", lines: ["Your information, credentials and materials are protected and never shared without permission.", "Logins are collected securely through a password manager during week-one onboarding and are never kept in plain text.", "If you offboard, all credentials and assets are returned to you."] },
      { t: "Limits of our work", lines: ["We prepare — we do not certify or stamp engineering. Your general contractor or contractor of record reviews and signs.", "Legal wording is flagged to your attorney and never altered by us.", "We are not a substitute for licensed bookkeeping, legal, or tax services.", "On grant work we research, prepare and submit. No award is guaranteed.", "Specialized surveying, legal or agronomy work is referred out as needed."] },
      { t: "Communication", lines: ["Every plan includes a dedicated account lead as your single point of contact.", "Administrative requests are acknowledged the same business day and actioned in agreed priority.", "Reviews run monthly at Foundation, bi-weekly at Momentum, and weekly at Enterprise.", "Risks and blockers are flagged the day they surface, with a recommended path."] },
    ],
  },
  terms: {
    slug: "terms", nav: "Terms of Service", kicker: "Terms of service",
    title: "Terms of Service", updated: UPDATED,
    intro: "These terms govern the use of this website and the purchase of services from Hill Country Consultants. By booking, paying, or signing a proposal you accept them.",
    sections: [
      { t: "1 · Agreement and scope", lines: ["Service descriptions on this site are summaries. The written proposal or contract for your engagement governs what is delivered, at what volume, and on what schedule.", "Where this site and a signed proposal differ, the signed proposal controls.", "Anything outside the agreed scope is quoted in writing and approved before it is performed."] },
      { t: "2 · Fees, billing and authorization", lines: ["All prices are in U.S. dollars.", "Plan fees are split — first half due on the 1st, second half by the 15th — or paid in full, and continue for the agreed term. A five business-day grace period applies.", "Standalone projects are paid in full at booking, or as set out in your written quote.", "By submitting payment on this site you authorize Hill Country Consultants to charge the payment method you provide for the amount shown at booking, and for any amounts you later approve in writing.", "Charges appear on your statement as Hill Country Consultants.", "Accepted methods are credit card, Zelle, or Cash App. We do not accept checks or money orders.", "Work may be paused on accounts past the grace period until the balance is current."] },
      { t: "3 · All sales final", lines: ["All payments are final. We do not issue refunds on plan fees, project payments, class fees, overage, or rush charges. See the Refund & Cancellation Policy for the full terms.","Initiating a chargeback or payment dispute instead of contacting us is a breach of these terms."] },
      { t: "4 · Your responsibilities", lines: ["Provide accurate information, materials, approvals and access on time, and name one point of contact.", "Hold the rights to any content, logos, data or documents you give us to use.", "Delays caused by missing materials or approvals do not extend an allotment, change a fee, or create a right to a refund."] },
      { t: "5 · Ownership of work", lines: ["On receipt of full payment, you own the final deliverables we produce for you.", "We retain our own templates, checklists, internal process documentation, tooling and prompt libraries, including any improvements made while serving you.", "We use your name or work publicly only with your written permission."] },
      { t: "6 · Confidentiality", lines: ["Each party protects the other’s confidential information and does not share it without permission, except where disclosure is required by law.", "Credentials are collected and held through a password manager, and are returned or revoked at offboarding."] },
      { t: "7 · Limits of service", lines: ["We prepare documents and packages. We do not certify or stamp engineering, and your general contractor or contractor of record reviews and signs.", "Legal wording is flagged to your attorney and never altered by us.", "We are not a substitute for licensed bookkeeping, legal, or tax services.", "On grant work we research, prepare and submit. No award is guaranteed."] },
      { t: "8 · Limitation of liability", lines: ["Services are provided as described in your proposal. We do not warrant any specific business outcome, award, approval, ranking or revenue result.", "To the fullest extent permitted by law, our total liability for any claim is limited to the fees you paid for the specific service giving rise to the claim, and for plans, to one month of plan fees.", "Neither party is liable for indirect, incidental, special or consequential damages, or for lost profits."] },
      { t: "9 · Indemnification", lines: ["You agree to indemnify Hill Country Consultants against claims arising from materials or instructions you supply, including claims of infringement, inaccuracy, or unlawful use."] },
      { t: "10 · Term, suspension and termination", lines: ["Plans run the agreed term. Non-renewal or changes take effect at the end of the term unless your contract states otherwise.", "We may suspend or terminate service for non-payment, for breach of these terms, or for abusive conduct toward our team.", "On termination, all amounts already paid remain non-refundable, and work completed to date is delivered."] },
      { t: "11 · Force majeure", lines: ["Neither party is liable for delay caused by events beyond reasonable control, including severe weather, utility or platform outages, or acts of government. Deadlines are extended by the length of the event."] },
      { t: "12 · Governing law and disputes", lines: ["These terms are governed by the laws of the State of Texas, without regard to conflict-of-law rules.", "Before any formal action, the parties will attempt to resolve the dispute in good faith by direct discussion for thirty days.", "Any action that proceeds is brought in the state or federal courts serving Gregg County, Texas, and each party consents to that venue.", "Each party bears its own costs and attorney fees unless a court orders otherwise."] },
      { t: "13 · Changes to these terms", lines: ["We may update these terms. The updated date appears at the top of this page, and continued use of the site or services after an update means you accept the revised terms.", "Terms in a signed contract are not changed by a website update."] },
      { t: "14 · Contact", lines: ["Questions about these terms: info@hillcountryconsultants.com or 470-478-1590.", "Hill Country Consultants — Longview, Texas and Atlanta, Georgia, serving clients nationwide."] },
    ],
  },
  "refund-policy": {
    slug: "refund-policy", nav: "Refund & Cancellation", kicker: "Refund & cancellation",
    title: "Refund & Cancellation Policy", updated: UPDATED,
    intro: "Every scope, rate and term is published on this site and confirmed in writing before you pay. Because of that, all sales are final.",
    sections: [
      { t: "All sales are final", lines: ["We do not issue refunds on plan fees, project payments, class fees, overage charges, or rush charges.", "This applies whether payment was made by card, Zelle, or Cash App.", "You confirm you have read and accepted this policy at checkout before any payment is taken."] },
      { t: "Why the policy is strict", lines: ["A booking reserves capacity on our schedule and, for standalone work, begins production immediately.", "Rates, inclusions, revision rounds, turnaround and scope limits are published on this site and restated in your written scope before payment.", "You have the chance to ask any question, at no cost, in a 30-minute strategy session before you buy."] },
      { t: "No chargebacks", lines: ["If something is wrong, contact us first at info@hillcountryconsultants.com or 470-478-1590. We answer within one business day.", "You agree not to initiate a chargeback, payment dispute, or reversal in place of contacting us.", "A chargeback filed against a delivered or in-progress engagement is a breach of our Terms of Service. We will contest it with the written scope, this policy, your acceptance record, and the delivery record, and we may recover the resulting fees and collection costs.", "Accounts with an open payment dispute are suspended until it is resolved."] },
      { t: "If we cannot deliver", lines: ["If we fail to deliver an agreed deliverable, we complete it, replace it, or issue an account credit toward future work — at our option and at no additional cost to you.", "Credits do not expire while your account is active.", "This is your remedy in place of a refund."] },
      { t: "Cancelling a plan", lines: ["Plans run the agreed term and cancel at the end of it, per your contract.", "Cancelling mid-term does not refund fees already paid, and any remaining term obligation in your contract still applies.", "Written notice to info@hillcountryconsultants.com starts the process."] },
      { t: "Classes and events", lines: ["A class or event payment reserves the date, the team and the materials.", "A confirmed class may be rescheduled once, at no charge, with at least fourteen days’ written notice, subject to availability.", "Inside fourteen days, or for a second reschedule, the payment is forfeited.", "No-shows are not refunded or rescheduled."] },
      { t: "Quotes and strategy sessions", lines: ["Quote requests cost nothing and create no obligation.", "The 30-minute strategy session is free and can be cancelled or rescheduled at any time."] },
      { t: "Raising an issue", lines: ["Email info@hillcountryconsultants.com within ten business days of delivery with the reference number from your confirmation.", "We respond within one business day and work the issue against your written scope."] },
    ],
  },
  privacy: {
    slug: "privacy", nav: "Privacy Policy", kicker: "Privacy policy",
    title: "Privacy Policy", updated: UPDATED,
    intro: "What we collect, why we collect it, and what we do with it. We do not sell your information.",
    sections: [
      { t: "Information you give us", lines: ["Contact and business details submitted through forms on this site: name, business, email, phone, industry, timeline and what you tell us about your needs.", "Booking details: the services selected, requested start date, deadline and project notes.", "Client materials and credentials provided during onboarding."] },
      { t: "Payment information", lines: ["Card payments are processed by our payment provider. We do not store full card numbers or security codes on this site or in our records.", "We keep the transaction reference, amount, date and what was purchased, for accounting and tax records.", "Zelle and Cash App payments are processed by those services under their own terms."] },
      { t: "How we use information", lines: ["To respond to inquiries, prepare quotes and proposals, and deliver the services you booked.", "To invoice, keep records, and meet tax and legal obligations.", "To communicate about your engagement, including reviews and reporting at your tier cadence."] },
      { t: "How we share information", lines: ["We do not sell or rent your information.", "We share it only with service providers who help us operate — payment processing, hosting, email, file storage, password management — and with team members and subcontractors bound by confidentiality.", "We disclose information when required by law or to protect our legal rights."] },
      { t: "Client credentials", lines: ["Credentials are collected through a password manager, held with the least access needed to do the work, and never kept in plain text.", "At offboarding, credentials are returned or revoked and access is removed."] },
      { t: "Retention", lines: ["Engagement records, contracts and transaction records are kept as long as needed for the engagement and for the periods required by tax and business law.", "Client work product and assets are returned at offboarding.", "You can ask us to delete inquiry information we are not required to keep."] },
      { t: "Your choices", lines: ["Ask us what we hold about you, ask for a correction, or ask for deletion where the law allows it — email info@hillcountryconsultants.com.", "Ask to stop receiving non-essential email at any time. Service communication about an active engagement continues while the engagement is active."] },
      { t: "Cookies and analytics", lines: ["This site uses only what it needs to function and to remember your progress in a booking.", "If analytics or advertising tools are added later, this policy will be updated first."] },
      { t: "Security", lines: ["We use reasonable administrative and technical safeguards, including access limits and a password manager for credentials.", "No method of transmission or storage is perfectly secure, and we cannot guarantee absolute security."] },
      { t: "Business use and age", lines: ["This site and our services are intended for businesses and organizations, and for adults age 18 and over.", "We do not knowingly collect information from children."] },
      { t: "Changes and contact", lines: ["Updates appear here with a new date at the top of the page.", "Questions: info@hillcountryconsultants.com or 470-478-1590."] },
    ],
  },
};

export const LEGAL_ORDER: (keyof typeof LEGAL)[] = ["policies", "terms", "refund-policy", "privacy"];
