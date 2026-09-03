# aux4/oauth-app

Deploy **one** OAuth service that handles **multiple providers** (Google + X) in one click. It holds your OAuth client credentials server-side and does the authorization-URL build, the code exchange, and the token refresh on behalf of your CLI tools — so those tools **never handle a client secret**, and everything runs under **your** apps, on **one** VM.

It composes the per-provider apps [`aux4/oauth-app-google`](https://hub.aux4.io/r/public/packages/aux4/oauth-app-google) and [`aux4/oauth-app-x`](https://hub.aux4.io/r/public/packages/aux4/oauth-app-x) (installed as dependencies): the `{provider}` path segment is dispatched to the matching app. Deployed as an `api`-type machine on [aux4.cloud](https://aux4.cloud). The package itself contains **no secrets**.

## Quick start

1. **Deploy it.** From the [hub package page](https://hub.aux4.io/r/public/packages/aux4/oauth-app), click **Deploy to cloud** (or `aux4 aux4 cloud deploy oauth-app --package aux4/oauth-app --api true`). You get a URL like `https://<your-scope>.on.aux4.cloud/oauth-app`.

2. **Add whichever provider credentials you have** (encrypted at rest, applied immediately):

   ```bash
   aux4 aux4 cloud oauth-app env set \
     GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
     X_CLIENT_ID=... X_CLIENT_SECRET=...
   ```

   Set only the ones you use — a provider with no credentials simply returns an error until configured.

3. **Point your CLI at it**, per provider:

   ```
   https://<your-scope>.on.aux4.cloud/oauth-app/api/google/authorize-url?redirectUri=...
   https://<your-scope>.on.aux4.cloud/oauth-app/api/x/authorize-url?redirectUri=...
   ```

## Installation

You do not normally install this package locally — you deploy it. To inspect or run it locally:

```bash
aux4 aux4 pkger install aux4/oauth-app
```

## Endpoints

Served under the `/api` prefix. `{provider}` is `google` or `x`.

| Route | Purpose |
|-------|---------|
| `GET /health` | Liveness check → `{"status":"ok"}` |
| `GET /{provider}/authorize-url` | Build the provider authorization URL (returns `url`, `codeVerifier`, `state`) |
| `POST /{provider}/exchange` | Exchange an authorization `code` for tokens |
| `POST /{provider}/refresh` | Renew an access token from a `refreshToken` |

Each route is dispatched to the matching per-provider app, which owns the provider's endpoints, scopes, and credential handling. See [`aux4/oauth-app-google`](https://hub.aux4.io/r/public/packages/aux4/oauth-app-google) and [`aux4/oauth-app-x`](https://hub.aux4.io/r/public/packages/aux4/oauth-app-x) for the per-provider request/response details and configuration (`GOOGLE_*` / `X_*` env vars, `GOOGLE_SCOPES` / `X_SCOPES`).

## Configuration

| Environment variable | Provider | Description |
|----------------------|----------|-------------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google | Google OAuth client credentials |
| `GOOGLE_SCOPES` | Google | Default Google scopes (optional) |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X | X OAuth client credentials (`X_CLIENT_SECRET` only for a confidential Web App client) |
| `X_SCOPES` | X | Default X scopes (optional) |

## When to use this vs the per-provider apps

- **`aux4/oauth-app`** (this package) — one machine for several providers; lower cost, one place for all creds.
- **`aux4/oauth-app-google`** / **`aux4/oauth-app-x`** — a focused single-provider deploy.

## Security

The endpoints are **unauthenticated** (by design for the loopback CLI login model). Treat the URL as semi-sensitive, register only the callback URIs your clients use, and keep scopes minimal. A scope allowlist is a planned addition.
