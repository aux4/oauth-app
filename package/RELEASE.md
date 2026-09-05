# aux4/oauth-app 0.0.8

## Changed

- **Friendly OAuth landing page.** After a user approves, declines, or fails an
  access request in the browser, the redirect now shows a clean, self-contained
  HTML page instead of raw JSON. It is white-label (names no product or vendor),
  written in plain language, theme-aware (light/dark), mobile-first and
  accessible, with three states:
  - **success** — "You're all set. You can close this page and go back to where you started."
  - **declined** (the user chose not to grant access) — a neutral, no-fault
    "No problem" page rather than an error.
  - **failure / expired link** — a calm "Something went wrong" page with guidance
    to try again.

  The code-parking step's output no longer leaks into the browser response.
