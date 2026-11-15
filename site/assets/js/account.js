/* DBW News — who is reading, from Supabase.

   The browser only uses this to decide what to SHOW. What a reader can
   actually open (the printed pages, and later subscriber stories) is enforced
   by row-level security in the database, so editing this file or local
   storage grants nothing.

   window.DBWAccount:
     ready              Promise, resolves once the session and profile are read
     client             the Supabase client, or null when not configured
     signedIn()         boolean
     effective()        the level that applies today (see TIERS)
     profile()          her profile row, or null
     email()            her sign-in address, or ""
     displayName()      her name, or "Reader"
     inRecovery()       true when she arrived from a password-reset link
     keepSignedIn(bool) remember this device (true) or only this tab (false)
     signOut()          Promise
     onChange(fn)       called after sign-in, sign-out or a profile change
     mountIdentity(el)  renders the top-bar sign-in / name / sign-out strip */
(function (w, d) {
  // The six levels. `site` is website access; print alone does not carry it.
  var TIERS = {
    free:       { key: "free",       label: "Free account",        badge: "Free", price: null,   monthly: null,  site: false, print: false, vip: false, business: false },
    online:     { key: "online",     label: "Online",              badge: "Paid", price: "$50",  monthly: "$5",  site: true,  print: false, vip: false, business: false },
    print:      { key: "print",      label: "In print",            badge: "Paid", price: "$120", monthly: "$12", site: false, print: true,  vip: false, business: false },
    everything: { key: "everything", label: "Everything",          badge: "Paid", price: "$150", monthly: "$15", site: true,  print: true,  vip: false, business: false },
    vip:        { key: "vip",        label: "VIP",                 badge: "VIP",  price: "$250", monthly: null,  site: true,  print: true,  vip: true,  business: false },
    business:   { key: "business",   label: "Business Membership", badge: "Paid", price: "$350", monthly: null,  site: true,  print: true,  vip: false, business: true }
  };

  var cfg = w.DBW_CONFIG || {};
  var routes = cfg.routes || {};

  // ---- "Keep me signed in" ------------------------------------------------
  // Kept: the session lives in localStorage and survives closing the browser.
  // Not kept: it lives in sessionStorage and ends with the tab.
  var SESSION_ONLY = "dbwSessionOnly";
  function sessionOnly() { try { return !!w.localStorage.getItem(SESSION_ONLY); } catch (e) { return false; } }
  var storage = {
    getItem: function (k) {
      try { var v = w.localStorage.getItem(k); return v != null ? v : w.sessionStorage.getItem(k); } catch (e) { return null; }
    },
    setItem: function (k, v) {
      try {
        var keep = !sessionOnly();
        (keep ? w.localStorage : w.sessionStorage).setItem(k, v);
        (keep ? w.sessionStorage : w.localStorage).removeItem(k);
      } catch (e) {}
    },
    removeItem: function (k) {
      try { w.localStorage.removeItem(k); w.sessionStorage.removeItem(k); } catch (e) {}
    }
  };
  function keepSignedIn(keep) {
    try { if (keep) w.localStorage.removeItem(SESSION_ONLY); else w.localStorage.setItem(SESSION_ONLY, "1"); } catch (e) {}
  }

  var client = null;
  if (cfg.supabaseUrl && cfg.supabaseKey && w.supabase && w.supabase.createClient) {
    client = w.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { storage: storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  var state = { user: null, profile: null, recovery: false };
  var listeners = [];

  function load() {
    if (!client) return Promise.resolve();
    return client.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      state.user = session ? session.user : null;
      if (!state.user) { state.profile = null; return; }
      return client.from("profiles")
        .select("display_name, tier, paused, cancelled, term_ends, mailing_address, email_list, created_at")
        .eq("id", state.user.id)
        .maybeSingle()
        .then(function (r) { state.profile = r.error ? null : r.data; });
    }).catch(function () { state.user = null; state.profile = null; });
  }

  function notify() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  if (client) {
    // Registered before the first getSession, so the PASSWORD_RECOVERY event
    // raised while the reset link is read from the URL is not missed.
    client.auth.onAuthStateChange(function (event) {
      if (event === "PASSWORD_RECOVERY") state.recovery = true;
      if (event === "INITIAL_SESSION") return;
      // Supabase calls made inside this callback can deadlock the auth lock;
      // step out of it first.
      setTimeout(function () { load().then(notify); }, 0);
    });
  }

  var ready = load();

  function signedIn() { return !!state.user; }

  // Cancelling runs the term out; access ends when the term does.
  function effective() {
    var p = state.profile;
    if (!state.user || !p) return TIERS.free;
    if (!p.paused && p.cancelled && p.term_ends && Date.parse(p.term_ends) < Date.now()) return TIERS.free;
    return TIERS[p.tier] || TIERS.free;
  }

  function profile() { return state.profile; }
  function email() { return (state.user && state.user.email) || ""; }
  function displayName() { return (state.profile && state.profile.display_name) || "Reader"; }
  function inRecovery() { return state.recovery; }
  function endRecovery() { state.recovery = false; }

  function signOut() {
    if (!client) return Promise.resolve();
    return client.auth.signOut().then(function () {
      state.user = null; state.profile = null; notify();
    });
  }

  function onChange(fn) { listeners.push(fn); }

  // Re-read the session and profile, e.g. after saving settings.
  function reload() { return load().then(notify); }

  // Where to come back to after signing in: this page, if it is one of ours.
  function here() {
    var p = w.location.pathname.split("/").pop() || "";
    return /^[a-z0-9-]+\.html$/i.test(p) && p !== (routes.signIn || "sign-in.html") ? p : "";
  }

  // ---- the top-bar strip --------------------------------------------------
  function mountIdentity(el) {
    function paint() {
      el.textContent = "";
      if (!signedIn()) {
        var a = d.createElement("a");
        var back = here();
        a.href = (routes.signIn || "sign-in.html") + (back ? "?next=" + encodeURIComponent(back) : "");
        a.textContent = "Sign in";
        el.appendChild(a);
        return;
      }
      var t = effective();
      var name = d.createElement("a");
      name.href = routes.account || "member-profile.html";
      name.textContent = displayName();

      var badge = d.createElement("span");
      badge.className = "badge badge--" + t.badge.toLowerCase();
      badge.textContent = t.badge;

      var sep = d.createElement("span");
      sep.className = "topbar__sep";
      sep.setAttribute("aria-hidden", "true");

      var out = d.createElement("button");
      out.type = "button";
      out.className = "topbar__signout";
      out.textContent = "Sign out";
      out.addEventListener("click", function () {
        signOut().then(function () { w.location.href = (routes.signIn || "sign-in.html") + "?out=1"; });
      });

      el.appendChild(name);
      el.appendChild(badge);
      el.appendChild(sep);
      el.appendChild(out);
    }
    ready.then(paint);
    onChange(paint);
  }

  w.DBWAccount = {
    TIERS: TIERS, client: client, ready: ready,
    signedIn: signedIn, effective: effective, profile: profile, email: email,
    displayName: displayName, inRecovery: inRecovery, endRecovery: endRecovery,
    keepSignedIn: keepSignedIn, signOut: signOut, onChange: onChange, reload: reload, mountIdentity: mountIdentity
  };
})(window, document);
