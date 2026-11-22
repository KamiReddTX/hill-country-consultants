/* DBW News: add each launch-list sign-up to a row in a Google Sheet.

   Netlify runs this after a sign-up passes its spam check. It sends the
   sign-up from Netlify's server to a small Google Apps Script inside the
   Sheet (google-sheet-script.gs, pasted in once), which appends the row. The
   visitor's browser never contacts Google, and every sign-up is also kept in
   Netlify Forms, so if Google is unreachable nothing is lost.

   Environment variables (Netlify > Project configuration > Environment
   variables, scope Functions). Until both are set, this does nothing.
     SHEET_WEBHOOK_URL    the Apps Script web app URL, ending in /exec
     SHEET_WEBHOOK_TOKEN  the same secret that is written into the script */

const SCRIPT_URL = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

function text(v, max) { return String(v == null ? "" : v).trim().slice(0, max); }

export default {
  async formSubmitted(event) {
    const data = event.data || {};
    // Only the launch list; any other form added later is left alone.
    if (data["form-name"] && data["form-name"] !== "launch-list") return;

    const url = Netlify.env.get("SHEET_WEBHOOK_URL") || "";
    const token = Netlify.env.get("SHEET_WEBHOOK_TOKEN") || "";
    if (!SCRIPT_URL.test(url) || token.length < 20) {
      console.log("launch-list: Google Sheet not connected yet; sign-up kept in Netlify only.");
      return;
    }

    const email = text(data.email, 200);
    if (!email) return;
    const interest = data.interest;
    const row = {
      token,
      name: text(data.name, 80),
      email,
      phone: text(data.phone, 30),
      writing: interest === "writing" || (Array.isArray(interest) && interest.includes("writing")),
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      const said = (await res.text()).trim();
      if (!res.ok || said !== "ok") console.log("launch-list: the Sheet did not accept the sign-up (" + res.status + ")");
    } catch (err) {
      console.log("launch-list: could not reach the Sheet; the sign-up is still in Netlify.", String(err));
    }
  },
};
