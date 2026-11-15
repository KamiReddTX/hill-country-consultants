/* DBW News — what every page does: point links at the configured routes,
   show who is signed in, and make "Back" go back when it can. */
(function (w, d) {
  var R = (w.DBW_CONFIG && w.DBW_CONFIG.routes) || {};

  Array.prototype.forEach.call(d.querySelectorAll("[data-route]"), function (el) {
    var r = R[el.getAttribute("data-route")];
    if (typeof r === "string") el.href = r + (el.getAttribute("data-hash") || "");
  });

  var id = d.getElementById("identity");
  if (id && w.DBWAccount) w.DBWAccount.mountIdentity(id);

  var back = d.getElementById("back");
  if (back) back.addEventListener("click", function (e) {
    if (w.history.length > 1 && d.referrer && new URL(d.referrer).origin === w.location.origin) {
      e.preventDefault(); w.history.back();
    }
  });
})(window, document);
