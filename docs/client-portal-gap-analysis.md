# Client Portal — Gap Analysis & Opportunities

How HCC's client portal compares to what leading client portals (SuiteDash, Copilot/Assembly, Moxo, Clinked, HoneyBook, TaxDome) offer in 2026, and where to invest next. Sources at the end.

## The 2026 "table stakes" — and where HCC stands

| Standard feature | Industry expectation | HCC today |
|---|---|---|
| Secure messaging | One place, no email back-and-forth | ✅ Have (portal messages + inbound email → thread, attachments) |
| Secure file sharing | Upload/download, permissions | ✅ Have (Files) |
| Role-based access / hide internal notes | Per-account, internal work hidden | ✅ Have (RLS + staff-only internals) |
| Branded, own-domain experience | Your brand, not the vendor's | ✅ Have (own domain + brand) |
| Task tracking / status visibility | Client sees progress | ✅ Have (task board, weekly report, work log) |
| Invoice access + online pay | See + pay invoices | ✅ Have (Stripe checkout, per-task charges) |
| Onboarding + roadmap | Guided start | ✅ Have (checklist, 30-day roadmap) |
| Credential handling | Secure logins | ✅ Have (shared vault) |
| Satisfaction / feedback | Client voice | ✅ Have (new: rating + referral) |

HCC already meets the core bar. The gaps below are the differentiators the better platforms lead with.

## What we're missing (true gaps)

1. **Client e-signature & approvals.** The strongest theme in 2026 portals: clients review, comment on, and formally **sign off** on deliverables and agreements *inside* the portal, with an audit trail. HCC has DocuSign wired for *employee* documents only. Clients can't e-sign a contract/SOW or approve a deliverable in-portal today. **Highest-impact gap.**

2. **Autopay / saved payment method.** Recurring plan invoices are paid one-by-one via Stripe Checkout. Leading portals save a card and auto-charge recurring fees (Stripe subscriptions / saved payment), with automatic receipts. Reduces collections work and late payments.

3. **Client MFA / two-factor login.** The portal holds a credential vault and client business data, but sign-in is password-only. Optional/enforced 2FA is now standard for portals holding sensitive data.

4. **Client-facing notifications.** Clients get some transactional emails, but there's no in-portal notification center and limited event emails (e.g., "deliverable ready," "you have a reply," "invoice due in 3 days," "weekly report posted"). This is what keeps clients logging in.

5. **Client documents / signed-agreement area.** Clients can see shared files, but there's no dedicated "My documents" space to retrieve signed contracts, proposals, and receipts in one place.

6. **In-portal intake forms / questionnaires.** Onboarding and ongoing info-gathering happens over email/manually. Portals offer structured forms/questionnaires clients fill in (brand questionnaire, asset requests, etc.).

7. **Allotment / usage visibility for clients.** Clients see hours in the weekly report but not a live "hours used vs. included this month" meter — a trust-builder and upsell signal.

8. **Client-facing help / resources.** There's a public FAQ and an internal staff Knowledge base, but no in-portal help/resources for clients (how-tos, "what to expect," policies).

## What we could improve (have it — make it better)

- **File version history + comment/approve** on deliverables (not just download).
- **Payment history & downloadable receipts/invoices** as a clean statement, not just pay links.
- **Embedded scheduling** — kickoff/review booking currently links out to Google Calendar; some portals embed it.
- **Mobile menu** — the marketing header wraps on small screens instead of a hamburger (minor polish; portal itself is responsive).
- **Announcements/broadcast** — a way to post a notice to all active clients (e.g., holiday hours, a new service line).

## Recommended sequence

**Phase 1 — highest value, moderate effort**
- Client e-sign & deliverable approvals (reuse the existing DocuSign integration, extend to client side)
- Client-facing notifications (email triggers + a simple in-portal "recent activity" feed) — reuses the cron just built
- Allotment/usage meter in the portal

**Phase 2 — revenue & security**
- Autopay / saved payment method for recurring plan invoices (Stripe subscriptions)
- Client MFA (optional first, then encourage)
- Payment history + downloadable receipts

**Phase 3 — polish & self-service**
- In-portal intake forms/questionnaires
- Client documents area + client help/resources
- Announcements, file versioning/approvals, embedded scheduling

---

### Sources
- Assembly — [11 Must-Have Client Portal Features for Service Firms in 2026](https://assembly.com/blog/client-portal-features)
- Clinked — [Best Client Portal Software 2026](https://www.clinked.com/blog/best-client-portal-software)
- FuseBase — [20 Best Client & Customer Portal Software in 2026](https://thefusebase.com/blog/top-client-portal-software/)
- HoneyBook — [Compare the Best Client Portal Software](https://www.honeybook.com/blog/best-client-portal-software)
- Zendesk — [16 best customer and client portals for 2026](https://www.zendesk.com/service/help-center/client-portal/)
- TaxDome — [Client portals for accountants in 2026](https://taxdome.com/blog/client-portals-for-accountants)
