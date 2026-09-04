#### Description

The `auth-validate` command is the endpoint-auth gate for the OAuth broker. It is
not called directly — it is wired into the machine's `aux4/api` configuration as
`security.auth.command`, and the api runtime runs it on every request to a route
that is not marked `public: true`. Its exit code and stdout decide the request:

- **exit 0 + JSON on stdout** — the caller is authenticated; the JSON becomes the
  route command's `${principal.*}`.
- **non-zero exit** — the api returns `401 Unauthorized`.

The gate is **SECURE BY DEFAULT** and applies uniformly to every provider on the
VM (one VM = one policy; a different policy = a different VM):

- **Public toggle** — when `OAUTH_APP_PUBLIC=true` (or `OAUTH_APP_AUTH=public`),
  every gated route is allowed with an anonymous principal (`{"anonymous":true}`)
  and no token is required.
- **Secure (default)** — the caller must present `Authorization: Bearer <aux4
  idToken>`. The token is validated by calling the aux4 SSO `GET <sso>/userinfo`
  endpoint, and the caller must be entitled to **this machine's scope**:
  - The SSO base URL comes from `AUX4_SSO_URL` (falling back to `SSO_BASE_URL`,
    then `https://sso.aux4.io`).
  - The machine scope is the first host label of `AUX4_CLOUD_VM_URL`
    (`https://<scope>.on.aux4.cloud/<vm>` → `<scope>`), or `OAUTH_APP_SCOPE` when
    that URL is absent.
  - The caller's scopes are read from the userinfo `scopes` array (a
    space/comma-separated `scope` string is also accepted). A missing/invalid
    token, a missing machine scope (fail-closed), or a scope the caller does not
    hold all deny the request.

The success principal is `{"sub":"...","email":"...","scope":"<machine scope>"}`.

**Note:** the `aux4/api` `type: bearer` gate rejects a request that carries **no**
`Authorization` header before this command runs. In public mode the broker
therefore still expects a token to be present on gated routes; the coordinated
client change sends the aux4 idToken by default.

#### Usage

```bash
aux4 oauth-app auth-validate --headers '<json>' --cookies '<json>'
```

--headers   Request headers JSON (supplied by the api runtime)
--cookies   Request cookies JSON (supplied by the api runtime; unused)

Environment:

--OAUTH_APP_PUBLIC   `true` runs the broker fully public (no token required)
--OAUTH_APP_AUTH     `public` is an alternate spelling of the public toggle
--AUX4_SSO_URL       SSO base URL for `/userinfo` (default `https://sso.aux4.io`)
--AUX4_CLOUD_VM_URL  Machine URL injected by aux4.cloud; its first host label is the scope
--OAUTH_APP_SCOPE    Explicit machine scope when `AUX4_CLOUD_VM_URL` is unavailable

#### Example

```bash
OAUTH_APP_SCOPE=acme AUX4_SSO_URL=https://sso.aux4.io \
  aux4 oauth-app auth-validate --headers '{"authorization":"Bearer eyJ..."}'
```

```json
{
  "sub": "user-123",
  "email": "dev@acme.io",
  "scope": "acme"
}
```

Fully public machine:

```bash
OAUTH_APP_PUBLIC=true aux4 oauth-app auth-validate --headers '{}'
```

```json
{
  "anonymous": true
}
```
