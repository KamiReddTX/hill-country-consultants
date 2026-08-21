import { Resend } from "resend";

const from = process.env.EMAIL_FROM || "Hill Country Consultants <info@hillcountryconsultants.com>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const fromAddress = (from.match(/<(.+?)>/)?.[1]) || from;
/** Escape user/staff-authored text before dropping it into HTML email bodies. */
const esc = (s: string) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

async function send(to: string | string[], subject: string, html: string, replyTo?: string, fromName?: string) {
  const resend = client();
  if (!resend) { console.warn("[email] RESEND_API_KEY not set — skipped:", subject); return; }
  // Keep the authenticated domain address, but show the sender's name when given,
  // so the recipient sees who it's from and Reply-To routes straight to them.
  const fromLine = fromName ? `${esc(fromName)} via Hill Country Consultants <${fromAddress}>` : from;
  await resend.emails.send({ from: fromLine, to, subject, html, replyTo: replyTo || process.env.EMAIL_REPLY_TO } as any);
}

const shell = (title: string, body: string) => `
  <div style="font-family:Inter,system-ui,sans-serif;color:#20241f;background:#f6f1e6;padding:28px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e0d6bf">
      <div style="background:#234b34;padding:20px 28px">
        <span style="color:#d4b55f;font-size:12px;letter-spacing:.2em;text-transform:uppercase">Hill Country Consultants</span>
      </div>
      <div style="padding:28px">
        <h1 style="font-family:Georgia,serif;color:#234b34;font-size:24px;margin:0 0 12px">${title}</h1>
        <div style="height:2px;width:44px;background:#c2a24a;margin-bottom:20px"></div>
        ${body}
      </div>
      <div style="border-top:1px solid #e0d6bf;padding:16px 28px;color:#6b6552;font-size:12px">
        <a href="mailto:info@hillcountryconsultants.com" style="color:#6b6552;text-decoration:underline">info@hillcountryconsultants.com</a> · 470-478-1590 · Longview, TX &amp; Atlanta, GA
      </div>
    </div>
  </div>`;

/** Booking confirmation with portal access + the 48-hour review notice. */
export async function sendBookingConfirmation(opts: {
  to: string; ref: string; itemsHtml: string; startDate: string; portalUrl: string;
}) {
  const body = `
    <p style="font-size:16px;line-height:1.6">Thank you — your booking is confirmed. Reference <strong>${opts.ref}</strong>.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">What you booked:</p>
    <div style="font-size:15px;line-height:1.7;color:#3a3f38">${opts.itemsHtml}</div>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Requested start: <strong>${opts.startDate || "to be confirmed"}</strong>.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Your account is <strong>in review</strong>. We confirm scope and next steps within <strong>48 hours</strong>.</p>
    <p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Access your client portal</a></p>
    <p style="font-size:13px;color:#6b6552">All sales are final. See the Refund &amp; Cancellation Policy.</p>`;
  await send(opts.to, `Booking confirmed · ${opts.ref}`, shell("Your booking is confirmed", body));
}

/** Internal alert to the team when a booking is paid. Reply-to is the client so
 *  a reply reaches them directly. Recipient is ADMIN_NOTIFY_EMAIL (defaults to info@). */
export async function sendPurchaseAdminAlert(opts: {
  ref: string; business: string; contact: string; email: string; phone: string;
  itemsHtml: string; amount: string; startDate: string;
}) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:2px 16px 2px 0;color:#6b6552;white-space:nowrap">${k}</td><td style="padding:2px 0"><strong>${v || "—"}</strong></td></tr>`;
  const body = `
    <p style="font-size:16px;line-height:1.6">New paid booking — <strong>${opts.amount}</strong> · Ref <strong>${opts.ref}</strong></p>
    <table style="font-size:14px;line-height:1.6;color:#3a3f38;border-collapse:collapse;margin:8px 0 16px">
      ${row("Business", opts.business)}${row("Contact", opts.contact)}${row("Email", opts.email)}${row("Phone", opts.phone)}${row("Requested start", opts.startDate)}
    </table>
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">Items:</p>
    <div style="font-size:14px;line-height:1.7;color:#3a3f38">${opts.itemsHtml}</div>
    <p style="font-size:13px;color:#6b6552;margin-top:16px">Reply to this email to reach the client directly.</p>`;
  await send(to, `New booking · ${opts.amount} · ${opts.ref}`, shell("New paid booking", body), opts.email || undefined);
}

/** Internal alert when someone submits an employment application. Reply-to is
 *  the applicant so a reply reaches them directly. Recipient is ADMIN_NOTIFY_EMAIL. */
export async function sendApplicationAlert(opts: {
  name: string; email: string; phone: string; position: string; location: string; portalUrl: string; hasResume: boolean;
}) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:2px 16px 2px 0;color:#6b6552;white-space:nowrap">${k}</td><td style="padding:2px 0"><strong>${esc(v || "—")}</strong></td></tr>`;
  const body = `
    <p style="font-size:16px;line-height:1.6">New employment application${opts.position ? ` — <strong>${esc(opts.position)}</strong>` : ""}.</p>
    <table style="font-size:14px;line-height:1.6;color:#3a3f38;border-collapse:collapse;margin:8px 0 16px">
      ${row("Name", opts.name)}${row("Email", opts.email)}${row("Phone", opts.phone)}${row("Location", opts.location)}${row("Résumé", opts.hasResume ? "attached (in portal)" : "none")}
    </table>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Review in the staff Directory</a></p>` : ""}
    <p style="font-size:13px;color:#6b6552">Reply to this email to reach the applicant directly.</p>`;
  await send(to, `New application${opts.position ? ` · ${opts.position}` : ""} · ${opts.name}`, shell("New employment application", body), opts.email || undefined);
}

/** Ask a client to pay an additional charge before a task starts. */
export async function sendTaskPaymentRequest(opts: { to: string; amount: string; payUrl: string; taskTitle: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6">There's an additional charge of <strong>${opts.amount}</strong> to start this task:</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">${opts.taskTitle}</p>
    <p style="margin:22px 0"><a href="${opts.payUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Pay ${opts.amount}</a></p>
    <p style="font-size:13px;color:#6b6552">Once payment clears, the task moves into progress and shows on your board. Questions? Just reply to this email.</p>`;
  await send(opts.to, `Payment to start your task — ${opts.amount}`, shell("A quick payment to get started", body));
}

/** Friday weekly report (called from a scheduled job in the portal phase). */
export async function sendWeeklyReport(opts: { to: string; business: string; summaryHtml: string; portalUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6">This week for <strong>${opts.business}</strong>:</p>
    <div style="font-size:15px;line-height:1.7;color:#3a3f38">${opts.summaryHtml}</div>
    <p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open your portal</a></p>`;
  await send(opts.to, `Your weekly report`, shell("Weekly report", body));
}

/** Alert the assigned VA/AM that a client submitted a new task request. */
export async function sendStaffTaskAlert(opts: { to: string; clientName: string; title: string; due: string; portalUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${opts.clientName}</strong> submitted a new task request.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">${opts.title}</p>
    ${opts.due ? `<p style="font-size:14px;line-height:1.6;color:#3a3f38">Needed by: <strong>${opts.due}</strong></p>` : ""}
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">It's sitting in <strong>Requested</strong> on their board.</p>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open your board</a></p>` : ""}`;
  await send(opts.to, `New task from ${opts.clientName}`, shell("New task request", body));
}

/** Alert the assigned VA/AM that a client sent a new message. Reply-To is the
 *  client, so the staffer can answer straight from their inbox. */
export async function sendStaffMessageAlert(opts: { to: string; clientName: string; portalUrl: string; replyTo?: string; message?: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.clientName)}</strong> sent you a message in the portal.</p>
    ${opts.message ? `<div style="font-size:15px;line-height:1.6;color:#3a3f38;border-left:3px solid #c2a24a;padding:2px 0 2px 14px;margin:12px 0;white-space:pre-wrap">${esc(opts.message)}</div>` : ""}
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">Reply to this email to answer them directly, or open the portal to keep it in the thread.</p>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open Messages</a></p>` : ""}`;
  await send(opts.to, `New message from ${opts.clientName}`, shell("New client message", body), opts.replyTo, opts.clientName);
}

/** Invite the client to set up the shared password vault with their account team. */
export async function sendVaultInvite(opts: { to: string; from: string; portalUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${opts.from}</strong> is setting up your shared password vault.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">This is how we securely hold the logins we need to work on your behalf. Live passwords always live in the encrypted password manager we share with you — never in an email or a web page.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Next steps:</p>
    <ol style="font-size:15px;line-height:1.7;color:#3a3f38">
      <li>Accept the vault share when it arrives from our password manager (confirm the sender is hillcountryconsultants.com).</li>
      <li>Create your own master password — we never see it.</li>
      <li>Add each login you want us to have; we confirm in writing what access we hold and why.</li>
    </ol>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">You can see the running list of accounts we hold on your portal&apos;s <strong>Shared Vault</strong> tab.</p>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open your portal</a></p>` : ""}`;
  await send(opts.to, `Setting up your shared password vault`, shell("Your shared password vault", body));
}

/** Tell a client their VA/AM sent a message. The message is included, and
 *  Reply-To is the employee, so the client can answer them straight from email. */
export async function sendClientMessageAlert(opts: { to: string | string[]; from: string; portalUrl: string; replyTo?: string; message?: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.from)}</strong> sent you a message.</p>
    ${opts.message ? `<div style="font-size:15px;line-height:1.6;color:#3a3f38;border-left:3px solid #c2a24a;padding:2px 0 2px 14px;margin:12px 0;white-space:pre-wrap">${esc(opts.message)}</div>` : ""}
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">Just reply to this email to answer ${esc(opts.from)} directly, or open your portal to continue the conversation there.</p>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open your portal</a></p>` : ""}`;
  await send(opts.to, `New message from ${opts.from}`, shell("You have a new message", body), opts.replyTo, opts.from);
}

/** Tell an employee a teammate sent them a DM in the staff portal. Reply-To is
 *  the sender, so they can answer straight from their inbox. */
export async function sendTeammateMessageAlert(opts: { to: string; from: string; portalUrl: string; replyTo?: string; message?: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.from)}</strong> sent you a direct message in the staff portal.</p>
    ${opts.message ? `<div style="font-size:15px;line-height:1.6;color:#3a3f38;border-left:3px solid #c2a24a;padding:2px 0 2px 14px;margin:12px 0;white-space:pre-wrap">${esc(opts.message)}</div>` : ""}
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">Reply to this email to answer ${esc(opts.from)} directly, or open the portal.</p>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open your messages</a></p>` : ""}`;
  await send(opts.to, `New message from ${opts.from}`, shell("You have a new message", body), opts.replyTo, opts.from);
}

/** Welcome a new employee: create-password link, then log in to set up their profile. */
export async function sendEmployeeWelcome(opts: { to: string; name: string | null; actionUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6">Welcome${opts.name ? `, ${opts.name}` : ""} — you&apos;ve been added to the Hill Country Consultants team.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">First, create your password. Then you&apos;ll land on your employee profile to set it up and get to work.</p>
    <p style="margin:22px 0"><a href="${opts.actionUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Create your password</a></p>
    <p style="font-size:13px;color:#6b6552">This link is single-use and expires. If it doesn&apos;t work, ask your administrator to resend it, or use &ldquo;Forgot your password?&rdquo; on the staff login.</p>`;
  await send(opts.to, "Welcome to Hill Country Consultants — create your password", shell("Welcome to the team", body));
}

/** Welcome a new CLIENT after their booking: create-password link into the portal.
 *  Sent via our own Resend sender (reliable) rather than Supabase's invite email. */
export async function sendClientWelcome(opts: { to: string; name: string | null; actionUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6">Welcome${opts.name ? `, ${opts.name}` : ""} — thank you for booking with Hill Country Consultants.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Create your password to open your client portal, where you&apos;ll track your work, share files, and message your team. Your booking confirmation (with your reference number) arrived in a separate email.</p>
    <p style="margin:22px 0"><a href="${opts.actionUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Create your password &amp; open your portal</a></p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38"><strong>What to expect in your first 30 days:</strong></p>
    <ol style="font-size:14px;line-height:1.7;color:#3a3f38;margin:0 0 16px;padding-left:20px">
      <li><strong>This week</strong> — a kickoff call to confirm your priorities and point of contact.</li>
      <li><strong>Days 1–7</strong> — we set up secure access and your onboarding checklist (already waiting in your portal).</li>
      <li><strong>Every Friday</strong> — a weekly report on what we moved.</li>
      <li><strong>Day 30</strong> — a review of what we delivered and what&apos;s next.</li>
    </ol>
    <p style="font-size:13px;color:#6b6552">This link is single-use and expires. If it doesn&apos;t work, use &ldquo;Forgot your password?&rdquo; on the portal login, or reply to this email and we&apos;ll help.</p>`;
  await send(opts.to, "Welcome to Hill Country Consultants — set up your client portal", shell("Welcome — let's get started", body));
}

/** Onboarding check-in drip (day 3 and day 14) to a new client. Sent by the
 *  daily cron; each phase fires once per client. */
export async function sendClientCheckin(opts: { to: string; name: string | null; phase: 3 | 14 }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const hi = opts.name ? `Hi ${esc(opts.name)},` : "Hello,";
  const portal = site ? `<p style="margin:22px 0"><a href="${site}/portal/login" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open your client portal</a></p>` : "";
  if (opts.phase === 3) {
    const body = `<p style="font-size:16px;line-height:1.6">${hi}</p>
      <p style="font-size:15px;line-height:1.6;color:#3a3f38">You&rsquo;re a few days in — a quick check that onboarding is on track. Your portal has an onboarding checklist to work through: confirm your point of contact, share access securely in your vault, and review your first-30-day priorities.</p>
      ${portal}
      <p style="font-size:13px;color:#6b6552">Anything unclear? Reply to this email or call 470-478-1590.</p>`;
    await send(opts.to, "How&rsquo;s your onboarding going?", shell("Checking in", body));
  } else {
    const body = `<p style="font-size:16px;line-height:1.6">${hi}</p>
      <p style="font-size:15px;line-height:1.6;color:#3a3f38">Two weeks in — a midpoint check on your first 30 days. Your weekly report goes out every Friday, and your task board shows what&rsquo;s in progress. If priorities have shifted, tell your team and we&rsquo;ll adjust.</p>
      ${portal}
      <p style="font-size:13px;color:#6b6552">We&rsquo;ll schedule your 30-day review soon. Reply anytime or call 470-478-1590.</p>`;
    await send(opts.to, "Two weeks in — how are we doing?", shell("Midpoint check-in", body));
  }
}

/** Daily ops digest to the team inbox: items needing a manager's attention.
 *  Only sent when there is something to report. */
export async function sendOpsDigest(opts: { items: { n: number; label: string }[] }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const rows = opts.items.map((i) => `<li style="margin:5px 0"><strong>${i.n}</strong> ${esc(i.label)}</li>`).join("");
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">A few things need attention:</p>
    <ul style="font-size:15px;line-height:1.7;color:#3a3f38;margin:0 0 8px;padding-left:20px">${rows}</ul>
    ${site ? `<p style="margin:20px 0"><a href="${site}/staff" style="background:#c2a24a;color:#20241f;font-weight:600;padding:12px 20px;text-decoration:none;display:inline-block">Open your dashboard</a></p>` : ""}
    <p style="font-size:12px;color:#6b6552">Sent once a day when there are open items. Full detail lives on each tab.</p>`;
  await send(to, "Hill Country Consultants — daily ops digest", shell("Daily ops digest", body));
}

/** To a prospect who chose a plan: send the free 30-min strategy-session booking link. */
export async function sendPlanInterestBooking(opts: { to: string; plan: string; bookingUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6">Thanks for your interest in our <strong>${opts.plan}</strong> plan.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Let&apos;s map it out together. Book your <strong>free 30-minute strategy session</strong> and we&apos;ll confirm scope and next steps — in writing — before anything begins.</p>
    <p style="margin:22px 0"><a href="${opts.bookingUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Book your free strategy session</a></p>
    <p style="font-size:13px;color:#6b6552">Prefer to talk now? Reply to this email or call 470-478-1590.</p>`;
  await send(opts.to, `Book your free strategy session — ${opts.plan} plan`, shell("Let's talk about your growth", body));
}

/** Team heads-up that a prospect is interested in a plan. Reply-to reaches the prospect. */
export async function sendPlanInterestAlert(opts: { plan: string; email: string; name: string }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:2px 16px 2px 0;color:#6b6552;white-space:nowrap">${k}</td><td style="padding:2px 0"><strong>${v || "—"}</strong></td></tr>`;
  const body = `
    <p style="font-size:16px;line-height:1.6">New plan interest — <strong>${opts.plan}</strong></p>
    <table style="font-size:14px;line-height:1.6;color:#3a3f38;border-collapse:collapse;margin:8px 0 16px">
      ${row("Name", opts.name)}${row("Email", opts.email)}${row("Plan", opts.plan)}
    </table>
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">They&apos;ve been emailed the free strategy-session booking link. This lead is in your <strong>Pipeline → New lead</strong>.</p>`;
  await send(to, `New ${opts.plan} plan interest · ${opts.name || opts.email}`, shell("New plan interest", body), opts.email || undefined);
}

/** Internal alert to Admin/BM/Sales Manager when a new customer request comes in
 *  from the website (Get Started inquiry or a quote request). Reply-To is the
 *  prospect so a reply reaches them directly. */
export async function sendLeadAlert(opts: {
  to: string | string[]; kind: "Get Started request" | "Quote request";
  business: string; contact: string; email: string; phone: string;
  industry?: string; timeline?: string; message?: string; portalUrl?: string;
}) {
  const row = (k: string, v: string) =>
    v ? `<tr><td style="padding:2px 16px 2px 0;color:#6b6552;white-space:nowrap">${k}</td><td style="padding:2px 0"><strong>${esc(v)}</strong></td></tr>` : "";
  const body = `
    <p style="font-size:16px;line-height:1.6">New <strong>${esc(opts.kind)}</strong> from the website.</p>
    <table style="font-size:14px;line-height:1.6;color:#3a3f38;border-collapse:collapse;margin:8px 0 16px">
      ${row("Business", opts.business)}${row("Contact", opts.contact)}${row("Email", opts.email)}${row("Phone", opts.phone)}${row("Industry", opts.industry || "")}${row("Timeline", opts.timeline || "")}
    </table>
    ${opts.message ? `<div style="font-size:14px;line-height:1.6;color:#3a3f38;border-left:3px solid #c2a24a;padding:2px 0 2px 14px;margin:12px 0;white-space:pre-wrap">${esc(opts.message)}</div>` : ""}
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">It&apos;s on the staff <strong>Dashboard → Customer requests</strong> and in <strong>Pipeline → New lead</strong>.</p>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Open the staff portal</a></p>` : ""}
    <p style="font-size:13px;color:#6b6552">Reply to this email to reach the prospect directly.</p>`;
  await send(opts.to, `New ${opts.kind.toLowerCase()} · ${opts.business || opts.contact || opts.email}`, shell("New customer request", body), opts.email || undefined);
}

/** 4-hour shift alert to the employee and admins. */
export async function sendShiftAlert(opts: { to: string; name: string; hours: number }) {
  const body = `<p style="font-size:16px;line-height:1.6">${opts.name} has been clocked in for <strong>${opts.hours.toFixed(1)} hours</strong>. Shifts over 4 hours are flagged for review.</p>`;
  await send(opts.to, `Shift over 4 hours · ${opts.name}`, shell("Shift alert", body));
}

/** Invite an applicant to schedule an interview via the firm's booking link. */
export async function sendInterviewInvite(opts: { to: string; name: string | null; position?: string | null; link: string }) {
  const hi = opts.name ? `Hi ${esc(opts.name)},` : "Hello,";
  const body = `
    <p style="font-size:16px;line-height:1.6">${hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Thank you for applying to Hill Country Consultants${opts.position ? ` for the <strong>${esc(opts.position)}</strong> role` : ""}. We&rsquo;d like to invite you to an interview.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Please pick a time that works for you:</p>
    <p style="margin:22px 0"><a href="${opts.link}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Schedule your interview</a></p>
    <p style="font-size:13px;color:#6b6552">If the button doesn&rsquo;t work, use this link: <a href="${opts.link}">${esc(opts.link)}</a></p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">We look forward to speaking with you.</p>`;
  await send(opts.to, "Interview invitation · Hill Country Consultants", shell("You&rsquo;re invited to interview", body));
}

/** Politely decline an applicant and let them know we keep résumés on file 6 months. */
export async function sendApplicationDecline(opts: { to: string; name: string | null }) {
  const hi = opts.name ? `Hi ${esc(opts.name)},` : "Hello,";
  const body = `
    <p style="font-size:16px;line-height:1.6">${hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Thank you for your interest in Hill Country Consultants and for taking the time to apply. After careful review, we&rsquo;ve decided to move forward with other candidates at this time.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">We&rsquo;ll keep your résumé on file for six months and will reach out if a role that fits your background opens up. We genuinely appreciate your interest and wish you the very best.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Warmly,<br/>The Hill Country Consultants team</p>`;
  await send(opts.to, "Your application to Hill Country Consultants", shell("Thank you for applying", body));
}
