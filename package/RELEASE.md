# aux4/oauth-app 0.0.1

Initial release: a combined, multi-provider OAuth service. One deployed machine
serves Google and X — the `{provider}` path segment is dispatched to the
per-provider apps (`aux4/oauth-app-google`, `aux4/oauth-app-x`, installed as
dependencies). Set `GOOGLE_*` and/or `X_*` env vars for the providers you use.
