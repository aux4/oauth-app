# aux4/oauth-app

The **core host** for deployable OAuth provider apps. It provides the shared `aux4/api` + `aux4/oauth` machinery, a `health` endpoint, and the `oauth-app` profile that provider **plugins** extend. On its own it hosts nothing useful — you install one or more provider plugins on top:

- [`aux4/oauth-app-google`](https://hub.aux4.io/r/public/packages/aux4/oauth-app-google) — Google
- [`aux4/oauth-app-x`](https://hub.aux4.io/r/public/packages/aux4/oauth-app-x) — X (Twitter)

Each plugin **depends on this core**, adds its provider under the `oauth-app` profile (`aux4 oauth-app <provider> …`), and brings **its own routes** (its own URI shape) plus credential handling. Deployed as an `api`-type machine on [aux4.cloud](https://aux4.cloud); a machine can host several plugins at once (their routes are merged).

## Installation

You deploy plugins, not this package directly. To inspect locally:

```bash
aux4 aux4 pkger install aux4/oauth-app
```

## How it works

- The core owns the `oauth-app` profile and the `GET /health` route, and pulls in `aux4/api`, `aux4/oauth`, `aux4/config`.
- A provider plugin (e.g. `aux4/oauth-app-google`) depends on the core, registers its provider command (`aux4 oauth-app google …`), and declares its routes in its own `config.yaml` (`/google/authorize-url`, `/google/exchange`, `/google/refresh`).
- Deploy one or more plugins to a machine; each plugin's routes are added to the shared host, and every provider's credentials are set as machine environment variables.

## Deploying

```bash
# one provider
aux4 aux4 cloud deploy oauth --package aux4/oauth-app-google --api true \
  --env GOOGLE_CLIENT_ID=... --env GOOGLE_CLIENT_SECRET=...

# several providers on one machine
aux4 aux4 cloud deploy oauth \
  --package aux4/oauth-app-google --package aux4/oauth-app-x --api true \
  --env GOOGLE_CLIENT_ID=... --env GOOGLE_CLIENT_SECRET=... \
  --env X_CLIENT_ID=... --env X_CLIENT_SECRET=...
```

## Endpoint authentication

The broker restricts its CLI-facing endpoints to authenticated aux4 users of the
machine's own scope, and is **SECURE BY DEFAULT**. The core wires an `aux4/api`
`security.auth` block that runs `aux4 oauth-app auth-validate` on every request to
a route that is not marked `public: true`:

```yaml
config:
  security:
    auth:
      type: bearer
      command: aux4 oauth-app auth-validate
```

The policy is uniform for every provider on the VM — **one VM = one policy; a
different policy = a different VM.**

### Secure mode (default)

A caller must present `Authorization: Bearer <aux4 idToken>`. `auth-validate`
validates the token against the aux4 SSO `GET <sso>/userinfo` endpoint and requires
the caller to be entitled to this machine's scope:

- **SSO base URL** — `AUX4_SSO_URL` (falls back to `SSO_BASE_URL`, then
  `https://sso.aux4.io`).
- **Machine scope** — the first host label of `AUX4_CLOUD_VM_URL`
  (`https://<scope>.on.aux4.cloud/<vm>` → `<scope>`), injected automatically on
  aux4.cloud; or `OAUTH_APP_SCOPE` when that URL is absent. If neither is set the
  gate fails closed.

On success the authenticated identity is injected into the route command as
`${principal.email}`, `${principal.sub}`, and `${principal.scope}`.

### Public mode

Set **`OAUTH_APP_PUBLIC=true`** (or `OAUTH_APP_AUTH=public`) to run the broker
fully public — `auth-validate` allows every request with an anonymous principal
and no token check.

**Note:** the `type: bearer` gate rejects a request that carries **no**
`Authorization` header before `auth-validate` runs, so a fully token-less request
to a gated route is still `401`ed even in public mode. The coordinated client
change sends the aux4 idToken by default, so a token is normally present.

### Per-route `public`

Individual routes opt out of the gate with `public: true` in their `config.yaml`:

- The core marks **`GET /health`** public (liveness must never require auth).
- **`GET /session/{id}`** (login poll) stays gated by default.
- Each provider plugin marks its **`GET /{provider}/callback`** public (the
  provider's browser redirect carries no aux4 token) and its
  **`POST /{provider}/refresh`** public but rate-limited (the refresh token is
  itself the credential). `authorize-url` and `exchange` stay gated.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `OAUTH_APP_PUBLIC` | `true` runs the broker fully public (no token required) |
| `OAUTH_APP_AUTH` | `public` is an alternate spelling of the public toggle |
| `AUX4_SSO_URL` | SSO base URL for `/userinfo` (default `https://sso.aux4.io`) |
| `AUX4_CLOUD_VM_URL` | Machine URL injected by aux4.cloud; its first host label is the scope |
| `OAUTH_APP_SCOPE` | Explicit machine scope when `AUX4_CLOUD_VM_URL` is unavailable |
