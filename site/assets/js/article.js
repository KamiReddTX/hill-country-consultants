/* DBW News — one story: article.html?slug=<slug>.

   The database decides how much of the story this reader receives (see
   read_article in the articles migration). This page only lays out what came
   back, and when the full text did not, asks for what would open it. */
(function (w, d) {
  var A = w.DBWAccount;
  var I = w.DBWIssue;
  var S = w.DBWSanitize;
  var R = (w.DBW_CONFIG && w.DBW_CONFIG.routes) || {};
  var client = A.client;

  function $(id) { return d.getElementById(id); }
  function show(el, on) { el.hidden = !on; }
  function longDate(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  var slug = new URLSearchParams(w.location.search).get("slug") || "";
  var here = "article.html?slug=" + encodeURIComponent(slug);

  function fail(text) {
    var m = $("art-msg");
    m.textContent = text + " ";
    var a = d.createElement("a"); a.href = R.issueArchive || "issue-archive.html"; a.textContent = "Browse the archive";
    m.appendChild(a); m.appendChild(d.createTextNode("."));
  }

  if (!/^[a-z0-9][a-z0-9-]{0,200}$/.test(slug)) { fail("We could not find that story."); return; }
  if (!client) { fail("Stories open here once the site's accounts are connected."); return; }

  function load() {
    return client.rpc("read_article", { p_slug: slug }).then(function (r) {
      var a = r.data && r.data[0];
      if (r.error || !a) { fail("We could not find that story."); return; }
      render(a);
    });
  }

  function render(a) {
    show($("art-msg"), false);
    show($("story"), true);
    d.title = a.title + " · DBW News";
    var desc = d.querySelector('meta[name="description"]');
    if (desc && a.excerpt) desc.setAttribute("content", a.excerpt);

    var aged = !a.published_on || (Date.now() - Date.parse(a.published_on + "T00:00:00")) > 365 * 864e5;
    $("badge").textContent = a.free ? "Free to read" : aged ? "From the archive · open to any account" : "Subscriber story";
    $("badge").className = "story__badge" + (a.free || aged ? " story__badge--open" : "");
    $("title").textContent = a.title;
    if (a.excerpt) { $("dek").textContent = a.excerpt.replace(/\s+\S*$/, a.excerpt.length > 150 ? "…" : ""); show($("dek"), true); }

    var meta = $("meta"); meta.textContent = "";
    [a.byline ? "By " + a.byline : "", a.section, a.published_on ? longDate(a.published_on) : "", a.minutes_to_read ? a.minutes_to_read + " min read" : ""]
      .filter(Boolean).forEach(function (t, i) {
        if (i) meta.appendChild(Object.assign(d.createElement("span"), { textContent: "·", className: "story__dot" }));
        var s = d.createElement("span"); s.textContent = t; if (i === 0 && a.byline) s.className = "story__by";
        meta.appendChild(s);
      });

    var cover = S.wixImage(a.cover_url || "");
    if (/^https:\/\//.test(cover) || /^assets\//.test(cover)) { $("cover").src = cover; show($("figure"), true); }

    var body = a.locked ? a.preview_html : a.body_html;
    $("body").innerHTML = S.clean(body || "");
    // A video already linked in the text is not repeated.
    if (a.video_url && !$("body").querySelector(".video-link") && /^https:\/\//.test(a.video_url)) {
      var v = $("video"); v.textContent = "";
      var link = d.createElement("a"); link.href = a.video_url; link.rel = "noopener"; link.target = "_blank"; link.textContent = "Watch the video";
      v.appendChild(link); show(v, true);
    }
    $("body").classList.toggle("prose--cut", !!a.locked);
    wall(a);

    // The issue it ran in
    var iss = a.issue_ym && I ? I.find(a.issue_ym) : null;
    show($("issue-card"), !!iss);
    if (iss) {
      var dsc = I.describe(iss);
      var fr = $("issue-cover"); fr.textContent = "";
      if (dsc.cover) { var img = d.createElement("img"); img.src = dsc.cover; img.alt = dsc.month + " cover"; fr.appendChild(img); }
      else { var ph = d.createElement("div"); ph.className = "placeholder"; ph.textContent = dsc.month; fr.appendChild(ph); }
      $("issue-when").textContent = dsc.month + (dsc.no ? " · Issue #" + dsc.no : "");
      $("issue-title").textContent = dsc.title;
      var crumbs = $("crumbs");
      if (!crumbs.querySelector(".crumb-issue")) {
        crumbs.appendChild(Object.assign(d.createElement("span"), { textContent: "/" }));
        crumbs.appendChild(Object.assign(d.createElement("span"), { textContent: dsc.month + (dsc.title ? ": " + dsc.title : ""), className: "crumb-issue" }));
      }
    }

    var tags = (a.tags || []).filter(Boolean);
    show($("tags-card"), tags.length > 0);
    var ul = $("tags"); ul.textContent = "";
    tags.slice(0, 12).forEach(function (t) { var li = d.createElement("li"); li.textContent = t; ul.appendChild(li); });
  }

  function wall(a) {
    show($("wall"), !!a.locked);
    if (!a.locked) return;
    var e = A.effective();
    var o;
    if (a.unlock === "account") {
      o = { tag: "Keep reading, free", title: "Create a free account to read the rest",
            body: "Every story opens in full to any account a year after it ran, and every letter is free. An account costs nothing.",
            cta: "Create a free account", href: (R.signIn || "sign-in.html") + "?next=" + encodeURIComponent(here) + "#create",
            second: "Sign in", secondHref: (R.signIn || "sign-in.html") + "?next=" + encodeURIComponent(here) };
    } else if (e.print) {
      o = { tag: "You subscribe in print", title: "Add the site for $27",
            body: "Every subscriber story, the archive, and each issue online a week before your copy is posted. The $30 difference to Everything, with your ten percent off it.",
            cta: "Add the site · $27", href: (R.signIn || "sign-in.html") + "#upgrade-27",
            second: "What each level gets", secondHref: R.whatYouGet || "what-you-get.html" };
    } else {
      o = { tag: "Subscriber story", title: "The rest of this story is for subscribers",
            body: "An online subscription opens every subscriber story as it runs, every issue online page by page, and ten percent off the shop and every class. This story opens to any account a year after it ran.",
            cta: "Subscribe · $5 a month", href: R.createOnline || "sign-in.html#create-online",
            second: "What each level gets", secondHref: R.whatYouGet || "what-you-get.html" };
    }
    $("wall-tag").textContent = o.tag; $("wall-title").textContent = o.title; $("wall-body").textContent = o.body;
    $("wall-cta").textContent = o.cta; $("wall-cta").href = o.href;
    $("wall-second").textContent = o.second; $("wall-second").href = o.secondHref;
  }

  // ---- tools ----------------------------------------------------------------
  function said(t) { $("tool-said").textContent = t; setTimeout(function () { $("tool-said").textContent = ""; }, 2500); }
  function copy() {
    var url = w.location.href;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { said("Link copied"); }, function () { said(url); });
    else said(url);
  }
  $("copy").addEventListener("click", copy);
  $("share").addEventListener("click", function () {
    if (navigator.share) navigator.share({ title: d.title, url: w.location.href }).catch(function () {});
    else copy();
  });
  $("print").addEventListener("click", function () { w.print(); });

  Promise.all([A.ready, I ? I.refresh() : null]).then(load);
  A.onChange(load);
})(window, document);
