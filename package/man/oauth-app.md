#### Description

The `oauth-app` command groups the subcommands of a combined, multi-provider OAuth service. One deployed machine serves several providers: the `{provider}` path segment (`google` or `x`) is dispatched to the matching per-provider app — `aux4/oauth-app-google` or `aux4/oauth-app-x` — which are installed as dependencies and own each provider's endpoints, scopes, and credential handling.

Designed to run as an `api`-type machine on aux4.cloud. Routes are served under the `/api` prefix:

- `GET /health` — liveness check.
- `GET /{provider}/authorize-url` — build the provider authorization URL.
- `POST /{provider}/exchange` — exchange an authorization code for tokens.
- `POST /{provider}/refresh` — renew an access token from a refresh token.

Credentials are machine environment variables per provider (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `X_CLIENT_ID` / `X_CLIENT_SECRET`); set only the providers you use.

#### Usage

```bash
aux4 oauth-app <subcommand>
```

#### Example

```bash
curl "https://<machine-url>/api/google/authorize-url?redirectUri=http://127.0.0.1:9876/callback"
curl "https://<machine-url>/api/x/authorize-url?redirectUri=http://127.0.0.1:9876/callback"
```
