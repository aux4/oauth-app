#### Description

Dispatches `authorize-url` to the per-provider app matching `${params.provider}` (`google` → `aux4/oauth-app-google`, `x` → `aux4/oauth-app-x`), forwarding the request context (`--params` / `--query` / `--body`). The per-provider app builds the authorization URL and reports errors (unknown provider or missing credentials). Served as `GET /{provider}/authorize-url`.

See `aux4/oauth-app-google` and `aux4/oauth-app-x` for the exact request/response shapes.

#### Usage

```bash
aux4 oauth-app authorize-url --params '{"provider":"<google|x>"}' --query '{"redirectUri":"<uri>","scopes":"<scopes>","state":"<state>"}'
```

#### Example

```bash
aux4 oauth-app authorize-url --params '{"provider":"google"}' --query '{"redirectUri":"http://127.0.0.1:9876/callback"}'
```
