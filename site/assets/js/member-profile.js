/* DBW News — her account.

   Reads her own profile (row-level security returns no one else's) and lets
   her change her name, mailing address, email-list choice, sign-in email and
   password. Her level is shown, never edited: only the checkout sets it. */
(function (w, d) {
  var A = w.DBWAccount;
  var I = w.DBWIssue;
  var R = (w.DBW_CONFIG && w.DBW_CONFIG.routes) || {};
  var client = A.client;

  function $(id) { return d.getElementById(id); }
  function show(el, on) { el.hidden = !on; }
  function say(el, text) { el.textContent = text || ""; show(el, !!text); }
  function longDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  if (!client) { show($("acct-loading"), false); show($("acct-off"), true); return; }

  // ---- tabs ---------------------------------------------------------------
  var tabs = [$("tab-sub"), $("tab-set")];
  function pick(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      show($(t.getAttribute("aria-controls")), on);
    });
    if (focus) tab.focus();
    try { w.history.replaceState(null, "", tab.id === "tab-set" ? "#settings" : "#subscription"); } catch (e) {}
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { pick(t); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); pick(tabs[(i + 1) % tabs.length], true); }
    });
  });
  if (w.location.hash === "#settings") pick(tabs[1]);

  // ---- render -------------------------------------------------------------
  function render() {
    if (!A.signedIn()) {
      w.location.replace((R.signIn || "sign-in.html") + "?next=" + encodeURIComponent("member-profile.html"));
      return;
    }
    var p = A.profile() || {};
    var t = A.effective();
    var paid = t.badge !== "Free";
    var name = A.displayName();

    show($("acct-loading"), false);
    show($("acct"), true);

    $("initials").textContent = name.trim().split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0).toUpperCase(); }).join("") || "R";
    $("name").textContent = name;
    var badge = $("tier-badge");
    badge.textContent = t.label;
    badge.className = "badge-tier badge-tier--" + t.badge.toLowerCase();
    $("since").textContent = p.created_at ? "Reading since " + new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
    $("email").textContent = A.email();
    $("disc").textContent = paid ? "10%" : "—";
    $("disc-note").textContent = paid ? "Off issues, the shop, tickets and classes" : "Comes with any subscription";

    // The subscription card
    var lapsedEnd = p.cancelled && p.term_ends;
    $("sub-state").textContent = !paid ? "No charge" : p.paused ? "Paused" : p.cancelled ? "Ends " + longDate(p.term_ends) : "Active";
    $("sub-state").className = "state" + (paid && !p.cancelled && !p.paused ? " state--on" : "");
    $("plan-name").textContent = t.label;
    $("plan-line").textContent = !paid
      ? "The community, your saved reading and the stories the editor opens to everyone. Every story opens to you a year after it ran."
      : (t.monthly ? t.monthly + " a month, or " + t.price + " a year. " : t.price + " a year. ") +
        (t.site && t.print ? "The site and the printed magazine." : t.site ? "Every subscriber story and every issue online." : "Twelve issues mailed to you. Site access is not included.");
    var next = I ? I.ISSUES.filter(function (x) { return !I.isOnline(x.ym); })[0] : null;
    $("next-issue").textContent = next ? I.monthName(next.ym) + (t.site ? ", online " + I.dayLabel(next.ym, I.ONLINE_DAY) : t.print ? ", posted " + I.dayLabel(next.ym, I.MAIL_DAY) : "") : "Announced soon";
    $("renew-label").textContent = lapsedEnd ? "Access ends" : "Renews";
    $("renew-value").textContent = !paid ? "Nothing to renew" : p.term_ends ? longDate(p.term_ends) : "—";
    $("mail-to").textContent = t.print ? (p.mailing_address || "No address yet — add one in Settings") : "Nothing is mailed";

    // Moving up
    var up = null;
    if (t.key === "print") up = { tag: "You subscribe in print", title: "Add the site for $27", line: "Every subscriber story, every back issue, and each new issue online a week before your copy is posted. The $27 is the $30 difference to Everything with your ten percent off, and your renewal date does not move.", cta: "Add the site · $27", href: (R.signIn || "sign-in.html") + "#upgrade-27" };
    else if (t.key === "online") up = { tag: "Want it in print too?", title: "Everything: the site and the magazine", line: "Everything is $15 a month or $150 a year, and adds twelve printed issues mailed to you.", cta: "See the subscription", href: R.subscribe || "shop.html" };
    else if (t.key === "everything") up = { tag: "VIP membership", title: "A profile in The Community, and less for every event", line: "VIP is $250 a year: free online events, 35 percent off in person, two seats on every booking and a card in the directory.", cta: "See the memberships", href: R.subscribe || "shop.html" };
    show($("upgrade-card"), !!up);
    if (up) {
      $("up-tag").textContent = up.tag; $("up-title").textContent = up.title; $("up-line").textContent = up.line;
      $("up-cta").textContent = up.cta; $("up-cta").href = up.href;
    }
    show($("join-card"), !paid);
    show($("cancel-card"), paid);

    // What it opens
    var rows = [
      ["The Community, comments and saved reading", true],
      ["Every story a year after it ran, and every letter", true],
      ["Every subscriber story, as it runs", t.site],
      ["Every issue online, page by page", t.site],
      ["Twelve printed issues, mailed", t.print],
      ["10% off the shop, tickets and classes", paid],
      ["A VIP profile and free online events", t.vip]
    ];
    var ul = $("access"); ul.textContent = "";
    rows.forEach(function (r) {
      var li = d.createElement("li");
      li.className = r[1] ? "on" : "off";
      var mark = d.createElement("span"); mark.className = "access__mark"; mark.setAttribute("aria-hidden", "true"); mark.textContent = r[1] ? "✓" : "—";
      var sr = d.createElement("span"); sr.className = "visually-hidden"; sr.textContent = r[1] ? "Included: " : "Not included: ";
      li.appendChild(mark); li.appendChild(sr); li.appendChild(d.createTextNode(r[0]));
      ul.appendChild(li);
    });

    // Settings (only fill the fields the first time, so typing is not undone)
    if (!render.filled) {
      $("f-name").value = p.display_name || "";
      $("f-addr").value = p.mailing_address || "";
      $("f-news").checked = !!p.email_list;
      $("f-email").value = A.email();
      render.filled = true;
    }
    show($("f-addr-wrap"), t.print || !!p.mailing_address);
    show($("addr-hint"), t.print);
  }

  A.ready.then(function () { return I ? I.refresh() : null; }).then(render);
  A.onChange(render);

  // ---- saving -------------------------------------------------------------
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }

  $("settings").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("f-name").value.trim();
    if (!name) { say($("set-err"), "Tell us the name to show."); $("f-name").focus(); return; }
    if (A.effective().print && !$("f-addr").value.trim()) { say($("set-err"), "A print subscription needs a mailing address."); $("f-addr").focus(); return; }
    say($("set-err"), "");
    var btn = $("save"); busy(btn, true, "Saving…");
    // Her own row, by her user id; row-level security refuses any other.
    client.auth.getUser().then(function (u) {
      var uid = u.data && u.data.user ? u.data.user.id : null;
      if (!uid) return { error: true };
      return client.from("profiles").update({
        display_name: name,
        mailing_address: $("f-addr").value.trim(),
        email_list: $("f-news").checked
      }).eq("id", uid);
    }).then(function (r) {
      busy(btn, false);
      if (r && r.error) { say($("set-err"), "That did not save. Try again in a moment."); return; }
      $("saved-note").textContent = "Saved at " + new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      A.reload();
    });
  });

  $("email-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("f-email").value.trim();
    say($("email-said"), "");
    if (!EMAIL.test(email)) { say($("email-err"), "That email address does not look right."); return; }
    if (email.toLowerCase() === A.email().toLowerCase()) { say($("email-err"), "That is already your sign-in email."); return; }
    say($("email-err"), "");
    var btn = $("email-save"); busy(btn, true, "Sending…");
    client.auth.updateUser({ email: email }, { emailRedirectTo: new URL("member-profile.html#settings", w.location.href).href }).then(function (r) {
      busy(btn, false);
      if (r.error) { say($("email-err"), r.error.status === 429 ? "Too many requests. Wait a few minutes." : "We could not change it. Check the address and try again."); return; }
      say($("email-said"), "We sent a confirmation link to " + email + ". The change takes effect when you open it; until then, sign in with your current address.");
    });
  });

  $("pw-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = $("f-pw").value;
    say($("pw-said"), "");
    if (pw.length < 10) { say($("pw-err"), "Ten characters at least."); return; }
    if (/^\d+$/.test(pw)) { say($("pw-err"), "Not digits alone. A short phrase you will remember works best."); return; }
    say($("pw-err"), "");
    var btn = $("pw-save"); busy(btn, true, "Saving…");
    client.auth.updateUser({ password: pw }).then(function (r) {
      busy(btn, false);
      if (r.error) {
        say($("pw-err"), /same|different/i.test(r.error.message || "") ? "Choose a password you have not used on this account before." :
          /reauth|recent/i.test(r.error.message || "") ? "For safety, sign out and back in, then change it." : "That did not save. Try again in a moment.");
        return;
      }
      $("f-pw").value = "";
      client.auth.signOut({ scope: "others" });
      say($("pw-said"), "Password changed. You stay signed in here, and every other device is signed out.");
    });
  });

  function out(scope) {
    client.auth.signOut(scope ? { scope: scope } : undefined).then(function () {
      w.location.href = (R.signIn || "sign-in.html") + "?out=1";
    });
  }
  $("out-here").addEventListener("click", function () { out(); });
  $("out-all").addEventListener("click", function () { out("global"); });
})(window, document);
