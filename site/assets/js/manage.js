/* DBW News — the staff workspace (manage.html).

   Everything here goes through Supabase with the signed-in staff member's own
   session. The database decides what she may do (see the manage migration):
   this page only hides what she could not do anyway. */
(function (w, d) {
  var A = w.DBWAccount;
  var I = w.DBWIssue;
  var R = (w.DBW_CONFIG && w.DBW_CONFIG.routes) || {};
  var client = A.client;
  var role = null;

  // ---- helpers ------------------------------------------------------------
  function $(id) { return d.getElementById(id); }
  function show(el, on) { el.hidden = !on; }
  function say(el, text) { el.textContent = text || ""; show(el, !!text); }
  function h(tag, attrs, kids) {
    var e = d.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? d.createTextNode(c) : c); });
    return e;
  }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
  function monthName(ym) { return I ? I.monthName(ym) : ym; }
  function pad(n) { return String(n).padStart(3, "0"); }
  function problem(r, fallback) {
    var m = (r && r.error && r.error.message) || "";
    if (/42501|permission|row-level|not allowed|Only an administrator/i.test(m)) return m.indexOf("Only") === 0 ? m : "Your role does not allow that.";
    if (/duplicate key|already exists/i.test(m)) return "There is already one with that month.";
    return m && m.length < 160 ? m : fallback;
  }
  function confirmIt(text) { return w.confirm(text); }

  // Shrink an image file to a JPEG of at most `max` pixels wide.
  function shrink(file, max) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, max / img.width);
        var c = d.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error("Could not read that image.")); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("That file is not an image this browser can read.")); };
      img.src = url;
    });
  }

  // ---- the gate -----------------------------------------------------------
  if (!client) { $("gate").textContent = "Accounts are not connected yet, so the workspace cannot open. Once Supabase is set up, sign in here with a staff account."; return; }

  A.ready.then(function () {
    if (!A.signedIn()) {
      w.location.replace((R.signIn || "sign-in.html") + "?next=manage.html");
      return;
    }
    return client.rpc("my_staff_role").then(function (r) {
      role = r.error ? null : r.data;
      if (!role) {
        $("gate").textContent = "This workspace is for DBW News staff. If you should have access, ask an administrator to add " + A.email() + " on the Staff tab.";
        return;
      }
      show($("gate"), false);
      show($("ws"), true);
      if (role === "admin") Array.prototype.forEach.call(d.querySelectorAll("[data-admin]"), function (el) { show(el, true); });
      loadIssues();
      loadArticles();
      if (role === "admin") { loadMembers(""); loadStaff(); }
    });
  });

  // ---- tabs ---------------------------------------------------------------
  var tabs = Array.prototype.slice.call(d.querySelectorAll("#tabs [role=tab]"));
  function pick(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      show($(t.getAttribute("aria-controls")), on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { pick(t); });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var vis = tabs.filter(function (x) { return !x.hidden; });
      var i = vis.indexOf(t);
      pick(vis[(i + (e.key === "ArrowRight" ? 1 : vis.length - 1)) % vis.length], true);
    });
  });

  // ---- issues -------------------------------------------------------------
  var issues = [];
  var editingYm = null;

  function loadIssues() {
    return client.from("issues").select("*").order("ym", { ascending: false }).then(function (r) {
      issues = r.data || [];
      paintIssues();
      paintPageIssues();
    });
  }

  function coverOf(row) { return I ? I.coverUrl(row.cover_path, client) : ""; }

  function paintIssues() {
    var ul = $("issue-list"); ul.textContent = "";
    $("issues-note").textContent = issues.length + (issues.length === 1 ? " issue" : " issues");
    issues.forEach(function (row) {
      var src = coverOf(row);
      var live = I ? I.isOnline(row.ym) : true;
      ul.appendChild(h("li", { class: "mg-item" + (editingYm === row.ym ? " is-editing" : "") }, [
        src ? h("img", { src: src, alt: "", class: "mg-item__thumb", loading: "lazy" }) : h("div", { class: "mg-item__thumb placeholder", "aria-hidden": "true" }),
        h("div", { class: "mg-item__body" }, [
          h("div", { class: "issue__when", text: monthName(row.ym) + (row.no ? " · Issue #" + row.no : "") + (live ? "" : " · coming") }),
          h("div", { class: "mg-item__title", text: row.title || "Untitled" }),
          row.featured ? h("div", { class: "issue__credit", text: "Featuring " + row.featured }) : null
        ]),
        h("div", { class: "mg-item__actions" }, [
          h("button", { type: "button", class: "btn btn--plain btn--small", text: "Edit", "aria-label": "Edit " + monthName(row.ym), onclick: function () { editIssue(row); } }),
          h("button", { type: "button", class: "btn btn--plain btn--small", text: "Delete", "aria-label": "Delete " + monthName(row.ym), onclick: function () { deleteIssue(row); } })
        ])
      ]));
    });
  }

  function resetIssueForm() {
    editingYm = null;
    $("issue-form").reset();
    $("i-ym").disabled = false;
    $("issue-form-title").textContent = "Add an issue";
    $("i-cover-preview").textContent = "";
    show($("i-cover-remove-wrap"), false);
    show($("issue-new"), false);
    say($("issue-err"), "");
    paintIssues();
  }

  function editIssue(row) {
    editingYm = row.ym;
    $("issue-form-title").textContent = "Edit " + monthName(row.ym);
    $("i-ym").value = row.ym; $("i-ym").disabled = true;
    $("i-no").value = row.no || "";
    $("i-title").value = row.title || "";
    $("i-featured").value = row.featured || "";
    $("i-edition").value = row.edition || "";
    $("i-blurb").value = row.blurb || "";
    $("i-cover").value = "";
    $("i-cover-remove").checked = false;
    var src = coverOf(row);
    $("i-cover-preview").textContent = "";
    if (src) $("i-cover-preview").appendChild(h("img", { src: src, alt: "Current cover" }));
    show($("i-cover-remove-wrap"), !!src);
    show($("issue-new"), true);
    say($("issue-err"), ""); say($("issue-said"), "");
    paintIssues();
    $("i-title").focus();
  }
  $("issue-new").addEventListener("click", function () { resetIssueForm(); $("i-ym").focus(); });

  $("issue-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var ym = $("i-ym").value;
    var title = $("i-title").value.trim();
    var no = $("i-no").value ? parseInt($("i-no").value, 10) : null;
    say($("issue-said"), "");
    if (!/^\d{4}-\d{2}$/.test(ym)) { say($("issue-err"), "Choose the month the issue is for."); $("i-ym").focus(); return; }
    if (!title) { say($("issue-err"), "Give the issue its title."); $("i-title").focus(); return; }
    if (no != null && (!(no > 0) || Math.floor(no) !== no)) { say($("issue-err"), "The issue number is a whole number, or empty."); return; }
    if (!editingYm && issues.some(function (x) { return x.ym === ym; })) { say($("issue-err"), monthName(ym) + " already has an issue. Choose Edit on it instead."); return; }
    say($("issue-err"), "");
    var btn = $("issue-save"); busy(btn, true, "Saving…");
    var file = $("i-cover").files[0];
    var existing = issues.filter(function (x) { return x.ym === ym; })[0];
    var cover = existing ? existing.cover_path : "";
    var step = Promise.resolve();
    if ($("i-cover-remove").checked) cover = "";
    if (file) {
      step = shrink(file, 900).then(function (blob) {
        var path = ym + "-" + Date.now() + ".jpg";
        return client.storage.from("covers").upload(path, blob, { contentType: "image/jpeg", upsert: false }).then(function (r) {
          if (r.error) throw new Error(problem(r, "The cover did not upload."));
          cover = path;
        });
      });
    }
    step.then(function () {
      var row = { ym: ym, no: no, title: title, featured: $("i-featured").value.trim(), edition: $("i-edition").value.trim(),
                  blurb: $("i-blurb").value.trim(), cover_path: cover };
      return editingYm
        ? client.from("issues").update(row).eq("ym", ym)
        : client.from("issues").insert(row);
    }).then(function (r) {
      busy(btn, false);
      if (r && r.error) { say($("issue-err"), problem(r, "That did not save. Try again.")); return; }
      say($("issue-said"), monthName(ym) + " is saved and on the site.");
      editingYm = ym;
      return loadIssues().then(function () {
        var row = issues.filter(function (x) { return x.ym === ym; })[0];
        if (row) editIssue(row);
        say($("issue-said"), monthName(ym) + " is saved and on the site.");
      });
    }).catch(function (err) { busy(btn, false); say($("issue-err"), err.message || "That did not save."); });
  });

  function deleteIssue(row) {
    if (!confirmIt("Delete " + monthName(row.ym) + " (" + (row.title || "untitled") + ") from the site? Its page scans stay stored until you remove them on the Page scans tab.")) return;
    client.from("issues").delete().eq("ym", row.ym).then(function (r) {
      if (r.error) { w.alert(problem(r, "That did not delete.")); return; }
      if (editingYm === row.ym) resetIssueForm();
      loadIssues();
    });
  }

  // ---- page scans ---------------------------------------------------------
  var pdfjs = null;
  function loadPdfjs() {
    if (pdfjs) return Promise.resolve(pdfjs);
    var base = new URL("assets/vendor/pdfjs-4.10.38/", d.baseURI).href;
    return import(base + "pdf.min.mjs").then(function (m) {
      m.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.mjs";
      pdfjs = m; return m;
    });
  }

  function paintPageIssues() {
    var sel = $("pg-issue"); var keep = sel.value;
    sel.textContent = "";
    issues.forEach(function (row) {
      sel.appendChild(h("option", { value: row.ym, text: monthName(row.ym) + (row.no ? " · #" + row.no : "") + " — " + (row.title || "Untitled") }));
    });
    if (keep && issues.some(function (x) { return x.ym === keep; })) sel.value = keep;
    loadPages();
  }
  $("pg-issue").addEventListener("change", loadPages);

  var pages = [];
  function listPages(ym) {
    return client.storage.from("issue-pages").list(ym, { limit: 1000, sortBy: { column: "name", order: "asc" } })
      .then(function (r) { return (r.data || []).filter(function (f) { return /\.(jpe?g|png|webp)$/i.test(f.name); }); });
  }

  function loadPages() {
    var ym = $("pg-issue").value;
    var ul = $("pg-thumbs"); ul.textContent = "";
    if (!ym) { $("pages-note").textContent = ""; return Promise.resolve(); }
    return listPages(ym).then(function (files) {
      pages = files;
      $("pages-note").textContent = files.length ? files.length + " pages in " + monthName(ym) : "No pages yet for " + monthName(ym);
      if (!files.length) return;
      return client.storage.from("issue-pages").createSignedUrls(files.map(function (f) { return ym + "/" + f.name; }), 600).then(function (s) {
        (s.data || []).forEach(function (x, i) {
          ul.appendChild(h("li", { class: "mg-thumb" }, [
            h("img", { src: x.signedUrl, alt: "Page " + (i + 1), loading: "lazy" }),
            h("div", { class: "mg-thumb__foot" }, [
              h("span", { text: "Page " + (i + 1) }),
              h("button", { type: "button", class: "linkbtn", text: "Remove", "aria-label": "Remove page " + (i + 1), onclick: function () { removePage(ym, files[i].name, i + 1); } })
            ])
          ]));
        });
      });
    });
  }

  function removePage(ym, name, n) {
    if (!confirmIt("Remove page " + n + " of " + monthName(ym) + "? The pages after it keep their numbers until you upload the issue again.")) return;
    client.storage.from("issue-pages").remove([ym + "/" + name]).then(function (r) {
      if (r.error) { w.alert(problem(r, "That did not remove.")); return; }
      loadPages();
    });
  }

  function progress(text) { $("pg-progress").textContent = text; }

  // Turn the chosen files into page images, in order.
  function pageBlobs(files, onEach) {
    var out = [];
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
          return loadPdfjs().then(function (pdf) {
            return file.arrayBuffer().then(function (buf) { return pdf.getDocument({ data: buf }).promise; });
          }).then(function (doc) {
            var inner = Promise.resolve();
            for (var p = 1; p <= doc.numPages; p++) (function (p) {
              inner = inner.then(function () {
                onEach("Reading page " + p + " of " + doc.numPages + " from " + file.name + "…");
                return doc.getPage(p).then(function (page) {
                  var vp1 = page.getViewport({ scale: 1 });
                  var vp = page.getViewport({ scale: Math.min(3, 1600 / vp1.width) });
                  var c = d.createElement("canvas");
                  c.width = Math.round(vp.width); c.height = Math.round(vp.height);
                  var ctx = c.getContext("2d");
                  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, c.width, c.height);
                  return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
                    return new Promise(function (res) { c.toBlob(function (b) { out.push(b); page.cleanup(); res(); }, "image/jpeg", 0.85); });
                  });
                });
              });
            })(p);
            return inner.then(function () { return doc.destroy(); });
          });
        }
        onEach("Preparing " + file.name + "…");
        return shrink(file, 1600).then(function (b) { out.push(b); });
      });
    });
    return chain.then(function () { return out; });
  }

  $("pg-upload").addEventListener("click", function () {
    var ym = $("pg-issue").value;
    var files = Array.prototype.slice.call($("pg-files").files || []);
    var mode = d.querySelector("input[name=pg-mode]:checked").value;
    say($("pg-err"), "");
    if (!ym) { say($("pg-err"), "Add the issue on the Issues tab first."); return; }
    if (!files.length) { say($("pg-err"), "Choose a PDF or the page images."); return; }
    // Images go in the order of their file names, which is how scanners number them.
    files.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
    if (mode === "replace" && pages.length && !confirmIt("Replace all " + pages.length + " pages of " + monthName(ym) + "?")) return;
    var btn = this; busy(btn, true, "Working…");
    var start = mode === "append" ? pages.length : 0;
    var old = pages.map(function (f) { return f.name; });
    pageBlobs(files, progress).then(function (blobs) {
      var chain = Promise.resolve();
      var made = [];
      blobs.forEach(function (b, i) {
        chain = chain.then(function () {
          var name = pad(start + i + 1) + ".jpg";
          progress("Uploading page " + (i + 1) + " of " + blobs.length + "…");
          return client.storage.from("issue-pages").upload(ym + "/" + name, b, { contentType: "image/jpeg", upsert: true }).then(function (r) {
            if (r.error) throw new Error("Page " + (i + 1) + " did not upload: " + problem(r, "try again."));
            made.push(name);
          });
        });
      });
      return chain.then(function () {
        if (mode !== "replace") return;
        var stale = old.filter(function (n) { return made.indexOf(n) < 0; }).map(function (n) { return ym + "/" + n; });
        if (stale.length) return client.storage.from("issue-pages").remove(stale);
      }).then(function () {
        progress("Done: " + blobs.length + " pages are on the site for " + monthName(ym) + ".");
      });
    }).catch(function (err) {
      progress("");
      say($("pg-err"), (err && err.message) || "The upload stopped. The pages that finished are kept; upload again to finish.");
    }).then(function () {
      busy(btn, false);
      $("pg-files").value = "";
      loadPages();
    });
  });

  // ---- articles -----------------------------------------------------------
  var articles = [];
  var editingId = null;

  function loadArticles() {
    return client.from("archive_articles").select("*").order("published_on", { ascending: false, nullsFirst: true }).limit(2000).then(function (r) {
      articles = r.data || [];
      paintArticles();
    });
  }

  function paintArticles() {
    var q = $("art-find").value.trim().toLowerCase();
    var ul = $("art-list"); ul.textContent = "";
    var shown = articles.filter(function (a) {
      return !q || [a.title, a.byline, a.section].join(" ").toLowerCase().indexOf(q) >= 0;
    });
    $("art-note").textContent = articles.length + (articles.length === 1 ? " article" : " articles");
    shown.slice(0, 300).forEach(function (a) {
      var when = a.published_on ? new Date(a.published_on + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Undated";
      ul.appendChild(h("li", { class: "mg-item mg-item--text" + (editingId === a.id ? " is-editing" : "") }, [
        h("div", { class: "mg-item__body" }, [
          h("div", { class: "mg-item__title", text: a.title }),
          h("div", { class: "issue__credit", text: [when, a.section, a.byline].filter(Boolean).join(" · ") })
        ]),
        h("div", { class: "mg-item__actions" }, [
          h("button", { type: "button", class: "btn btn--plain btn--small", text: "Edit", "aria-label": "Edit " + a.title, onclick: function () { editArticle(a); } }),
          h("button", { type: "button", class: "btn btn--plain btn--small", text: "Delete", "aria-label": "Delete " + a.title, onclick: function () { deleteArticle(a); } })
        ])
      ]));
    });
    if (!shown.length) ul.appendChild(h("li", { class: "mg-empty", text: articles.length ? "Nothing matches." : "No articles yet. Add the first one with the form." }));
  }
  $("art-find").addEventListener("input", paintArticles);

  function resetArticleForm() {
    editingId = null; $("art-form").reset();
    $("art-form-title").textContent = "Add an article";
    show($("art-new"), false); say($("art-err"), "");
    paintArticles();
  }
  function editArticle(a) {
    editingId = a.id;
    $("art-form-title").textContent = "Edit the article";
    $("a-title").value = a.title || ""; $("a-date").value = a.published_on || "";
    $("a-byline").value = a.byline || ""; $("a-section").value = a.section || "";
    $("a-issue").value = a.issue_ym || ""; $("a-url").value = a.url || "";
    show($("art-new"), true); say($("art-err"), ""); say($("art-said"), "");
    paintArticles(); $("a-title").focus();
  }
  $("art-new").addEventListener("click", function () { resetArticleForm(); $("a-title").focus(); });

  $("art-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = $("a-title").value.trim();
    var url = $("a-url").value.trim();
    say($("art-said"), "");
    if (!title) { say($("art-err"), "Give the article its headline."); $("a-title").focus(); return; }
    if (url && /^[a-z][a-z0-9+.-]*:/i.test(url) && !/^https?:\/\//i.test(url)) { say($("art-err"), "The link must start with https:// or be a page on this site."); return; }
    say($("art-err"), "");
    var row = { title: title, published_on: $("a-date").value || null, byline: $("a-byline").value.trim(),
                section: $("a-section").value.trim(), issue_ym: $("a-issue").value || null, url: url || null };
    var btn = $("art-save"); busy(btn, true, "Saving…");
    var q = editingId ? client.from("archive_articles").update(row).eq("id", editingId) : client.from("archive_articles").insert(row);
    q.then(function (r) {
      busy(btn, false);
      if (r.error) { say($("art-err"), problem(r, "That did not save. Try again.")); return; }
      var was = editingId;
      resetArticleForm();
      say($("art-said"), was ? "Saved." : "Added to the archive.");
      loadArticles();
    });
  });

  function deleteArticle(a) {
    if (!confirmIt("Delete “" + a.title + "” from the archive?")) return;
    client.from("archive_articles").delete().eq("id", a.id).then(function (r) {
      if (r.error) { w.alert(problem(r, "That did not delete.")); return; }
      if (editingId === a.id) resetArticleForm();
      loadArticles();
    });
  }

  // ---- members (admins) ---------------------------------------------------
  var TIER_KEYS = ["free", "online", "print", "everything", "vip", "business"];
  function loadMembers(q) {
    say($("mem-err"), "");
    return client.rpc("admin_list_members", { search: q || "" }).then(function (r) {
      if (r.error) { say($("mem-err"), problem(r, "Could not load members.")); return; }
      var rows = r.data || [];
      $("mem-note").textContent = rows.length + (rows.length >= 200 ? "+ (search to narrow)" : "") + " shown";
      var tb = $("mem-table").tBodies[0]; tb.textContent = "";
      rows.forEach(function (m) { tb.appendChild(memberRow(m)); });
      if (!rows.length) tb.appendChild(h("tr", {}, [h("td", { colspan: "6", class: "mg-empty", text: "No one matches." })]));
    });
  }
  $("mem-search").addEventListener("submit", function (e) { e.preventDefault(); loadMembers($("mem-q").value.trim()); });

  function fmt(iso) { return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; }

  function memberRow(m) {
    var t = A.TIERS[m.tier] || A.TIERS.free;
    var flags = [m.paused ? "paused" : "", m.cancelled ? "cancelling" : ""].filter(Boolean).join(", ");
    var tr = h("tr", {}, [
      h("td", { text: m.display_name || "—" }),
      h("td", { class: "mg-wrap", text: m.email }),
      h("td", { text: t.label + (flags ? " (" + flags + ")" : "") }),
      h("td", { text: m.tier === "free" ? "—" : fmt(m.term_ends) }),
      h("td", { text: fmt(m.created_at) }),
      h("td", {}, [h("button", { type: "button", class: "btn btn--plain btn--small", text: "Change", "aria-label": "Change " + (m.display_name || m.email), onclick: function () { tr.replaceWith(memberEditor(m)); } })])
    ]);
    return tr;
  }

  function memberEditor(m) {
    var sel = h("select", { "aria-label": "Level" }, TIER_KEYS.map(function (k) { return h("option", { value: k, text: A.TIERS[k].label }); }));
    sel.value = m.tier;
    var date = h("input", { type: "date", "aria-label": "Ends on", value: m.term_ends ? m.term_ends.slice(0, 10) : "" });
    var paused = h("input", { type: "checkbox" }); paused.checked = !!m.paused;
    var cancelled = h("input", { type: "checkbox" }); cancelled.checked = !!m.cancelled;
    var err = h("div", { class: "panel__err", role: "alert" });
    var tr;
    var save = h("button", { type: "button", class: "btn btn--ink btn--small", text: "Save", onclick: function () {
      if (sel.value !== "free" && !date.value) { err.textContent = "A paid level needs the date it ends."; return; }
      busy(save, true, "Saving…");
      client.rpc("admin_set_membership", {
        target: m.id, new_tier: sel.value,
        new_term_ends: date.value ? new Date(date.value + "T23:59:59").toISOString() : null,
        new_paused: paused.checked, new_cancelled: cancelled.checked
      }).then(function (r) {
        busy(save, false);
        if (r.error) { err.textContent = problem(r, "That did not save."); return; }
        loadMembers($("mem-q").value.trim());
      });
    } });
    tr = h("tr", { class: "is-editing" }, [
      h("td", { text: m.display_name || "—" }),
      h("td", { class: "mg-wrap", text: m.email }),
      h("td", {}, [sel, h("label", { class: "check mg-mini" }, [paused, "Paused"]), h("label", { class: "check mg-mini" }, [cancelled, "Cancelling"])]),
      h("td", {}, [date]),
      h("td", { text: fmt(m.created_at) }),
      h("td", {}, [save, h("button", { type: "button", class: "linkbtn mg-cancel", text: "Cancel", onclick: function () { tr.replaceWith(memberRow(m)); } }), err])
    ]);
    setTimeout(function () { sel.focus(); }, 0);
    return tr;
  }

  // ---- staff (admins) -----------------------------------------------------
  function loadStaff() {
    return client.rpc("admin_list_staff").then(function (r) {
      var ul = $("staff-list"); ul.textContent = "";
      if (r.error) { say($("st-err"), problem(r, "Could not load the staff list.")); return; }
      (r.data || []).forEach(function (s) {
        ul.appendChild(h("li", { class: "mg-item mg-item--text" }, [
          h("div", { class: "mg-item__body" }, [
            h("div", { class: "mg-item__title", text: (s.display_name || s.email) + (s.role === "admin" ? " · Administrator" : " · Editor") }),
            h("div", { class: "issue__credit", text: s.email })
          ]),
          h("div", { class: "mg-item__actions" }, [
            h("button", { type: "button", class: "btn btn--plain btn--small", text: "Remove", "aria-label": "Remove " + s.email, onclick: function () {
              if (!confirmIt("Remove " + s.email + " from staff? Her reader account stays.")) return;
              client.rpc("admin_remove_staff", { target: s.user_id }).then(function (x) {
                if (x.error) { say($("st-err"), problem(x, "That did not remove.")); return; }
                say($("st-said"), s.email + " is no longer staff."); loadStaff();
              });
            } })
          ])
        ]));
      });
    });
  }
  $("staff-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("st-email").value.trim();
    say($("st-err"), ""); say($("st-said"), "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say($("st-err"), "Enter the email on her account."); return; }
    client.rpc("admin_add_staff", { staff_email: email, staff_role: $("st-role").value }).then(function (r) {
      if (r.error) { say($("st-err"), problem(r, "That did not save.")); return; }
      say($("st-said"), email + " can now use this workspace.");
      $("st-email").value = ""; loadStaff();
    });
  });
})(window, document);
