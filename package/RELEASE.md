# aux4/oauth-app 0.0.4

## Added

- **Hosted-callback + poll login** (device-friendly, no loopback):
  - `GET /session/{id}` — the CLI polls this until the parked authorization code is ready (returns `{status: pending|ready|error|expired}` + the code).
  - `callback` handler — parks the code from the provider redirect, keyed by the session state, and syncs it to shared storage via `cloud-file-sync` (best-effort) so it survives across instances/redeploys. Provider **plugins** own the per-provider route (`/{provider}/callback`) that points at this handler.

## Notes

- Pairs with `aux4/oauth-app-google` / `aux4/oauth-app-x`, whose `authorize-url`/`exchange` set the redirect to `<base>/api/{provider}/callback`.
- The broker stores only short-lived **codes**, never tokens; tokens stay on the client. The parked code is useless without the client's PKCE verifier.
