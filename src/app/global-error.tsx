"use client";

/** Last resort when even the layout fails: plain, self-contained, no blank screen. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1c26", color: "#f5efe4", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div style={{ maxWidth: 320 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500 }}>The tide pulled the page away</h1>
          <p style={{ color: "#9db9b8", fontSize: 14 }}>Something went wrong on our side. Your letters are safe.</p>
          <button onClick={() => reset()} style={{ marginTop: 16, minHeight: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#b6e6d4", color: "#0a1c26", fontWeight: 700 }}>Try again</button>
          <p style={{ marginTop: 24, fontSize: 11, color: "#9db9b8", wordBreak: "break-word" }}>Something went wrong.{error.digest ? ` · ${error.digest}` : ""}</p>
        </div>
      </body>
    </html>
  );
}
