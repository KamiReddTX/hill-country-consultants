/* DBW News — bringing the Wix blog over (workspace, Articles tab).

   Reads the files the Wix export produced: one .md per post (front matter
   plus the post's HTML) and, beside it, a .json with Wix's own record. The .md
   is the source; the .json fills in the date if the .md has none. Nothing is
   written until the list has been shown and Import pressed. A post whose web
   address is already on the site is skipped, so running it twice is safe. */
(function (w, d) {
  var A = w.DBWAccount;
  var S = w.DBWSanitize;
  var client = A.client;
  if (!client) return;

  function $(id) { return d.getElementById(id); }
  function show(el, on) { el.hidden = !on; }
  function say(el, t) { el.textContent = t || ""; show(el, !!t); }
  function status(t) { $("im-status").textContent = t || ""; }
  function slugify(t) { return w.DBWManage ? w.DBWManage.slugify(t) : String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

  // Front matter: key: "string" | number | ["list", "of", "strings"]
  function frontMatter(text) {
    var m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
    if (!m) return { meta: {}, body: text };
    var meta = {};
    m[1].split(/\r?\n/).forEach(function (line) {
      var k = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
      if (!k) return;
      var v = k[2].trim();
      try { v = JSON.parse(v); } catch (e) { v = v.replace(/^['"]|['"]$/g, ""); }
      meta[k[1]] = v;
    });
    return { meta: meta, body: m[2] };
  }

  function readText(f) { return f.text ? f.text() : new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsText(f); }); }

  var batch = [];

  function pick(files) {
    files = Array.prototype.slice.call(files || []).filter(function (f) { return /\.(md|json)$/i.test(f.name); });
    say($("im-err"), ""); show($("im-go"), false); show($("im-preview-wrap"), false);
    if (!files.length) { status("Those files are not .md or .json files from the export."); return; }
    status("Reading " + files.length + " files…");
    var byKey = {};
    Promise.all(files.map(function (f) {
      return readText(f).then(function (text) {
        var key = f.name.replace(/\.(md|json)$/i, "").toLowerCase();
        var e = byKey[key] || (byKey[key] = {});
        if (/\.md$/i.test(f.name)) e.md = frontMatter(text);
        else { try { e.json = JSON.parse(text); } catch (err) { e.badJson = f.name; } }
      });
    })).then(function () {
      var existing = {};
      (w.DBWManage ? w.DBWManage.articles() : []).forEach(function (a) { if (a.slug) existing[a.slug] = 1; });
      var seen = {};
      batch = Object.keys(byKey).sort().map(function (key) {
        var e = byKey[key], m = (e.md && e.md.meta) || {}, j = e.json || {};
        var title = m.title || j.title || "";
        var slug = slugify(m.slug || j.slug || title);
        var html = e.md ? e.md.body : (j.contentText ? "<p>" + String(j.contentText).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</p>" : "");
        var body = S.clean(html);
        var date = String(m.published || j.firstPublishedDate || "").slice(0, 10);
        var cats = Array.isArray(m.categories) ? m.categories : [];
        var vid = /data-src="(https:\/\/[^"]+)"/.exec(html || "");
        var words = (body.replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;
        var row = {
          title: title, slug: slug,
          published_on: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
          section: cats[0] || "",
          excerpt: m.excerpt || j.excerpt || "",
          cover_url: m.cover_image_remote || S.wixImage(m.cover_image || "") || "",
          categories: cats,
          tags: Array.isArray(m.tags) ? m.tags : [],
          minutes_to_read: parseInt(m.minutes_to_read || j.minutesToRead, 10) || null,
          video_url: vid ? vid[1] : "",
          original_path: m.original_path || "",
          free: cats.some(function (c) { return /letter/i.test(c); })
        };
        var why = !title ? "No headline — skipped"
          : !slug ? "No web address — skipped"
          : existing[slug] ? "Already on the site — skipped"
          : seen[slug] ? "Repeated in this batch — skipped"
          : !words ? "Import (no text found)"
          : "Import";
        seen[slug] = 1;
        return { row: row, body: body, words: words, why: why, go: /^Import/.test(why) };
      });
      paint();
    });
  }

  function paint() {
    var tb = $("im-preview").tBodies[0]; tb.textContent = "";
    batch.forEach(function (b) {
      var tr = d.createElement("tr");
      [b.row.title || "—", b.row.published_on || "Undated", b.row.section || "—", String(b.words), b.why].forEach(function (t, i) {
        var td = d.createElement("td"); td.textContent = t;
        if (i === 4 && !b.go) td.className = "mg-muted";
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    var n = batch.filter(function (b) { return b.go; }).length;
    var skip = batch.length - n;
    var empty = batch.filter(function (b) { return b.go && !b.words; }).length;
    show($("im-preview-wrap"), batch.length > 0);
    status(n + " to import" + (skip ? ", " + skip + " skipped" : "") + (empty ? ". " + empty + " have no text — check those after." : "."));
    $("im-go").textContent = "Import " + n + (n === 1 ? " article" : " articles");
    show($("im-go"), n > 0);
  }

  // Clear the picker after reading, so choosing the same files again re-checks them.
  $("im-files").addEventListener("change", function () { var f = this.files; pick(f); this.value = ""; });
  // A folder picker: set on the element, since some browsers ignore it in markup.
  var folder = $("im-folder");
  folder.setAttribute("webkitdirectory", ""); folder.setAttribute("directory", "");
  folder.addEventListener("change", function () { var f = this.files; pick(f); this.value = ""; });

  $("im-go").addEventListener("click", function () {
    var todo = batch.filter(function (b) { return b.go; });
    var byline = $("im-byline").value.trim();
    var btn = this; btn.disabled = true;
    say($("im-err"), "");
    var done = 0, failed = [];
    var chain = Promise.resolve();
    todo.forEach(function (b) {
      chain = chain.then(function () {
        var row = Object.assign({}, b.row, { byline: byline });
        return client.from("archive_articles").insert(row).select("id").single().then(function (r) {
          if (r.error) throw r.error;
          return client.from("article_bodies").insert({ article_id: r.data.id, body_html: b.body, preview_html: S.preview(b.body, 2) });
        }).then(function (r) {
          if (r && r.error) throw r.error;
          done++; b.go = false; b.why = "Imported";
          if (done % 10 === 0 || done === todo.length) status("Imported " + done + " of " + todo.length + "…");
        }).catch(function (err) {
          failed.push(b.row.title); b.go = false; b.why = "Failed: " + ((err && err.message) || "unknown");
        });
      });
    });
    chain.then(function () {
      btn.disabled = false;
      paint();
      status("Imported " + done + " of " + todo.length + "." + (failed.length ? " " + failed.length + " failed; they are marked in the list." : " They are on the site now."));
      show(btn, false);
      if (w.DBWManage) w.DBWManage.reloadArticles();
    });
  });
})(window, document);
