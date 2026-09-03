#### Description

Dispatches `exchange` to the per-provider app matching `${params.provider}` (`google` → `aux4/oauth-app-google`, `x` → `aux4/oauth-app-x`), forwarding the request context (`--params` / `--query` / `--body`). The per-provider app exchanges the authorization code for tokens and reports errors. Served as `POST /{provider}/exchange`.

See `aux4/oauth-app-google` and `aux4/oauth-app-x` for the exact request/response shapes.

#### Usage

```bash
aux4 oauth-app exchange --params '{"provider":"<google|x>"}' --body '{"code":"<code>","codeVerifier":"<verifier>","redirectUri":"<uri>"}'
```

#### Example

```bash
aux4 oauth-app exchange --params '{"provider":"x"}' --body '{"code":"...","codeVerifier":"...","redirectUri":"http://127.0.0.1:9876/callback"}'
```
