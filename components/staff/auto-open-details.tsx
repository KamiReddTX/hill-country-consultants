"use client";
import { useEffect } from "react";

/** When the page is opened with a #c-<id> hash (e.g. arriving from "Mark won →
 *  create client"), open that client's <details> and scroll it into view so the
 *  new file is obvious instead of buried in the collapsed list. */
export function AutoOpenDetails() {
  useEffect(() => {
    const open = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el && el.tagName.toLowerCase() === "details") {
        (el as HTMLDetailsElement).open = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-gold");
        setTimeout(() => el.classList.remove("ring-2", "ring-gold"), 2500);
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
