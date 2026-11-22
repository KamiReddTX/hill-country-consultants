/* DBW News — the issue calendar.

   The one list of issues the whole site reads. Add a line per issue; the
   current, latest and next issue are worked out from the clock.

   The schedule, every month: an issue goes online on the 8th and copies are
   posted on the 15th. Print-and-online readers get it a week before the post.

   The back catalogue was read off the covers: seven monthly issues, January to
   July 2025, published under Redd Ladys Chronicles. The magazine paused after
   July and relaunches in January 2027 with Issue #8. */
(function (w) {
  var ONLINE_DAY = 8;
  var MAIL_DAY = 15;

  var ISSUES = [
    { ym: "2025-01", no: 1, title: "Turning Purpose to Profit",
      featured: "June Marie Outlaw", edition: "Premier Edition", cover: "assets/covers/2025-01.jpg" },
    { ym: "2025-02", no: 2, title: "I See My Baby Inc.",
      featured: "Alicia Hurtt", edition: "", cover: "assets/covers/2025-02.jpg" },
    { ym: "2025-03", no: 3, title: "WorxK Solutions",
      featured: "Dr. Kristy Taylor", edition: "Women's History Month Edition", cover: "assets/covers/2025-03.jpg" },
    { ym: "2025-04", no: 4, title: "Publishing Conscious Dreams",
      featured: "Daniella Blechner", edition: "", cover: "assets/covers/2025-04.jpg" },
    { ym: "2025-05", no: 5, title: "A Mother's Legacy of Leadership and Love",
      featured: "Dr. Nikki & Briana Harris", edition: "Mother's Day Edition", cover: "assets/covers/2025-05.jpg" },
    { ym: "2025-06", no: 6, title: "The Architect of Fortitude: The Unbreakable Spirit",
      featured: "Kami Redd", edition: "Premier Edition (6 Month Birthday)", cover: "assets/covers/2025-06.jpg" },
    { ym: "2025-07", no: 7, title: "Reclaiming the Fourth: The Unfinished Promise of Freedom",
      featured: "", edition: "4th of July Edition", cover: "assets/covers/2025-07.jpg" },
    { ym: "2027-01", no: 8, title: "The Power of Her: Then. Now. Next.",
      featured: "", edition: "The Relaunch Issue", cover: "",
      blurb: "From Georgia\u2019s Historic Election to America\u2019s Political Future." },
    // Numbered once February to April are set.
    { ym: "2027-05", no: null, title: "Should We Re-Segregate Our Children?",
      featured: "", edition: "", cover: "",
      blurb: "Six institutions: the classroom, the squad car, the exam room, the caseworker\u2019s office, the newsroom, and the first job and first campus." }
  ];

  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

  function dateOf(ym, day) {
    var p = String(ym).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, day, 12, 0, 0);
  }
  function ymOf(dt) {
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
  }
  function monthName(ym) {
    var p = String(ym).split("-");
    return (MONTHS[Number(p[1]) - 1] || "") + " " + p[0];
  }
  // "15 November", the way the page copy writes a date.
  function dayLabel(ym, day) {
    return day + " " + MONTHS[Number(String(ym).split("-")[1]) - 1];
  }
  function find(ym) {
    for (var i = 0; i < ISSUES.length; i++) if (ISSUES[i].ym === ym) return ISSUES[i];
    return null;
  }
  function isOnline(ym, now) { return dateOf(ym, ONLINE_DAY) <= (now || new Date()); }

  // Issues that have actually gone online, newest first.
  function published(now) {
    return ISSUES.filter(function (i) { return isOnline(i.ym, now); }).slice().reverse();
  }

  function describe(i) {
    return {
      ym: i.ym, no: i.no || null, title: i.title || "", featured: i.featured || "",
      edition: i.edition || "", cover: i.cover || "", blurb: i.blurb || "",
      month: monthName(i.ym),
      online: dayLabel(i.ym, ONLINE_DAY), mails: dayLabel(i.ym, MAIL_DAY)
    };
  }

  // The issue to put at the top of the archive: this month's if it is out,
  // otherwise the next one coming, otherwise the latest we have.
  function featured(now) {
    now = now || new Date();
    var mine = find(ymOf(now));
    if (mine) return describe(mine);
    var ahead = ISSUES.filter(function (i) { return !isOnline(i.ym, now); });
    if (ahead.length) return describe(ahead[0]);
    var live = published(now);
    return live.length ? describe(live[0]) : null;
  }

  function earliest() { return ISSUES.length ? ISSUES[0].ym : null; }

  // "seven issues, back to January 2025"
  function backToLine(now) {
    var n = published(now).length;
    return (numberWord(n) + (n === 1 ? " issue" : " issues")) + ", back to " + monthName(ISSUES[0].ym);
  }

  function numberWord(n) {
    return ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);
  }

  // The calendar lives in the database once Supabase is connected, edited from
  // manage.html. The list above is the fallback the site shows until then, or
  // if the database cannot be reached. refresh() swaps the database rows in.
  function coverUrl(path, client) {
    if (!path) return "";
    if (/^(assets\/|https?:)/.test(path)) return path;
    return client ? client.storage.from("covers").getPublicUrl(path).data.publicUrl : "";
  }
  var loading = null;
  function refresh() {
    if (loading) return loading;
    var client = w.DBWAccount && w.DBWAccount.client;
    if (!client) return (loading = Promise.resolve(false));
    loading = client.from("issues").select("ym, no, title, featured, edition, blurb, cover_path").order("ym")
      .then(function (r) {
        if (r.error || !r.data || !r.data.length) return false;
        var rows = r.data.map(function (x) {
          return { ym: x.ym, no: x.no, title: x.title, featured: x.featured, edition: x.edition,
                   blurb: x.blurb, cover: coverUrl(x.cover_path, client), cover_path: x.cover_path };
        });
        ISSUES.splice.apply(ISSUES, [0, ISSUES.length].concat(rows));
        return true;
      })
      .catch(function () { return false; });
    return loading;
  }

  w.DBWIssue = {
    refresh: refresh, coverUrl: coverUrl,
    ISSUES: ISSUES, ONLINE_DAY: ONLINE_DAY, MAIL_DAY: MAIL_DAY,
    monthName: monthName, dayLabel: dayLabel, find: find, isOnline: isOnline,
    published: published, featured: featured, describe: describe,
    earliest: earliest, backToLine: backToLine, numberWord: numberWord
  };
})(window);
