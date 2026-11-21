/* DBW News — article HTML, made safe.

   Imported Wix posts arrive as HTML. Before it is stored, and again before it
   is shown, it goes through this allowlist: known tags, known attributes, web
   and mail links only. Scripts, styles, event handlers, iframes and anything
   else are dropped, keeping their text where they had any.

   window.DBWSanitize.clean(html)          -> safe HTML string
   window.DBWSanitize.preview(html, n)     -> the first n paragraphs, safe
   window.DBWSanitize.wixImage(path)       -> Wix export image path to its CDN URL */
(function (w, d) {
  var KEEP = {
    P: [], BR: [], HR: [], H2: [], H3: [], H4: [], H5: [], BLOCKQUOTE: [], UL: [], OL: [], LI: [],
    STRONG: [], B: [], EM: [], I: [], U: [], S: [], SUB: [], SUP: [], SPAN: [], SMALL: [],
    A: ["href", "title"], IMG: ["src", "alt", "width", "height"], FIGURE: [], FIGCAPTION: [],
    TABLE: [], THEAD: [], TBODY: [], TR: [], TH: ["scope"], TD: []
  };
  var DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, MATH: 1, LINK: 1, META: 1 };
  var RENAME = { H1: "H2", H6: "H5", DIV: null, SECTION: null, ARTICLE: null, HEADER: null, FOOTER: null };

  function wixImage(src) {
    var m = /^\/?images\/blog\/(.+)$/.exec(src || "");
    return m ? "https://static.wixstatic.com/media/" + m[1] : src;
  }
  function safeHref(u) {
    u = String(u || "").trim();
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf("//") === 0) return "";
    return u;
  }
  function safeSrc(u) {
    u = wixImage(String(u || "").trim());
    return /^https:\/\//i.test(u) || /^assets\//.test(u) ? u : "";
  }

  function walk(node, out) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { out.appendChild(d.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toUpperCase();
      if (DROP[tag]) return;
      // Wix video blocks become a plain link: no third-party player, no tracking.
      if (tag === "DIV" && /\bwix-video\b/.test(n.className) && n.getAttribute("data-src")) {
        var href = safeHref(n.getAttribute("data-src"));
        if (href) {
          var p = d.createElement("p"); p.className = "video-link";
          var a = d.createElement("a"); a.href = href; a.rel = "noopener"; a.target = "_blank";
          a.textContent = "Watch the video";
          p.appendChild(a); out.appendChild(p);
        }
        return;
      }
      if (tag in RENAME) {
        if (RENAME[tag] === null) { walk(n, out); return; }
        tag = RENAME[tag];
      }
      if (!KEEP[tag]) { walk(n, out); return; }
      var el = d.createElement(tag);
      KEEP[tag].forEach(function (attr) {
        var v = n.getAttribute(attr);
        if (v == null) return;
        if (attr === "href") { v = safeHref(v); if (!v) return; }
        if (attr === "src") { v = safeSrc(v); if (!v) return; }
        el.setAttribute(attr, v);
      });
      if (tag === "A" && /^https?:/i.test(el.getAttribute("href") || "")) { el.rel = "noopener"; el.target = "_blank"; }
      if (tag === "P" && n.className === "video-link") el.className = "video-link";
      if (tag === "IMG") {
        if (!el.getAttribute("src")) return;
        el.setAttribute("loading", "lazy");
        if (!el.hasAttribute("alt")) el.setAttribute("alt", "");
      }
      walk(n, el);
      out.appendChild(el);
    });
  }

  function clean(html) {
    var doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    var out = d.createElement("div");
    walk(doc.body, out);
    // Drop paragraphs that are only whitespace, which Wix leaves everywhere.
    Array.prototype.forEach.call(out.querySelectorAll("p"), function (p) {
      if (!p.textContent.trim() && !p.querySelector("img")) p.remove();
    });
    return out.innerHTML;
  }

  function preview(html, n) {
    var box = d.createElement("div");
    box.innerHTML = clean(html);
    var kept = d.createElement("div");
    var count = 0;
    Array.prototype.some.call(box.children, function (el) {
      kept.appendChild(el.cloneNode(true));
      if (el.tagName === "P" && el.textContent.trim()) count++;
      return count >= (n || 2);
    });
    return kept.innerHTML;
  }

  w.DBWSanitize = { clean: clean, preview: preview, wixImage: wixImage };
})(window, document);
