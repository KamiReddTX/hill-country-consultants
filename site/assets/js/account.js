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
     displayName()      her name, or "Reader"
     signOut()          Promise
     onChange(fn)       called after sign-in, sign-out or a profile change
     mountIdentity(el)  renders the top-bar sign-in / name / sign-out strip */
(function (w, d) {
  // The six levels. `site` is website access; print alone does not carry it.
  var TIERS = {
    free:       { key: "free",       label: "Free account",    badge: "Free", site: false, print: false, vip: false, business: false },
    online:     { key: "online",     label: "Online",          badge: "Paid", site: true,  print: false, vip: false, business: false },
    print:      { key: "print",      label: "In print",        badge: "Paid", site: false, print: true,  vip: false, business: false },
    everything: { key: "everything", label: "Everything",      badge: "Paid", site: true,  print: true,  vip: false, business: false },
    vip:        { key: "vip",        label: "VIP",             badge: "VIP",  site: true,  print: true,  vip: true,  business: false },
    business:   { key: "business",   label: "Business Member", badge: "Paid", site: true,  print: true,  vip: false, business: true }
  };

  var cfg = w.DBW_CONFIG || {};
  var routes = cfg.routes || {};
  var client = null;
  if (cfg.supabaseUrl && cfg.supabaseKey && w.supabase && w.supabase.createClient) {
    client = w.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  }

  var state = { user: null, profile: null };
  var listeners = [];

  function load() {
    if (!client) return Promise.resolve();
    return client.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      state.user = session ? session.user : null;
      if (!state.user) { state.profile = null; return; }
      return client.from("profiles")
        .select("display_name, tier, paused, cancelled, term_ends")
        .eq("id", state.user.id)
        .maybeSingle()
        .then(function (r) { state.profile = r.error ? null : r.data; });
    }).catch(function () { state.user = null; state.profile = null; });
  }

  function notify() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  var ready = load();

  if (client) {
    client.auth.onAuthStateChange(function (event) {
      if (event === "INITIAL_SESSION") return;
      // Supabase calls made inside this callback can deadlock the auth lock;
      // step out of it first.
      setTimeout(function () { load().then(notify); }, 0);
    });
  }

  function signedIn() { return !!state.user; }

  // Cancelling runs the term out; access ends when the term does.
  function effective() {
    var p = state.profile;
    if (!state.user || !p) return TIERS.free;
    if (!p.paused && p.cancelled && p.term_ends && Date.parse(p.term_ends) < Date.now()) return TIERS.free;
    return TIERS[p.tier] || TIERS.free;
  }

  function displayName() {
    var p = state.profile;
    return (p && p.display_name) || "Reader";
  }

  function signOut() {
    if (!client) return Promise.resolve();
    return client.auth.signOut().then(function () {
      state.user = null; state.profile = null; notify();
    });
  }

  function onChange(fn) { listeners.push(fn); }

  // ---- the top-bar strip --------------------------------------------------
  function mountIdentity(el) {
    function paint() {
      el.textContent = "";
      if (!signedIn()) {
        var a = d.createElement("a");
        a.href = routes.signIn || "sign-in.html";
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
    signedIn: signedIn, effective: effective, displayName: displayName,
    signOut: signOut, onChange: onChange, mountIdentity: mountIdentity
  };
})(window, document);
