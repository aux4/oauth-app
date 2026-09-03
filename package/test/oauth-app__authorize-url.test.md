# oauth-app authorize-url

The combined app dispatches `/{provider}/authorize-url` to the matching per-provider
app (`aux4/oauth-app-google`, `aux4/oauth-app-x`) by `${params.provider}`. These
tests exercise the dispatch and the error paths; they need the per-provider apps
installed (they are dependencies).

## when provider is missing

```execute
aux4 oauth-app authorize-url
```

```error:partial
Error: provider is required
```

## when provider is not supported

```execute
aux4 oauth-app authorize-url --params '{"provider":"slack"}'
```

```error:partial
Error: provider 'slack' is not supported
```

## dispatches google to the Google app

```execute
GOOGLE_CLIENT_ID=test-google aux4 oauth-app authorize-url --params '{"provider":"google"}' --query '{"redirectUri":"http://127.0.0.1:9876/callback"}'
```

```expect:partial
"url":"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=test-google
```

## dispatches x to the X app

```execute
X_CLIENT_ID=test-x aux4 oauth-app authorize-url --params '{"provider":"x"}' --query '{"redirectUri":"http://127.0.0.1:9876/callback"}'
```

```expect:partial
"url":"https://x.com/i/oauth2/authorize?response_type=code&client_id=test-x
```

## propagates the per-provider error when credentials are missing

```execute
GOOGLE_CLIENT_ID= aux4 oauth-app authorize-url --params '{"provider":"google"}' --query '{"redirectUri":"http://127.0.0.1:9876/callback"}'
```

```error:partial
Error: provider 'google' has no client credentials configured
```
