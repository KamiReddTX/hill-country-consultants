import { Resend } from "resend";

const from = process.env.EMAIL_FROM || "Hill Country Consultants <info@hillcountryconsultants.com>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function send(to: string, subject: string, html: string, replyTo?: string) {
  const resend = client();
  if (!resend) { console.warn("[email] RESEND_API_KEY not set — skipped:", subject); return; }
  await resend.emails.send({ from, to, subject, html, replyTo: replyTo || process.env.EMAIL_REPLY_TO } as any);
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

/** 4-hour shift alert to the employee and admins. */
export async function sendShiftAlert(opts: { to: string; name: string; hours: number }) {
  const body = `<p style="font-size:16px;line-height:1.6">${opts.name} has been clocked in for <strong>${opts.hours.toFixed(1)} hours</strong>. Shifts over 4 hours are flagged for review.</p>`;
  await send(opts.to, `Shift over 4 hours · ${opts.name}`, shell("Shift alert", body));
}
