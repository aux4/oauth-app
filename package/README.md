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
