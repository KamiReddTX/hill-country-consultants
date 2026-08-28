"use client";
import { useEffect } from "react";

/** Site-wide scroll-reveal. Mounted once in the root layout. It tags major
 *  content blocks with [data-reveal] and fades/rises them in as they enter the
 *  viewport. Blocks already on screen at load are shown immediately (no flash),
 *  and the whole effect is skipped when the user prefers reduced motion or JS
 *  is unavailable — content is always visible by default. */
export function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    root.classList.add("js-reveal");

    const selector = "main section, main [data-reveal], main .card";
    const seen = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const vh = window.innerHeight;
    const tag = () => {
      document.querySelectorAll(selector).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const top = el.getBoundingClientRect().top;
        if (top < vh * 0.92) {
          // Already visible on load — show without animating in.
          el.setAttribute("data-reveal", "");
          el.classList.add("is-visible");
        } else {
          el.setAttribute("data-reveal", "");
          io.observe(el);
        }
      });
    };

    tag();
    // Catch content that mounts slightly later (client transitions, images, etc.).
    const t = window.setTimeout(tag, 400);

    return () => { window.clearTimeout(t); io.disconnect(); };
  }, []);

  return null;
}
