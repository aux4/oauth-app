#### Description

The OAuth redirect landing point, shared by every provider plugin. The provider
redirects the user's browser here after they approve, decline, or fail an access
request. `callback` parks the returned authorization code (or error) for the polling
CLI — keyed by the session `state` — and then renders a friendly, white-label HTML
page for the human. Register `<machine-url>/api/callback` as the redirect URI on each
provider app.

Key behaviors:

- **Always renders a page, always exits 0.** The command returns an `aux4/api`
  response envelope (`{ statusCode: 200, headers, body }`) whose body is the only
  thing served — the parking step's own JSON output is discarded. The browser never
  sees raw JSON.
- **Parking is failure-tolerant.** The code/error is parked in a subshell whose
  output is suppressed and which always exits 0; the outcome (`ok`/`failed`) is
  captured so rendering can branch. A parking failure does **not** halt the command —
  it renders the friendly error page instead. (Before this guard, a non-zero park
  halted the chain before any page rendered and the api emitted a generic JSON 500 to
  the browser.)
- **Five outcomes:**
  - **Malformed link** (no `state`) — an "expired link" page.
  - **Park failed** — the friendly error page ("We could not finish. Please close
    this page and try again.").
  - **Success** (parked, no provider error) — the success page.
  - **Declined** (`error=access_denied`) — a neutral, no-fault page.
  - **Provider error** (any other `error`) — the friendly error page.

The page names no product or vendor (white-label) and uses plain language, since the
reader may be on a phone while the flow they started runs on another device.

#### Usage

```bash
aux4 oauth-app callback [--query <json>] [--stateDir <dir>]
```

--query     Query params from the provider redirect — `code`, `state`, `error` (passed by the api runtime)
--stateDir  Base dir the cloud-file-sync keeps in S3; the session store lives under `<stateDir>/oauth-sessions` (env `CLOUD_STATE_DIR`, default `/tmp/state`)

#### Example

```bash
aux4 oauth-app callback --query '{"state":"sess-1234567890abcdef","code":"authcode123"}' --stateDir /tmp/state
```

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  },
  "body": "<!doctype html>… You're all set …"
}
```

If parking the code fails (for example the session store path is not writable), the
same `200` envelope is returned but the body is the friendly error page, and the
command still exits 0:

```bash
aux4 oauth-app callback --query '{"state":"sess-1234567890abcdef","code":"authcode123"}' --stateDir /dev/null/nope
```

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  },
  "body": "<!doctype html>… Something went wrong …"
}
```
