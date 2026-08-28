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
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Your account is <strong>in review</strong>. We acknowledge every booking the same business day and confirm scope and next steps within <strong>two business days</strong>.</p>
    <p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Access your client portal</a></p>
    <p style="font-size:13px;line-height:1.6;color:#6b6552"><strong style="color:#20241f">All sales are final — no refunds.</strong> By completing this purchase you accepted our <a href="https://www.hillcountryconsultants.com/refund-policy" style="color:#3a5a40">Refund &amp; Cancellation Policy</a> and <a href="https://www.hillcountryconsultants.com/terms" style="color:#3a5a40">Terms of Service</a>. Charges appear as <strong>Hill Country Consultants</strong>. If anything isn&apos;t right, contact us first at <a href="mailto:info@hillcountryconsultants.com" style="color:#3a5a40">info@hillcountryconsultants.com</a> — we make it right if we ever fall short.</p>`;
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

/** Confirmation to the applicant after they submit an application. */
export async function sendApplicantConfirmation(opts: { to: string; name: string | null; position: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6">Thank you${opts.name ? `, ${esc(opts.name)}` : ""} — we&rsquo;ve received your application${opts.position ? ` for the <strong>${esc(opts.position)}</strong> role` : ""}.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Please allow us some time to review it. If we&rsquo;re interested in moving forward, a member of our team will contact you at this email address. Not hearing from us right away doesn&rsquo;t mean no &mdash; we review every application carefully.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Your application will stay on file with us for <strong>six months</strong>, so we can also consider you for future openings.</p>
    <p style="font-size:14px;line-height:1.6;color:#6b6552">Thank you for your interest in Hill Country Consultants.</p>`;
  await send(opts.to, "We received your application &mdash; Hill Country Consultants", shell("Thank you for applying", body));
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

/** Invite the client to set up the shared password vault with their account team.
 *  The real credential share comes from our password manager as a SEPARATE invite;
 *  this email is the heads-up. If `shareLink` is provided, it's the direct accept
 *  link from that tool. The portal is only the read-only record, linked secondarily. */
export async function sendVaultInvite(opts: { to: string; from: string; portalUrl: string; shareLink?: string; managerName?: string }) {
  const pm = opts.managerName ? esc(opts.managerName) : "our password manager";
  const link = (opts.shareLink || "").trim();
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.from)}</strong> is setting up secure credential sharing so we can work on your behalf.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Your logins live in an <strong>encrypted password manager</strong> — never in an email, and never on a web page. ${link ? `Use the button below to accept the ${pm} share.` : `A separate invitation from <strong>${pm}</strong> is on its way to this address — that email is where you accept access.`}</p>
    ${link ? `<p style="margin:22px 0"><a href="${esc(link)}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Accept the vault share</a></p>` : ""}
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">What to do:</p>
    <ol style="font-size:15px;line-height:1.7;color:#3a3f38">
      <li>${link ? `Accept the share above` : `Accept the ${pm} invitation when it arrives`} and create your own master password — we never see it.</li>
      <li>Add each login you want us to have. We confirm in writing what access we hold and why.</li>
      <li>At offboarding, access is returned or revoked the same day and the share is deleted.</li>
    </ol>
    <p style="font-size:14px;line-height:1.6;color:#6b7167">Heads up: passwords are <strong>only</strong> exchanged inside ${pm}. Your portal's <strong>Shared Vault</strong> tab is just a running record of which accounts we hold and why — it has no password fields.${opts.portalUrl ? ` <a href="${opts.portalUrl}" style="color:#3a5a40">See the record →</a>` : ""}</p>`;
  await send(opts.to, `Your secure credential share — accept the ${opts.managerName ? esc(opts.managerName) : "password-manager"} invite`, shell("Secure credential sharing", body));
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

/** Password-reset / set-a-new-password link for a client or employee portal.
 *  Sent via our own Resend sender with a server-readable token_hash link so it
 *  reliably lands on the set-password screen (not the login page). */
export async function sendPasswordResetLink(opts: { to: string; name: string | null; actionUrl: string; portal: "client" | "staff" }) {
  const which = opts.portal === "staff" ? "employee" : "client";
  const body = `
    <p style="font-size:16px;line-height:1.6">Hi${opts.name ? ` ${esc(opts.name)}` : ""},</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Use the button below to set a new password for your ${which} portal. The link is single-use and expires shortly.</p>
    <p style="margin:22px 0"><a href="${esc(opts.actionUrl)}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">Set your password</a></p>
    <p style="font-size:13px;color:#6b6552">If you didn&apos;t request this, you can ignore this email — your current password stays unchanged.</p>`;
  await send(opts.to, `Set a new password for your ${which} portal`, shell("Reset your password", body));
}

/** Tell a client one or more files/documents are ready in their portal. Sent
 *  when staff upload a file or attach a collaborative Google Doc. `editable`
 *  flips the wording toward "open & edit". Accepts one or many recipients. */
export async function sendClientFileReady(opts: { to: string | string[]; name: string | null; label: string; count?: number; editable?: boolean; portalUrl: string }) {
  const hi = opts.name ? `Hi ${esc(opts.name)},` : "Hello,";
  const many = (opts.count || 1) > 1;
  const what = opts.editable
    ? `a document to review and edit — <strong>${esc(opts.label)}</strong>`
    : many ? `${opts.count} new files are ready in your portal` : `a new file is ready in your portal — <strong>${esc(opts.label)}</strong>`;
  const cta = opts.editable ? "Open in your portal" : "Open your files";
  const body = `
    <p style="font-size:16px;line-height:1.6">${hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Your account team just shared ${what}. ${opts.editable ? "You can open it in Google Docs to answer questions or make edits directly." : "You can open or download it any time from your portal&apos;s Files tab."}</p>
    ${opts.portalUrl ? `<p style="margin:22px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:14px 22px;text-decoration:none;display:inline-block">${cta}</a></p>` : ""}
    <p style="font-size:13px;color:#6b6552">Only you, your account team, and administrators can see items in your portal.</p>`;
  await send(opts.to, opts.editable ? "A document to review in your portal" : many ? "New files in your portal" : "A new file in your portal", shell(opts.editable ? "Document ready to review" : "Files ready", body));
}

/** Hand-off email to a PREFERRED VENDOR: we've assigned them part of a client's
 *  services. Reply-To is the assigning staffer so the vendor can coordinate. */
export async function sendVendorAssignment(opts: { to: string; vendorName: string; clientName: string; scope?: string | null; note?: string | null; fromName?: string | null; replyTo?: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6">Hi${opts.vendorName ? ` ${esc(opts.vendorName)}` : ""},</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Hill Country Consultants would like to bring you in on part of our work for <strong>${esc(opts.clientName)}</strong>.</p>
    ${opts.scope ? `<p style="font-size:15px;line-height:1.6;color:#3a3f38"><strong>Scope:</strong> ${esc(opts.scope)}</p>` : ""}
    ${opts.note ? `<p style="font-size:15px;line-height:1.6;color:#3a3f38"><strong>Details:</strong> ${esc(opts.note)}</p>` : ""}
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Reply to this email to coordinate next steps${opts.fromName ? ` with ${esc(opts.fromName)}` : ""}. Thank you for partnering with us.</p>`;
  await send(opts.to, `Assignment from Hill Country Consultants — ${opts.clientName}`, shell("New assignment", body), opts.replyTo, "Hill Country Consultants");
}

/** Alert the team inbox that an employee referred a vendor for managers to action. */
export async function sendVendorReferralAlert(opts: { vendorLabel: string; referredBy: string | null; clientName?: string | null; note?: string | null }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL || "info@hillcountryconsultants.com";
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.referredBy || "An employee")}</strong> referred a vendor for review.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38"><strong>Vendor:</strong> ${esc(opts.vendorLabel)}${opts.clientName ? ` · <strong>For client:</strong> ${esc(opts.clientName)}` : ""}</p>
    ${opts.note ? `<p style="font-size:15px;line-height:1.6;color:#3a3f38">${esc(opts.note)}</p>` : ""}
    <p style="font-size:13px;color:#6b6552">Review it on the Preferred vendors tab in the employee portal.</p>`;
  await send(to, `Vendor referral — ${opts.vendorLabel}`, shell("New vendor referral", body));
}

/** Alert the account owner + sales inbox that a client requested an upgrade/add-on. */
export async function sendServiceUpgradeRequest(opts: { to: string | string[]; clientName: string; label: string; note?: string | null; portalUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.clientName)}</strong> is interested in an upgrade.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38"><strong>Requested:</strong> ${esc(opts.label)}</p>
    ${opts.note ? `<p style="font-size:15px;line-height:1.6;color:#3a3f38">${esc(opts.note)}</p>` : ""}
    <p style="font-size:14px;line-height:1.6;color:#3a3f38">Follow up with them to scope it and, if it&rsquo;s a plan change, update their tier.</p>
    ${opts.portalUrl ? `<p style="margin:20px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:12px 20px;text-decoration:none;display:inline-block">Open the dashboard</a></p>` : ""}`;
  await send(opts.to, `Upgrade interest — ${opts.clientName}: ${opts.label}`, shell("Service upgrade request", body));
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

/** A client marked their kickoff call scheduled — tell the owner + managers to
 *  find the appointment and add the right staff to the invite. */
export async function sendKickoffScheduledAlert(opts: { to: string | string[]; clientName: string; portalUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.clientName)}</strong> just scheduled their kickoff call.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">It will appear on the Google Calendar. Open the appointment and <strong>add the necessary staff</strong> to the invite (account owner + any service specialists), then mark it handled on your dashboard.</p>
    ${opts.portalUrl ? `<p style="margin:20px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:12px 20px;text-decoration:none;display:inline-block">Open your dashboard</a></p>` : ""}`;
  await send(opts.to, `Kickoff scheduled · ${opts.clientName}`, shell("Kickoff call scheduled", body));
}

/** A client booked an appointment (detected from Google Calendar) — tell the
 *  owner + managers to add the right staff to the invite. */
export async function sendAppointmentAlert(opts: { to: string | string[]; clientName: string; summary: string; whenText: string; portalUrl: string }) {
  const body = `
    <p style="font-size:16px;line-height:1.6"><strong>${esc(opts.clientName)}</strong> has an appointment: <strong>${esc(opts.summary || "Appointment")}</strong>${opts.whenText ? ` — ${esc(opts.whenText)}` : ""}.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">It&rsquo;s on the calendar. Add the necessary staff (account owner + any specialists) to the invite, then mark it handled on your dashboard.</p>
    ${opts.portalUrl ? `<p style="margin:20px 0"><a href="${opts.portalUrl}" style="background:#c2a24a;color:#20241f;font-weight:600;padding:12px 20px;text-decoration:none;display:inline-block">Open your dashboard</a></p>` : ""}`;
  await send(opts.to, `Appointment booked · ${opts.clientName}`, shell("Appointment booked", body));
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

/** Internal alert to Admin/BM/Accounts Manager when a new customer request comes in
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
export async function sendInterviewInvite(opts: { to: string; name: string | null; position?: string | null; link: string; note?: string | null }) {
  const hi = opts.name ? `Hi ${esc(opts.name)},` : "Hello,";
  const noteHtml = opts.note && opts.note.trim() ? `<p style="font-size:15px;line-height:1.6;color:#3a3f38;white-space:pre-line">${esc(opts.note.trim())}</p>` : "";
  const body = `
    <p style="font-size:16px;line-height:1.6">${hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Thank you for applying to Hill Country Consultants${opts.position ? ` for the <strong>${esc(opts.position)}</strong> role` : ""}. We&rsquo;d like to invite you to an interview.</p>
    ${noteHtml}
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

/** Offer / hiring letter to a successful applicant. Optional note carries the
 *  specific offer details the manager types in. */
export async function sendHiringLetter(opts: { to: string; name: string | null; position?: string | null; note?: string | null }) {
  const hi = opts.name ? `Dear ${esc(opts.name)},` : "Hello,";
  const noteHtml = opts.note && opts.note.trim() ? `<p style="font-size:15px;line-height:1.6;color:#3a3f38;white-space:pre-line">${esc(opts.note.trim())}</p>` : "";
  const body = `
    <p style="font-size:16px;line-height:1.6">${hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Congratulations! We&rsquo;re delighted to offer you a position${opts.position ? ` as <strong>${esc(opts.position)}</strong>` : ""} with Hill Country Consultants. Your background stood out, and we believe you&rsquo;ll be a strong addition to our team.</p>
    ${noteHtml}
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">A member of our team will follow up with your formal offer details, start date, and onboarding steps. If you have any questions in the meantime, simply reply to this email.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38"><strong>Please look out for a separate email</strong> inviting you to set up your access to our team portal — that&rsquo;s where your onboarding, tasks, and schedule will live.</p>
    <p style="font-size:15px;line-height:1.6;color:#3a3f38">Welcome aboard,<br/>The Hill Country Consultants team</p>`;
  await send(opts.to, "Your offer from Hill Country Consultants", shell("Welcome to the team", body));
}
