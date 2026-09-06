# oauth-app callback

The OAuth redirect landing point. It parks the returned code (or error) for the
polling CLI and always renders a friendly, white-label HTML page — never raw JSON —
returning an `aux4/api` response envelope (`{ statusCode, headers, body }`) with a
`200`. The page is the only body served: the parking step's own output is discarded.

These tests drive `aux4 oauth-app callback` directly with a synthetic `query` object
(as the api runtime would pass it) and a `stateDir` pointing at a scratch session
store. A session id must be 16-200 chars to be parkable.

```beforeAll
rm -rf /tmp/oauth-app-callback-test
mkdir -p /tmp/oauth-app-callback-test
```

```afterAll
rm -rf /tmp/oauth-app-callback-test
```

## successful login

### parks the code and renders the success page

```execute
aux4 oauth-app callback --query '{"state":"sess-1234567890abcdef","code":"authcode123"}' --stateDir /tmp/oauth-app-callback-test/ok
```

```expect:partial
{"statusCode":200,**<title>You&#39;re all set</title>**
```

### the code is parked and pollable

```execute
aux4 oauth session poll --id sess-1234567890abcdef --dir /tmp/oauth-app-callback-test/ok/oauth-sessions
```

```expect:json
{
  "status": "ready",
  "code": "authcode123"
}
```

## park failure still renders a page

When parking fails (here the session store lives under an unwritable path), the
callback must still render the friendly error page and exit 0 — the browser must
never see the api's generic JSON 500. This is the AUTH-041 regression guard.

### renders the friendly error page instead of a raw JSON 500

```execute
aux4 oauth-app callback --query '{"state":"sess-1234567890abcdef","code":"authcode123"}' --stateDir /dev/null/nope
```

```expect:partial
{"statusCode":200,**<title>Something went wrong</title>**
```

### exits 0 even when park fails

```execute
aux4 oauth-app callback --query '{"state":"sess-1234567890abcdef","code":"authcode123"}' --stateDir /dev/null/nope >/dev/null 2>&1 && echo "exit-zero"
```

```expect
exit-zero
```

## user declined access

### access_denied renders the neutral no-fault page

```execute
aux4 oauth-app callback --query '{"state":"sess-1234567890abcdef","error":"access_denied"}' --stateDir /tmp/oauth-app-callback-test/declined
```

```expect:partial
{"statusCode":200,**<title>No problem</title>**
```

## provider error

### a non-declined provider error renders the friendly error page

```execute
aux4 oauth-app callback --query '{"state":"sess-1234567890abcdef","error":"server_error"}' --stateDir /tmp/oauth-app-callback-test/err
```

```expect:partial
{"statusCode":200,**<title>Something went wrong</title>**
```

## malformed link

### no state renders the expired-link page and exits 0

```execute
aux4 oauth-app callback --query '{}' --stateDir /tmp/oauth-app-callback-test/none
```

```expect:partial
{"statusCode":200,**<title>Something went wrong</title>**
```
