# aux4/oauth-app 0.0.5

## Fixed

- Pin `aux4/oauth@0.1.5` so a deployed machine is guaranteed the `session park`/`poll`
  commands the `/callback` + `/session/{id}` routes depend on. Without the pin, a
  build could resolve an older cached `aux4/oauth` and the poll endpoint would 500.

## (0.0.4) Added

- **Hosted-callback + poll login**: `GET /session/{id}` (poll) and a `callback`
  handler that parks the provider's authorization code (never a token) keyed by the
  session state. Provider plugins own `/{provider}/callback`. Broker stores only
  short-lived codes; tokens stay on the client.
