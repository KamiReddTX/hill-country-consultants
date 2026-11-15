/* DBW News — the issue archive.

   Reading an issue as pages needs site access; individual stories follow the
   ordinary rule and open to any account a year after they ran. Only pieces that
   exist on the site are listed — nothing is invented to fill a month, and a
   month with nothing in it says so.

   The issue list comes from issues.js. Imported articles come from the
   archive_articles table. Page scans come from the private issue-pages bucket,
   which only site levels can read (enforced in the database). */
(function (w, d) {
  var I = w.DBWIssue;
  var A = w.DBWAccount;
  var R = (w.DBW_CONFIG && w.DBW_CONFIG.routes) || {};
  var YEAR = 365 * 24 * 60 * 60 * 1000;
  var PLACEHOLDER_SPREADS = 1;

  var state = {
    articles: [],
    reader: null,      // { ym, title, pages: [url] | null, loading, opener }
    spread: 0
  };

  // ---- helpers ------------------------------------------------------------
  function $(id) { return d.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Only our own pages or ordinary web links; never javascript: or data:.
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "";
    return u;
  }

  function overYear(ym) {
    var t = Date.parse(ym + "-01T00:00:00");
    return !isNaN(t) && Date.now() - t > YEAR;
  }

  function monthKey(dateStr) {
    if (!dateStr) return null;
    var m = /^(\d{4})-(\d{2})/.exec(dateStr);
    return m ? m[1] + "-" + m[2] : null;
  }

  function cover(src, label) {
    return src
      ? '<img src="' + esc(src) + '" alt="' + esc(label) + '" loading="lazy" decoding="async">'
      : '<div class="placeholder" role="img" aria-label="' + esc(label) + ' not yet available">' + esc(label) + "</div>";
  }

  // ---- data ---------------------------------------------------------------
  function loadArticles() {
    if (!A.client) return Promise.resolve([]);
    return A.client.from("archive_articles")
      .select("title, published_on, byline, section, issue_ym, url")
      .order("published_on", { ascending: false, nullsFirst: false })
      .then(function (r) { return r.error ? [] : (r.data || []); })
      .catch(function () { return []; });
  }

  // Signed links to an issue's page scans. The bucket's policy returns
  // nothing to a level without the site, so this cannot leak pages.
  function loadPages(ym) {
    if (!A.client) return Promise.resolve([]);
    var bucket = A.client.storage.from("issue-pages");
    return bucket.list(ym, { limit: 1000, sortBy: { column: "name", order: "asc" } })
      .then(function (r) {
        var files = (r.data || []).filter(function (f) { return /\.(jpe?g|png|webp)$/i.test(f.name); });
        if (!files.length) return [];
        return bucket.createSignedUrls(files.map(function (f) { return ym + "/" + f.name; }), 60 * 60)
          .then(function (s) {
            return (s.data || []).map(function (x) { return x.signedUrl; }).filter(Boolean);
          });
      })
      .catch(function () { return []; });
  }

  // ---- who is reading -----------------------------------------------------
  function access() {
    var signedIn = A.signedIn();
    var e = A.effective();
    return { signedIn: signedIn, site: !!e.site, print: !!e.print };
  }

  function bannerFor(a) {
    if (!a.signedIn) return {
      line: "You are reading as a visitor. Letters are free in full, and a free account opens every story a year after it ran.",
      cta: "Create a free account", href: R.createAccount, tone: "plain" };
    if (a.site) return {
      line: "Your level reads every issue online, page by page, including this month’s a week before the copies are posted.",
      cta: "Your account", href: R.account, tone: "good" };
    if (a.print) return {
      line: "You subscribe in print, so the paper copy is posted to you. Reading the issues online costs $27 more for the rest of your year, not $50.",
      cta: "Add the site · $27", href: R.upgrade27, tone: "offer" };
    return {
      line: "Your free account opens every story a year after it ran, and every letter in full. Reading an issue as pages needs the site.",
      cta: "Subscribe · $5 a month", href: R.createOnline, tone: "offer" };
  }

  // ---- render -------------------------------------------------------------
  function render() {
    var a = access();
    var banner = bannerFor(a);
    var CAT = I.published();
    var firstYm = I.earliest();

    // Hero
    $("back-to").textContent = "The archive holds " + I.backToLine() + ".";
    var b = $("banner");
    b.className = "banner" + (banner.tone === "plain" ? "" : " banner--" + banner.tone);
    b.innerHTML = '<span class="banner__line">' + esc(banner.line) + "</span>" +
      '<a class="banner__cta" href="' + esc(banner.href) + '">' + esc(banner.cta) + "</a>";

    // This month
    var f = I.featured();
    if (f) {
      var live = I.isOnline(f.ym);
      $("current-state").textContent = a.site
        ? (live ? "Online now" : "Online " + f.online)
        : a.print ? "Posted " + f.mails : "Online " + f.online;
      var body = (f.blurb ? f.blurb + " " : "") +
        "Copies are posted on " + f.mails + "; the issue is online on " + f.online + " for readers who have the site.";
      var readBtn = a.site
        ? (live
            ? '<button type="button" class="btn btn--ink" data-read="' + esc(f.ym) + '" data-title="' + esc(f.month + (f.title ? ": " + f.title : "")) + '">Read the pages</button>'
            : "")
        : '<a class="btn btn--red" href="' + esc(banner.href) + '">' + esc(banner.cta) + "</a>";
      $("this-month").innerHTML =
        '<div class="this-month__grid">' +
          '<div class="frame">' + cover(f.cover, f.month + " cover") + "</div>" +
          "<div>" +
            '<div class="label">' + esc(f.month) + (f.no ? " · Issue #" + f.no : "") + "</div>" +
            '<h3 class="this-month__title">' + esc(f.title || "In production") + "</h3>" +
            '<p class="this-month__body">' + esc(body) + "</p>" +
            '<div class="actions">' + readBtn +
              '<a class="textlink" href="' + esc(R.issueContents ? R.issueContents(f.ym) : "#") + '">What is in it</a>' +
            "</div>" +
          "</div>" +
        "</div>";
    }

    // Merge the calendar with what has been imported.
    var byKey = {};
    var merged = CAT.map(function (i) {
      var row = { key: i.ym, no: i.no, theme: i.title, featured: i.featured, edition: i.edition, cover: i.cover, pieces: [] };
      byKey[i.ym] = row;
      return row;
    });
    // Work that belongs to no issue — undated, or published before the first
    // issue (the 2024 podcast episodes) — is listed on its own, never given a
    // month it did not run in.
    var loose = [];
    state.articles.forEach(function (art) {
      var key = art.issue_ym || monthKey(art.published_on);
      if (!key || (firstYm && key < firstYm)) { loose.push(art); return; }
      if (!byKey[key]) {
        byKey[key] = { key: key, no: null, theme: "", featured: "", edition: "", cover: "", pieces: [] };
        merged.push(byKey[key]);
      }
      byKey[key].pieces.push({ title: art.title, kind: art.section || art.byline || "From the archive", href: safeUrl(art.url) });
    });
    merged.sort(function (x, y) { return x.key < y.key ? 1 : -1; });

    var openN = CAT.filter(function (i) { return overYear(i.ym); }).length;
    $("back-note").textContent = CAT.length + (CAT.length === 1 ? " issue" : " issues") + " · " + openN + " open to any account";
    $("open-count").textContent = I.numberWord(openN);

    $("issues").innerHTML = merged.map(function (iss) {
      var month = I.monthName(iss.key);
      var old = overYear(iss.key);
      var empty = iss.pieces.length === 0;
      var credit = [iss.featured ? "Featuring " + iss.featured : "", iss.edition].filter(Boolean).join(" · ");
      var badge = old ? "Open to any account" : empty ? "Still being loaded" : "Subscriber stories";
      var note = a.site ? "Pages open"
        : old ? (a.signedIn ? "The stories are open to you" : "Sign in and the stories open")
        : "The pages need the site";
      var pieces = iss.pieces.map(function (p) {
        var t = p.href ? '<a href="' + esc(p.href) + '">' + esc(p.title) + "</a>" : "<span>" + esc(p.title) + "</span>";
        return '<div class="issue__piece">' + t + '<span class="issue__piece-kind"> · ' + esc(p.kind) + "</span></div>";
      }).join("");
      return '<li class="issue">' +
        '<div class="frame">' + cover(iss.cover, month + " cover") + "</div>" +
        "<div>" +
          '<div class="issue__meta">' +
            '<span class="issue__when">' + esc(month + (iss.no ? " · Issue #" + iss.no : "")) + "</span>" +
            '<span class="issue__badge' + (old ? " issue__badge--open" : "") + '">' + esc(badge) + "</span>" +
          "</div>" +
          '<h3 class="issue__theme">' + esc(iss.theme || "Being catalogued") + "</h3>" +
          (credit ? '<div class="issue__credit">' + esc(credit) + "</div>" : "") +
          pieces +
          (empty ? '<div class="issue__empty">Not yet scanned.</div>' : "") +
          '<div class="issue__foot">' +
            (a.site ? '<button type="button" class="btn btn--line" data-read="' + esc(iss.key) + '" data-title="' + esc(month) + '">Read the pages</button>' : "") +
            '<span class="issue__note">' + esc(note) + "</span>" +
          "</div>" +
        "</div>" +
      "</li>";
    }).join("");

    // Outside the issues
    if (loose.length) {
      $("loose").innerHTML = '<div class="loose">' +
        '<h2>Outside the issues</h2>' +
        '<p class="loose__note">' + esc(loose.length === 1
          ? "One piece sits outside the issues — published before the first issue, or with no date on it."
          : loose.length + " pieces sit outside the issues — published before the first issue, or with no date on them. The podcast runs on its own schedule, so its episodes belong here rather than in a month.") + "</p>" +
        '<ul class="loose__grid">' + loose.map(function (art) {
          var when = art.published_on ? I.monthName(monthKey(art.published_on)) : "Undated";
          var kind = [art.section || art.byline || "", when].filter(Boolean).join(" · ");
          var href = safeUrl(art.url);
          return '<li class="loose__item"><div class="loose__kind">' + esc(kind) + "</div>" +
            (href ? '<a class="loose__title" href="' + esc(href) + '">' + esc(art.title) + "</a>"
                  : '<span class="loose__title">' + esc(art.title) + "</span>") + "</li>";
        }).join("") + "</ul></div>";
    } else {
      $("loose").innerHTML = "";
    }

    // A reader who loses the site (signs out) loses the open reader too.
    if (state.reader && !a.site) state.reader = null;
    renderReader();
  }

  function spreads() {
    var r = state.reader;
    if (!r || !r.pages || !r.pages.length) return PLACEHOLDER_SPREADS;
    return Math.ceil(r.pages.length / 2);
  }

  function renderReader() {
    var box = $("reader");
    var r = state.reader;
    if (!r) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    // Redrawing replaces the controls; keep keyboard focus where it was.
    var had = box.contains(d.activeElement) ? d.activeElement : null;
    var keep = had ? (had.id ? "#" + had.id : had.hasAttribute("data-spread") ? '[data-spread="' + had.getAttribute("data-spread") + '"]' : had.hasAttribute("data-close") ? "[data-close]" : null) : null;
    var n = state.spread;
    var total = spreads();
    var left = n * 2 + 1, right = n * 2 + 2;
    var pages = r.pages || [];
    function page(num) {
      var src = pages[num - 1];
      if (src) return '<img src="' + esc(src) + '" alt="' + esc(r.title + ", page " + num) + '">';
      if (pages.length && num > pages.length) return '<div class="placeholder" aria-hidden="true"></div>';
      return '<div class="placeholder">' + esc(r.loading ? "Loading page " + num : "Page " + num) + "</div>";
    }
    var note = r.loading ? "Loading the pages…"
      : pages.length ? "Back issues are scanned and added month by month. Once an issue is here, it stays here."
      : "This issue has not been scanned yet. Back issues are scanned and added month by month, and once an issue is here, it stays here.";
    box.innerHTML =
      '<div class="reader__box">' +
        '<div class="reader__head">' +
          '<h2 class="reader__title" id="reader-title" tabindex="-1">' + esc(r.title) + "</h2>" +
          '<div class="reader__controls">' +
            '<span class="reader__count" aria-live="polite">Pages ' + left + (pages.length && right > pages.length ? "" : "–" + right) + (pages.length ? " of " + pages.length : "") + "</span>" +
            '<button type="button" class="btn btn--ghost" data-spread="-1"' + (n <= 0 ? " disabled" : "") + ">Back</button>" +
            '<button type="button" class="btn btn--ghost" data-spread="1"' + (n >= total - 1 ? " disabled" : "") + ">Forward</button>" +
            '<button type="button" class="btn btn--ink btn--small" data-close>Close</button>' +
          "</div>" +
        "</div>" +
        '<div class="spread">' + page(left) + page(right) + "</div>" +
        '<p class="reader__note">' + esc(note) + "</p>" +
      "</div>";
    if (keep) {
      var back = box.querySelector(keep);
      if (back && !back.disabled) back.focus({ preventScroll: true });
      else $("reader-title").focus({ preventScroll: true });
    }
  }

  // ---- actions ------------------------------------------------------------
  function openReader(ym, title, opener) {
    state.reader = { ym: ym, title: title, pages: null, loading: true, opener: opener };
    state.spread = 0;
    renderReader();
    focusReader();
    loadPages(ym).then(function (pages) {
      if (!state.reader || state.reader.ym !== ym) return;
      state.reader.pages = pages;
      state.reader.loading = false;
      renderReader();
    });
  }

  function focusReader() {
    var box = $("reader");
    box.scrollIntoView({ behavior: "smooth", block: "start" });
    var h = $("reader-title");
    if (h) h.focus({ preventScroll: true });
  }

  function step(dir) {
    var next = Math.max(0, Math.min(spreads() - 1, state.spread + dir));
    if (next === state.spread) return;
    state.spread = next;
    renderReader();
  }

  function closeReader() {
    var opener = state.reader && state.reader.opener;
    state.reader = null;
    renderReader();
    if (opener) {
      var again = d.querySelector('[data-read="' + opener + '"]');
      if (again) again.focus();
    }
  }

  d.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-read], [data-spread], [data-close]");
    if (!t) return;
    if (t.hasAttribute("data-read")) openReader(t.getAttribute("data-read"), t.getAttribute("data-title"), t.getAttribute("data-read"));
    else if (t.hasAttribute("data-spread")) step(Number(t.getAttribute("data-spread")));
    else closeReader();
  });

  d.addEventListener("keydown", function (ev) {
    if (!state.reader) return;
    var tag = (ev.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (ev.key === "ArrowRight") step(1);
    else if (ev.key === "ArrowLeft") step(-1);
    else if (ev.key === "Escape") closeReader();
  });

  // ---- start --------------------------------------------------------------
  // Point the static links at the configured routes.
  Array.prototype.forEach.call(d.querySelectorAll("[data-route]"), function (el) {
    var r = R[el.getAttribute("data-route")];
    if (typeof r === "string") el.href = r;
  });

  A.mountIdentity($("identity"));
  render();
  Promise.all([A.ready, loadArticles()]).then(function (res) {
    state.articles = res[1];
    render();
  });
  A.onChange(function () { loadArticles().then(function (list) { state.articles = list; render(); }); });
})(window, document);
