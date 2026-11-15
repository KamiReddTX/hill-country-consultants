/* DBW News — signing in, creating an account, getting back in.

   Passwords are checked by Supabase Auth, never in this file. A paid level is
   granted by the checkout (Stripe), never by this form: every new account
   starts free, and choosing a paid plan sends her to the checkout.

   Two safety rules carried over from the design:
     · a wrong password and an unknown address get the same answer
     · "send me a link" answers the same way whether or not the address has an
       account — telling a stranger which addresses are registered is a safety
       problem for this readership, not a privacy nicety */
(function (w, d) {
  var A = w.DBWAccount;
  var I = w.DBWIssue;
  var R = (w.DBW_CONFIG && w.DBW_CONFIG.routes) || {};
  var client = A.client;

  function $(id) { return d.getElementById(id); }
  function show(el, on) { el.hidden = !on; }
  function say(el, text) { el.textContent = text || ""; show(el, !!text); }
  function abs(path) { return new URL(path, w.location.href).href; }
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var UNAVAILABLE = "Accounts are unavailable right now. Please try again later.";

  // Only our own pages, so a crafted ?next= cannot send her anywhere else.
  function nextPage() {
    var n = new URLSearchParams(w.location.search).get("next") || "";
    return /^[a-z0-9-]+\.html(#[a-z0-9-]*)?$/i.test(n) ? n : (R.account || "member-profile.html");
  }

  function passwordProblem(pw) {
    if (pw.length < 10) return "Your password needs at least ten characters.";
    if (/^\d+$/.test(pw)) return "Not digits alone. A short phrase you will remember works best.";
    return "";
  }

  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }

  // ---- links --------------------------------------------------------------
  Array.prototype.forEach.call(d.querySelectorAll("[data-route]"), function (el) {
    var r = R[el.getAttribute("data-route")];
    if (typeof r === "string") el.href = r + (el.getAttribute("data-hash") || "");
  });
  if (I && I.earliest()) $("every-issue").textContent = "Every issue, back to " + I.monthName(I.earliest());
  $("back").addEventListener("click", function (e) {
    if (w.history.length > 1 && d.referrer && new URL(d.referrer).origin === w.location.origin) {
      e.preventDefault(); w.history.back();
    }
  });
  A.mountIdentity($("identity"));

  if (new URLSearchParams(w.location.search).get("out")) say($("notice"), "You are signed out on this device.");

  // ---- signing in ---------------------------------------------------------
  var sErr = $("s-err");
  $("signin-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("s-email").value.trim();
    var pass = $("s-pass").value;
    if (!EMAIL.test(email)) { say(sErr, "Enter the email address on your account."); $("s-email").focus(); return; }
    if (!pass) { say(sErr, "Enter your password."); $("s-pass").focus(); return; }
    if (!client) { say(sErr, UNAVAILABLE); return; }
    say(sErr, "");
    var btn = $("s-submit");
    busy(btn, true, "Signing in…");
    A.keepSignedIn($("s-keep").checked);
    client.auth.signInWithPassword({ email: email, password: pass }).then(function (r) {
      if (r.error) {
        busy(btn, false);
        var m = (r.error.message || "").toLowerCase();
        say(sErr, m.indexOf("confirm") >= 0
          ? "Confirm your email first: open the link we sent when you created the account."
          : r.error.status === 429 || m.indexOf("rate") >= 0
            ? "Too many tries. Wait a few minutes and try again."
            : "That email and password do not match an account.");
        return;
      }
      w.location.href = nextPage();
    });
  });

  A.ready.then(function () {
    if (A.signedIn() && !A.inRecovery()) {
      var p = $("already");
      p.textContent = "";
      p.appendChild(d.createTextNode("You are signed in as " + A.displayName() + ". "));
      var a = d.createElement("a");
      a.href = R.account || "member-profile.html";
      a.textContent = "Go to your account";
      p.appendChild(a);
      p.appendChild(d.createTextNode("."));
      show(p, true);
    }
  });

  // ---- getting back in ----------------------------------------------------
  var reset = $("reset"), rsErr = $("rs-err");
  var STAGES = {
    ask: { eyebrow: "No password needed for this part", title: "Getting back in",
      blurb: "Tell us the address on the account and we will send a link that lets you set a new password. No need to remember the old one." },
    sent: { eyebrow: "No password needed for this part", title: "Check your email",
      blurb: "The link works once and expires in an hour. Asking again replaces it, so use the newest one." },
    set: { eyebrow: "One more step", title: "Choose a new password",
      blurb: "Setting a password here signs you in on this device and signs you out everywhere else." }
  };
  function stage(name) {
    show(reset, !!name);
    $("open-reset").setAttribute("aria-expanded", name ? "true" : "false");
    rsErr.textContent = "";
    if (!name) { $("rs-pw").value = ""; return; }
    var s = STAGES[name];
    $("rs-eyebrow").textContent = s.eyebrow;
    $("rs-title").textContent = s.title;
    $("rs-blurb").textContent = s.blurb;
    show($("rs-ask"), name === "ask");
    show($("rs-sent"), name === "sent");
    show($("rs-set"), name === "set");
    $("rs-title").focus();
  }

  $("open-reset").addEventListener("click", function () {
    $("rs-email").value = $("s-email").value.trim();
    stage("ask");
  });
  Array.prototype.forEach.call(d.querySelectorAll("[data-rs-close]"), function (b) {
    b.addEventListener("click", function () {
      if (A.inRecovery()) A.endRecovery();
      stage(null);
      $("open-reset").focus();
    });
  });

  $("rs-send").addEventListener("click", function () {
    var email = $("rs-email").value.trim();
    if (!EMAIL.test(email)) { rsErr.textContent = "That does not look like an email address."; return; }
    if (!client) { rsErr.textContent = UNAVAILABLE; return; }
    var btn = this;
    busy(btn, true, "Sending…");
    client.auth.resetPasswordForEmail(email, { redirectTo: abs((R.signIn || "sign-in.html") + "?reset=1") })
      .then(function (r) {
        busy(btn, false);
        // Only a rate limit is reported; anything else would hint at whether
        // the address has an account.
        if (r.error && r.error.status === 429) { rsErr.textContent = "Too many requests. Wait a few minutes and ask again."; return; }
        $("rs-said").textContent = "If there is an account on that address, a link is on its way. It works once and expires in an hour.";
        stage("sent");
      });
  });

  $("rs-save").addEventListener("click", function () {
    var pw = $("rs-pw").value;
    var problem = passwordProblem(pw);
    if (problem) { rsErr.textContent = problem; return; }
    var btn = this;
    busy(btn, true, "Saving…");
    client.auth.updateUser({ password: pw }).then(function (r) {
      if (r.error) {
        busy(btn, false);
        rsErr.textContent = /same|different/i.test(r.error.message || "")
          ? "Choose a password you have not used on this account before."
          : "That link has expired or was already used. Ask for a new one.";
        return;
      }
      // "Signs you out everywhere else": end every other session.
      client.auth.signOut({ scope: "others" }).finally(function () {
        A.endRecovery();
        w.location.href = nextPage();
      });
    });
  });

  // The reset panel sits inside the sign-in form; Enter there means the
  // panel's own button, not "Sign in".
  [["rs-email", "rs-send"], ["rs-pw", "rs-save"]].forEach(function (pair) {
    $(pair[0]).addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $(pair[1]).click(); }
    });
  });

  // Arriving from the emailed link.
  A.ready.then(function () { if (A.inRecovery()) stage("set"); });

  // ---- the $27 upgrade ----------------------------------------------------
  function paintUpgrade() {
    if (w.location.hash !== "#upgrade-27") { show($("upgrade"), false); return; }
    var e = A.effective();
    var p = A.profile();
    var term = p && p.term_ends
      ? new Date(p.term_ends).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "the end of your term";
    var up = !A.signedIn()
      ? { tag: "Adding the site to print", title: "Sign in first", body: "The $27 upgrade applies to an existing print subscription. Sign in below and come back to this link, or create a print and online account." }
      : e.site
        ? { tag: "Nothing to pay", title: "You already read the site", body: "Your level already carries the site, so there is nothing to add and nothing to pay. Every issue is open to you in the archive." }
        : e.print
          ? { tag: "You subscribe in print", title: "Add the site for $27", can: true, body: "Print and online is $15 a month or $150 a year. You are on print at $12 a month, $120 a year, so the difference is $30 — and your ten percent subscriber discount comes off it, making it $27. It opens every subscriber story, every back issue, and each new issue online a week before your copy is posted." }
          : { tag: "Adding the site to print", title: "This offer is for print subscribers", body: "The $27 upgrade is the difference between a print subscription and everything. Your account is not on print, so the plans below are the ones that apply to you." };
    $("up-tag").textContent = up.tag;
    $("up-title").textContent = up.title;
    $("up-body").textContent = up.body;
    $("up-term").textContent = term;
    show($("up-do"), !!up.can);
    show($("upgrade"), true);
  }
  A.ready.then(paintUpgrade);
  A.onChange(paintUpgrade);
  w.addEventListener("hashchange", paintUpgrade);

  // ---- creating an account ------------------------------------------------
  var cErr = $("c-err");
  function plan() {
    var v = $("c-plan").value.split(":");
    return { tier: v[0], cadence: v[1] || "", t: A.TIERS[v[0]] || A.TIERS.free };
  }
  function paintPlan() {
    var p = plan();
    $("plan-note").textContent = p.tier === "free"
      ? "A free account is enough for the Community, your saved reading and the stories the editor opens to everyone."
      : "Creating the account takes you to the checkout, where the card is taken and a receipt is written. You can change level, or move up to VIP, from your account at any time.";
    show($("addr-field"), p.t.print);
    show($("vip-note"), p.tier === "vip");
  }
  $("c-plan").addEventListener("change", function () { say(cErr, ""); paintPlan(); });

  // Shop and Membership send her here with the plan she picked.
  var FROM = {
    "#create-online": "online:annual", "#create-print": "print:annual",
    "#create-everything": "everything:annual", "#create-vip": "vip:annual",
    "#create-business": "business:annual"
  };
  if (FROM[w.location.hash]) $("c-plan").value = FROM[w.location.hash];
  if (/^#create/.test(w.location.hash)) A.ready.then(function () { $("create").focus(); });
  paintPlan();

  $("create-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("c-name").value.trim();
    var email = $("c-email").value.trim();
    var pass = $("c-pass").value;
    var addr = $("c-addr").value.trim();
    var p = plan();
    var fail = function (msg, el) { say(cErr, msg); if (el) el.focus(); };
    if (!name) return fail("Tell us your name first.", $("c-name"));
    if (!EMAIL.test(email)) return fail("That email address does not look right.", $("c-email"));
    var problem = passwordProblem(pass);
    if (problem) return fail(problem, $("c-pass"));
    if (p.t.print && !addr) return fail("A print subscription needs a mailing address.", $("c-addr"));
    if (!$("c-age").checked) return fail("Please confirm your age before creating an account.", $("c-age"));
    if (!$("c-terms").checked) return fail("Please accept the terms of use, privacy policy and community rules.", $("c-terms"));
    if (!client) return fail(UNAVAILABLE);
    say(cErr, "");

    var paid = p.tier !== "free";
    var after = paid && R.checkout ? R.checkout(p.tier, p.cadence) : nextPage();
    var btn = $("c-submit");
    busy(btn, true, "Creating your account…");
    A.keepSignedIn(true);
    client.auth.signUp({
      email: email,
      password: pass,
      options: {
        emailRedirectTo: abs(after),
        data: {
          display_name: name,
          mailing_address: p.t.print ? addr : "",
          email_list: $("c-news").checked,
          terms_accepted: true
        }
      }
    }).then(function (r) {
      busy(btn, false);
      if (r.error) {
        var m = (r.error.message || "").toLowerCase();
        return fail(r.error.status === 429 || m.indexOf("rate") >= 0
          ? "Too many tries. Wait a few minutes and try again."
          : m.indexOf("password") >= 0
            ? "Choose a stronger password: a short phrase of ten or more characters."
            : "We could not create the account. Check the details and try again.");
      }
      // Signed straight in (email confirmation off): carry on.
      if (r.data && r.data.session) {
        if (paid) { w.location.href = after; return; }
        return done("You are in", "Your account is open at Free account.", true);
      }
      // Confirmation on. Supabase answers the same way for an address that
      // already has an account, so this message must not say otherwise.
      done("Check your email",
        "We sent a link to " + email + ". Open it to confirm the address" +
        (paid ? ", and it takes you straight to the checkout for your subscription." : " and your account opens.") +
        " If you already have an account, sign in on the left instead.", false);
    });

    function done(title, body, links) {
      show($("create-form"), false);
      $("c-done-title").textContent = title;
      var b = $("c-done-body");
      b.textContent = body + " ";
      if (links) {
        var c = d.createElement("a"); c.href = R.community || "community.html"; c.textContent = "Go to the Community";
        var m = d.createElement("a"); m.href = R.account || "member-profile.html"; m.textContent = "open your account";
        b.appendChild(c); b.appendChild(d.createTextNode(" or ")); b.appendChild(m); b.appendChild(d.createTextNode("."));
      }
      show($("c-done"), true);
      $("c-done").setAttribute("tabindex", "-1");
      $("c-done").focus();
    }
  });
})(window, document);
