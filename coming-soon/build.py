"""DBW News holding site: assemble public/*.html from pages/*.html.

Each file in pages/ starts with three lines:
    title: <browser tab title>
    description: <search-engine description>
    nav: <home|involved|advertise|none>
then a blank line, then the page's own HTML. This script wraps it in the
shared <head>, top bar and footer, and writes public/<same name>.

Run after editing a page:   python3 build.py
Netlify does not run this; the built pages in public/ are what it serves.
"""
import html
import pathlib

ROOT = pathlib.Path(__file__).parent
SITE = "https://www.dbw-news.com"

# Stripe Payment Links for donations (Stripe dashboard > Payment Links,
# "Customers choose what to pay"). Paste each link between the quotes and run
# this script. While a link is empty, the Donate page explains how to give by
# check instead of showing a button that goes nowhere.
# Heyzine flipbook links for past issues. Paste each issue's share link
# (https://heyzine.com/flip-book/...) and run this script; the issue's
# "Read the issue" button switches on.
FLIPBOOKS = {
    "2025-01": "",
    "2025-02": "",
    "2025-03": "",
    "2025-04": "",
    "2025-05": "",
    "2025-06": "",
}

PAST_ISSUES = [
    ("2025-01", 1, "January 2025", "Turning Purpose to Profit", "June Marie Outlaw", "Premier Edition"),
    ("2025-02", 2, "February 2025", "I See My Baby Inc.", "Alicia Hurtt", ""),
    ("2025-03", 3, "March 2025", "WorxK Solutions", "Dr. Kristy Taylor", "Women's History Month Edition"),
    ("2025-04", 4, "April 2025", "Publishing Conscious Dreams", "Daniella Blechner", ""),
    ("2025-05", 5, "May 2025", "A Mother's Legacy of Leadership and Love", "Dr. Nikki & Briana Harris", "Mother's Day Edition"),
    ("2025-06", 6, "June 2025", "The Architect of Fortitude: The Unbreakable Spirit", "Kami Redd", "Premier Edition (6 Month Birthday)"),
]


def past_issues() -> str:
    cards = []
    for ym, no, month, title, featured, edition in reversed(PAST_ISSUES):
        link = FLIPBOOKS.get(ym, "")
        ok = link.startswith("https://heyzine.com/")
        credit = " &middot; ".join(x for x in [("Featuring " + html.escape(featured)) if featured else "", html.escape(edition)] if x)
        cover = '<img src="covers/{}.jpg" alt="{} cover, Issue #{}" width="600" height="783" loading="lazy">'.format(ym, month, no)
        if ok:
            cover = '<a href="{}" rel="noopener" aria-label="Read the {} issue">{}</a>'.format(html.escape(link, quote=True), month, cover)
            action = '<a class="btn btn--ink btn--block" href="{}" rel="noopener">Read the issue</a>'.format(html.escape(link, quote=True))
        else:
            action = '<span class="issue__soon">Flipbook coming soon</span>'
        cards.append(
            '<li class="issue"><div class="issue__cover">{cover}</div>'
            '<div class="issue__when">{month} &middot; Issue #{no}</div>'
            '<h3 class="issue__title">{title}</h3>'
            '{credit}{action}</li>'.format(
                cover=cover, month=month, no=no, title=html.escape(title),
                credit=('<div class="issue__credit">' + credit + '</div>') if credit else "", action=action))
    return '<ul class="issues">' + "".join(cards) + "</ul>"


DONATE_ONCE = ""
DONATE_MONTHLY = ""


def give_buttons() -> str:
    def ok(u):
        return u.startswith("https://buy.stripe.com/") or u.startswith("https://donate.stripe.com/")
    links = []
    if ok(DONATE_ONCE):
        links.append('<a class="btn btn--block" href="{}" rel="noopener">Give once</a>'.format(html.escape(DONATE_ONCE, quote=True)))
    if ok(DONATE_MONTHLY):
        links.append('<a class="btn btn--ink btn--block" href="{}" rel="noopener">Give monthly</a>'.format(html.escape(DONATE_MONTHLY, quote=True)))
    if links:
        return '<div class="give">' + "".join(links) + '</div><p class="fine">You choose the amount on the next screen, a secure Stripe checkout.</p>'
    return ('<div class="give-soon"><strong>Online giving opens shortly.</strong> To give now, mail a check payable to '
            'Dynamic Black Women Media, Inc. to Atlanta, Georgia, or write to '
            '<a href="mailto:info@dbw-news.com?subject=I%20would%20like%20to%20give">info@dbw-news.com</a> and we will send you a secure link.</div>')

NAV = [
    ("home", "index.html", "Home"),
    ("past-issues", "past-issues.html", "Past Issues"),
    ("her-flowers", "her-flowers.html", "Her Flowers"),
    ("she-showed-up", "she-showed-up.html", "She Showed Up"),
    ("be-featured", "be-featured.html", "Be Featured"),
    ("letters", "letters.html", "DBW Letters"),
    ("write-for-us", "write-for-us.html", "Write for Us"),
    ("advertise", "advertise.html", "Advertise"),
    ("donate", "donate.html", "Donate"),
]

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#14110F">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:site_name" content="DBW News">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{site}/dbw-news-seal-512.png">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="dbw-news-seal-64.png">
<link rel="apple-touch-icon" href="dbw-news-seal-512.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Archivo:wght@400;600;700&display=swap">
<link rel="stylesheet" href="site.css">
</head>
<body>
<a class="skip" href="#main">Skip to the page</a>
"""

BAR = """<header class="bar dark">
  <div class="bar__in bar__in--three">
    <a class="bar__give" href="donate.html">Donate</a>
    <a class="bar__brand" href="index.html"><img src="dbw-news-seal-64.png" alt="" width="36" height="36">DBW News</a>
    <details class="menu">
      <summary class="menu__btn"><span class="menu__icon" aria-hidden="true"></span>Menu</summary>
      <nav class="menu__list" aria-label="Site menu">{links}</nav>
    </details>
  </div>
  <nav class="tabs" aria-label="Site">{links}</nav>
</header>
"""

FOOT = """<footer class="dark">
  <div class="foot">
    <strong>DBW News</strong>
    <nav class="foot__links" aria-label="Get involved">
      <a href="her-flowers.html">Her Flowers</a>
      <a href="she-showed-up.html">She Showed Up</a>
      <a href="be-featured.html">Be featured</a>
      <a href="letters.html">DBW Letters</a>
      <a href="write-for-us.html">Write for us</a>
      <a href="advertise.html">Advertise</a>
      <a href="donate.html">Donate</a>
    </nav>
    <nav class="foot__links foot__links--social" aria-label="Listen and follow">
      <a href="past-issues.html">Past issues</a>
      <a href="https://chefkami.wixsite.com/dear-black-woman" rel="noopener">Past articles</a>
      <a href="https://open.spotify.com/show/3oVotvLqIbKtIohgXUTTph" rel="noopener">Podcast on Spotify</a>
      <a href="https://podcasts.apple.com/us/podcast/dear-black-woman/id1775101234" rel="noopener">Apple Podcasts</a>
      <a href="https://www.youtube.com/@DearBlackWomanMedia" rel="noopener">YouTube</a>
      <a href="https://www.instagram.com/dbwnews" rel="noopener">Instagram @dbwnews</a>
    </nav>
    Dynamic Black Women Media, Inc. (formerly Dear Black Woman Media, Inc.) is a 501(c)(3) public charity (509(a)(2)). Contributions are tax-deductible to the extent allowed by law. EIN: 33-3726585. Published by Redd Ladys Chronicles Publishing &amp; Production.
    <div class="foot__row">
      <span><a href="mailto:info@dbw-news.com">info@dbw-news.com</a> &middot; (470) 236-1755</span>
      <span>Atlanta, Georgia</span>
    </div>
  </div>
</footer>
"""


def build(src: pathlib.Path) -> None:
    text = src.read_text(encoding="utf-8")
    head, body = text.split("\n\n", 1)
    meta = dict(line.split(": ", 1) for line in head.splitlines())
    name = src.name
    canonical = SITE + "/" + ("" if name == "index.html" else name.replace(".html", ""))
    out = HEAD.format(
        title=html.escape(meta["title"], quote=True),
        description=html.escape(meta["description"], quote=True),
        canonical=canonical,
        site=SITE,
    )
    nav = meta.get("nav", name.replace(".html", ""))
    if nav != "hero":
        links = "".join(
            '<a href="{}"{}>{}</a>'.format(href, ' aria-current="page"' if key == nav else "", label)
            for key, href, label in NAV
        )
        out += BAR.format(links=links)
    body = body.replace("<!--GIVE-BUTTONS-->", give_buttons())
    body = body.replace("<!--PAST-ISSUES-->", past_issues())
    out += body.rstrip() + "\n\n" + FOOT
    uses_form = "data-dbw-form" in body
    if uses_form:
        out += '<script src="form.js"></script>\n'
    out += "</body>\n</html>\n"
    (ROOT / "public" / name).write_text(out, encoding="utf-8")
    print("built", name)


if __name__ == "__main__":
    for page in sorted((ROOT / "pages").glob("*.html")):
        build(page)
