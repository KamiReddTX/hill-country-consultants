import { Resend } from "resend";

const from = process.env.EMAIL_FROM || "Hill Country Consultants <info@hillcountryconsultants.com>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function send(to: string, subject: string, html: string) {
  const resend = client();
  if (!resend) { console.warn("[email] RESEND_API_KEY not set — skipped:", subject); return; }
  await resend.emails.send({ from, to, subject, html, replyTo: process.env.EMAIL_REPLY_TO } as any);
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
