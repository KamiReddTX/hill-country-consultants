/* DBW News holding site — every form on the site.

   Forms marked data-dbw-form are sent to Netlify Forms without leaving the
   page. Before sending: required boxes are checked, and photographs are
   shrunk in the browser (phones take very large pictures; Netlify accepts
   about 8 MB per submission). With JavaScript off, forms still post the
   ordinary way. */
(function () {
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var MAX_SIDE = 1600, QUALITY = 0.82, MAX_TOTAL = 7 * 1024 * 1024;

  function shrink(file) {
    return new Promise(function (resolve) {
      if (!/^image\//.test(file.type) || /gif|svg/.test(file.type)) return resolve(file);
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          resolve(b ? new File([b], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file);
        }, "image/jpeg", QUALITY);
      };
      // HEIC and other formats the browser cannot draw are sent as they are.
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function problem(form) {
    var bad = null, msg = "";
    Array.prototype.some.call(form.querySelectorAll("[required]"), function (el) {
      if (el.type === "checkbox" || el.type === "radio") return false;
      var v = (el.value || "").trim();
      if (!v) { bad = el; msg = "Please fill in: " + labelOf(el) + "."; return true; }
      if (el.type === "email" && !EMAIL.test(v)) { bad = el; msg = "That email address does not look right."; return true; }
      return false;
    });
    if (bad) return { el: bad, msg: msg };
    Array.prototype.some.call(form.querySelectorAll("fieldset[data-required]"), function (fs) {
      if (!fs.querySelector("input:checked")) { bad = fs.querySelector("input"); msg = "Please answer: " + fs.getAttribute("data-required") + "."; return true; }
      return false;
    });
    if (bad) return { el: bad, msg: msg };
    Array.prototype.some.call(form.querySelectorAll("input[type=checkbox][data-must]"), function (cb) {
      if (!cb.checked) { bad = cb; msg = "Please tick each permission box before sending."; return true; }
      return false;
    });
    return bad ? { el: bad, msg: msg } : null;
  }

  function labelOf(el) {
    var l = el.closest("label");
    var s = l && l.querySelector("span");
    return ((s && s.textContent) || el.name || "this").replace(/\s*\*\s*$/, "").replace(/\(.*\)/, "").trim().toLowerCase();
  }

  function setup(form) {
    var err = form.querySelector("[data-err]");
    var btn = form.querySelector("button[type=submit]");
    var done = document.getElementById(form.getAttribute("data-done"));

    // Show the chosen photographs by name.
    Array.prototype.forEach.call(form.querySelectorAll("input[type=file]:not([hidden])"), function (inp) {
      var list = document.createElement("div"); list.className = "photo-list"; list.setAttribute("aria-live", "polite");
      inp.insertAdjacentElement("afterend", list);
      inp.addEventListener("change", function () {
        var max = parseInt(inp.getAttribute("data-max") || "1", 10);
        if (inp.files.length > max) { inp.value = ""; list.textContent = "Choose up to " + max + (max === 1 ? " picture." : " pictures."); return; }
        list.textContent = Array.prototype.map.call(inp.files, function (f) { return f.name; }).join(", ");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = problem(form);
      if (p) {
        err.textContent = p.msg; err.hidden = false;
        if (p.el) p.el.focus();
        return;
      }
      err.hidden = true;
      var label = btn.textContent; btn.disabled = true; btn.textContent = "Sending…";

      var fd = new FormData(form);
      var files = form.querySelectorAll("input[type=file]");
      var jobs = [];
      Array.prototype.forEach.call(files, function (inp) {
        fd.delete(inp.name);
        Array.prototype.forEach.call(inp.files, function (f) {
          jobs.push(shrink(f).then(function (small) { return [inp.name, small]; }));
        });
      });

      Promise.all(jobs).then(function (pairs) {
        var total = 0;
        pairs.forEach(function (pr) { total += pr[1].size; });
        if (total > MAX_TOTAL) throw new Error("big");
        // Netlify takes one file per field, so a second picture goes in photo-2 and
        // so on: those spare fields are declared, hidden, in each page's form.
        var used = {};
        pairs.forEach(function (pr) {
          var n = pr[0]; used[n] = (used[n] || 0) + 1;
          fd.append(used[n] === 1 ? n : n + "-" + used[n], pr[1]);
        });
        var hasFiles = pairs.length > 0;
        return fetch(form.getAttribute("action") || "/", hasFiles
          ? { method: "POST", body: fd }
          : { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fd).toString() });
      }).then(function (r) {
        if (!r.ok) throw new Error("http");
        form.hidden = true;
        if (done) { done.hidden = false; done.focus(); done.scrollIntoView({ block: "center" }); }
      }).catch(function (x) {
        btn.disabled = false; btn.textContent = label;
        err.textContent = x && x.message === "big"
          ? "Those pictures are too large to send together. Choose fewer, or send them to info@dbw-news.com."
          : "That did not go through. Please try again, or email info@dbw-news.com.";
        err.hidden = false; err.focus && err.focus();
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("form[data-dbw-form]"), setup);
})();
