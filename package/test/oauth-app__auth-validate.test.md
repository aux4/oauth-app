# oauth-app auth-validate

The endpoint-auth gate the api runs as `security.auth.command`. These tests drive
its decision logic directly, stubbing the SSO `/userinfo` endpoint with a local
mock server so nothing hits the real SSO.

A local mock stands in for the aux4 SSO `/userinfo` endpoint, answering based on
the Bearer token so tests can exercise valid / wrong-scope / invalid cases. It is
started inline in `beforeAll` (a `file:` fixture would not yet exist when the hook
runs) and listens on `127.0.0.1:19987`.

```beforeAll
nohup node -e "const http=require('http');http.createServer((q,r)=>{const a=q.headers['authorization']||'';const t=a.startsWith('Bearer ')?a.slice(7):'';if(t==='valid-acme'){r.writeHead(200,{'Content-Type':'application/json'});r.end(JSON.stringify({sub:'user-123',email:'dev@acme.io',scopes:['acme','other']}));return;}if(t==='wrong-scope'){r.writeHead(200,{'Content-Type':'application/json'});r.end(JSON.stringify({sub:'user-456',email:'x@other.io',scopes:['other']}));return;}r.writeHead(401);r.end();}).listen(19987,'127.0.0.1');" >/dev/null 2>&1 &
sleep 1
```

```afterAll
pkill -f 19987
```

## public mode allows all with no token

### OAUTH_APP_PUBLIC=true returns an anonymous principal

```execute
OAUTH_APP_PUBLIC=true aux4 oauth-app auth-validate --headers '{}'
```

```expect:json
{
  "anonymous": true
}
```

### OAUTH_APP_AUTH=public is an accepted alias

```execute
OAUTH_APP_AUTH=public aux4 oauth-app auth-validate --headers '{}'
```

```expect:json
{
  "anonymous": true
}
```

## secure mode denies a request with no token

### missing Authorization header exits non-zero

```execute
OAUTH_APP_SCOPE=acme AUX4_SSO_URL=http://127.0.0.1:19987 aux4 oauth-app auth-validate --headers '{}'
```

```error:partial
Authentication required
```

## secure mode allows a valid same-scope token

### valid token whose scopes include the machine scope

```execute
OAUTH_APP_SCOPE=acme AUX4_SSO_URL=http://127.0.0.1:19987 aux4 oauth-app auth-validate --headers '{"authorization":"Bearer valid-acme"}'
```

```expect:json
{
  "sub": "user-123",
  "email": "dev@acme.io",
  "scope": "acme"
}
```

### machine scope derived from AUX4_CLOUD_VM_URL host label

```execute
AUX4_CLOUD_VM_URL=https://acme.on.aux4.cloud/oauth-broker AUX4_SSO_URL=http://127.0.0.1:19987 aux4 oauth-app auth-validate --headers '{"authorization":"Bearer valid-acme"}'
```

```expect:json
{
  "sub": "user-123",
  "email": "dev@acme.io",
  "scope": "acme"
}
```

## secure mode denies a scope mismatch

### valid token without the machine scope exits non-zero

```execute
OAUTH_APP_SCOPE=acme AUX4_SSO_URL=http://127.0.0.1:19987 aux4 oauth-app auth-validate --headers '{"authorization":"Bearer wrong-scope"}'
```

```error:partial
Access denied: no permission for scope 'acme'
```

## secure mode denies an invalid token

### a token the SSO rejects exits non-zero

```execute
OAUTH_APP_SCOPE=acme AUX4_SSO_URL=http://127.0.0.1:19987 aux4 oauth-app auth-validate --headers '{"authorization":"Bearer bogus"}'
```

```error:partial
Invalid or expired token
```
