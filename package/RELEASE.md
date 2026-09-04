# aux4/oauth-app 0.0.7

## Added

- **Secure-by-default endpoint auth.** Every route that is not explicitly
  `public: true` now requires a valid aux4 idToken (`Authorization: Bearer`)
  whose owner is entitled to this machine's scope, verified by the new
  `aux4 oauth-app auth-validate` command against the aux4 SSO `/userinfo`
  endpoint. `/health` and the shared `/session/{id}` poll's sibling public
  routes behave as before.
- **`disableWhenEnv: OAUTH_APP_PUBLIC`** on `security.auth` — the deploy-time
  kill switch. When the machine env sets `OAUTH_APP_PUBLIC=true`, `aux4/api`
  turns auth off wholesale and the broker serves everyone. This is the primary
  public/secure toggle; `auth-validate` also recognises the same env as a
  defensive fallback for older `aux4/api` versions.

## Notes

- One VM = one policy. A broker that needs a different auth policy is a
  different VM. Requires `aux4/api` with `disableWhenEnv` support for the
  wholesale toggle (the fallback keeps older api versions public rather than
  failing closed).
