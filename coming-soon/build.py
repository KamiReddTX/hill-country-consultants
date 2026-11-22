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

NAV = [
    ("home", "index.html", "Home"),
    ("involved", "index.html#get-involved", "Get involved"),
    ("advertise", "advertise.html", "Advertise"),
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
  <div class="bar__in">
    <a class="bar__brand" href="index.html"><img src="dbw-news-seal-64.png" alt="" width="36" height="36">DBW News</a>
    <nav class="bar__nav" aria-label="Site">{links}</nav>
  </div>
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
      <a href="https://www.instagram.com/dbwnews" rel="noopener">Instagram</a>
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
    nav = meta.get("nav", "none")
    if nav != "hero":
        links = "".join(
            '<a href="{}"{}>{}</a>'.format(href, ' aria-current="page"' if key == nav else "", label)
            for key, href, label in NAV
        )
        out += BAR.format(links=links)
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
