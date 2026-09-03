#### Description

Dispatches `refresh` to the per-provider app matching `${params.provider}` (`google` → `aux4/oauth-app-google`, `x` → `aux4/oauth-app-x`), forwarding the request context (`--params` / `--query` / `--body`). The per-provider app renews the access token from the refresh token and reports errors. Served as `POST /{provider}/refresh`.

See `aux4/oauth-app-google` and `aux4/oauth-app-x` for the exact request/response shapes.

#### Usage

```bash
aux4 oauth-app refresh --params '{"provider":"<google|x>"}' --body '{"refreshToken":"<token>"}'
```

#### Example

```bash
aux4 oauth-app refresh --params '{"provider":"google"}' --body '{"refreshToken":"..."}'
```
