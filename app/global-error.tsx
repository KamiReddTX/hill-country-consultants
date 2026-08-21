"use client";

/** Last-resort boundary if the root layout itself errors. Must render its own
 *  <html>/<body>; globals.css may not be applied, so styles are inline. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "1.5rem", textAlign: "center", background: "#f5f1e8", color: "#20241f" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: "34em", margin: 0 }}>An unexpected error occurred. Please try again.</p>
        <button onClick={() => reset()} style={{ background: "#c2a24a", color: "#20241f", fontWeight: 600, padding: "12px 22px", border: "none", cursor: "pointer" }}>Try again</button>
      </body>
    </html>
  );
}
