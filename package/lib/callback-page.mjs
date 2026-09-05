// callback-page — renders the OAuth redirect landing page.
//
// The provider redirects the user's browser here after they approve, decline, or
// fail an access request. This module prints an aux4/api response envelope
//   { statusCode, headers: { Content-Type: text/html }, body }
// on stdout, which the api serves verbatim — so the human sees a friendly page
// instead of the raw JSON the code-parking step returns.
//
// White-label by design: it names no product or vendor, because whoever hosts
// this broker presents it as their own. Plain language only — the reader is not
// technical and may be on a phone while the thing they started is on another
// device, so every state tells them they can close the page and go back.
//
// Zero dependencies (node builtins only), so the package needs no bundling step.
//
// Usage:
//   node callback-page.mjs                -> success page
//   node callback-page.mjs --declined     -> neutral "you chose not to" page
//   node callback-page.mjs "<message>"    -> error page with that human message

const args = process.argv.slice(2);
const declined = args.includes("--declined");
const rawMessage = (args.find(a => !a.startsWith("--")) || "").trim();
const state = declined ? "declined" : rawMessage === "" ? "success" : "error";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const COPY = {
  success: {
    title: "You're all set",
    message: "You can close this page and go back to where you started."
  },
  declined: {
    title: "No problem",
    message: "Nothing was connected. You can close this page."
  },
  error: {
    title: "Something went wrong",
    message: escapeHtml(rawMessage)
  }
};

// Success = calm green check; declined = neutral muted minus (a deliberate choice,
// not a failure); error = amber alert triangle. Icons are inline SVG (no network),
// sized in em so they scale with the type. stroke-linejoin:round keeps every icon's
// corners soft so the error state reads calm, not harsh.
const ICONS = {
  success: `<circle cx="12" cy="12" r="11" class="ring"/><path d="M7 12.5l3.2 3.2L17 8.8" class="mark"/>`,
  declined: `<circle cx="12" cy="12" r="11" class="ring"/><path d="M8 12h8" class="mark"/>`,
  error: `<path d="M12 3l9.5 16.5H2.5L12 3z" class="ring"/><path d="M12 10v4" class="mark"/><circle cx="12" cy="17" r="1.1" class="dot"/>`
};

// Accent per state. Declined is intentionally neutral (the muted token) so it does
// not read as either success or alarm.
const ACCENT = {
  success: { light: "#16a34a", dark: "#4ade80" },
  declined: { light: "var(--muted)", dark: "var(--muted)" },
  error: { light: "#d97706", dark: "#fbbf24" }
};

const { title, message } = COPY[state];
const icon = ICONS[state];
const accent = ACCENT[state].light;
const accentDark = ACCENT[state].dark;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #f6f7f9;
    --card: #ffffff;
    --fg: #1a1d21;
    --muted: #5b6470;
    --border: #e6e8ec;
    --accent: ${accent};
    --shadow: 0 1px 2px rgba(16,24,40,.04), 0 12px 32px rgba(16,24,40,.08);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0d0f12;
      --card: #16191e;
      --fg: #f2f4f7;
      --muted: #9aa4b2;
      --border: #262b32;
      --accent: ${accentDark};
      --shadow: 0 1px 2px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.5);
    }
  }
  * { box-sizing: border-box; }
  html, body { min-height: 100%; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 400px;
    margin: auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: var(--shadow);
    padding: 40px 32px;
    text-align: center;
  }
  .icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    color: var(--accent);
  }
  .icon svg { width: 100%; height: 100%; display: block; }
  .icon .ring { fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; opacity: .9; }
  .icon .mark { fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .icon .dot { fill: currentColor; }
  h1 {
    margin: 0 0 10px;
    font-size: 1.375rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }
  p {
    margin: 0;
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.55;
  }
  @media (prefers-reduced-motion: no-preference) {
    .card { animation: rise .4s cubic-bezier(.2,.7,.3,1) both; }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  }
</style>
</head>
<body>
  <main class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
  </main>
</body>
</html>`;

process.stdout.write(
  JSON.stringify({
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    body: html
  })
);
