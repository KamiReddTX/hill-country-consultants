/* DBW News: copy each launch-list sign-up into a Google Form, whose responses
   collect in a Google Sheet.

   Netlify runs this after a sign-up passes its spam check. It posts the
   answers to the Google Form from Netlify's server, so the visitor's browser
   never contacts Google. Every sign-up is also kept in Netlify Forms, so if
   Google is unreachable nothing is lost.

   Set these in Netlify (Project configuration > Environment variables, scope
   Functions). Until GOOGLE_FORM_ACTION is set, this does nothing.
     GOOGLE_FORM_ACTION     https://docs.google.com/forms/d/e/<id>/formResponse
     GOOGLE_FORM_NAME       entry.<number> for the "Name" question
     GOOGLE_FORM_EMAIL      entry.<number> for the "Email" question
     GOOGLE_FORM_INTEREST   entry.<number> for "Write or be featured" (optional) */

const FORM_URL = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/formResponse$/;
const ENTRY = /^entry\.\d+$/;

export default {
  async formSubmitted(event) {
    const data = event.data || {};
    // Only the launch list; any other form added later is left alone.
    if (data["form-name"] && data["form-name"] !== "launch-list") return;

    const action = Netlify.env.get("GOOGLE_FORM_ACTION") || "";
    const nameField = Netlify.env.get("GOOGLE_FORM_NAME") || "";
    const emailField = Netlify.env.get("GOOGLE_FORM_EMAIL") || "";
    const interestField = Netlify.env.get("GOOGLE_FORM_INTEREST") || "";
    if (!FORM_URL.test(action) || !ENTRY.test(emailField)) {
      console.log("launch-list: Google Form not configured; sign-up kept in Netlify only.");
      return;
    }

    const email = String(data.email || "").trim().slice(0, 200);
    if (!email) return;

    const body = new URLSearchParams();
    body.set(emailField, email);
    if (ENTRY.test(nameField)) body.set(nameField, String(data.name || "").trim().slice(0, 80));
    if (ENTRY.test(interestField)) {
      const wants = data.interest === "writing" || (Array.isArray(data.interest) && data.interest.includes("writing"));
      body.set(interestField, wants ? "Yes" : "No");
    }

    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "manual",
      });
      // Google answers a successful response with 200, or a redirect to its thank-you page.
      if (res.status >= 400) console.log("launch-list: Google Form refused the sign-up, status " + res.status);
    } catch (err) {
      console.log("launch-list: could not reach Google Forms; the sign-up is still in Netlify.", String(err));
    }
  },
};
