/* DBW News — the front door: the issue on the stand, and every issue since. */
(function (w, d) {
  var I = w.DBWIssue;
  if (!I) return;
  function $(id) { return d.getElementById(id); }
  function el(tag, cls, text) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function cover(src, label) {
    if (src) {
      var img = el("img"); img.src = src; img.alt = label; img.loading = "lazy"; img.decoding = "async";
      return img;
    }
    var ph = el("div", "placeholder", label);
    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", label + " not yet available");
    return ph;
  }

  var f = I.featured();
  if (f) {
    $("stand-cover").appendChild(cover(f.cover, f.month + " cover"));
    $("stand-title").textContent = f.title || "In production";
    $("stand-when").textContent = f.month + (f.no ? " · Issue #" + f.no : "");
    $("stand-body").textContent = (f.blurb ? f.blurb + " " : "") +
      "Online on " + f.online + " for readers who have the site; copies are posted on " + f.mails + ".";
  }

  var list = $("recent");
  I.published().filter(function (i) { return !f || i.ym !== f.ym; }).forEach(function (i) {
    var d1 = I.describe(i);
    var li = el("li", "recent__item");
    var a = el("a", "recent__link");
    a.href = "issue-archive.html";
    var fr = el("div", "frame");
    fr.appendChild(cover(d1.cover, d1.month + " cover"));
    a.appendChild(fr);
    a.appendChild(el("div", "issue__when", d1.month + (d1.no ? " · Issue #" + d1.no : "")));
    a.appendChild(el("div", "recent__title", d1.title));
    if (d1.featured) a.appendChild(el("div", "issue__credit", "Featuring " + d1.featured));
    li.appendChild(a);
    list.appendChild(li);
  });
})(window, document);
