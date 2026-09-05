# aux4/oauth-app

## Fixed: depend on aux4/oauth 0.1.7 (Lambda-safe session store)

Bumped the pinned dependency `aux4/oauth` from `0.1.5` to `0.1.7`.

`0.1.5` used a **local** session store for the hosted-callback park/poll flow,
which does not work on an ephemeral, multi-instance runtime (a session parked in
one Lambda invocation is invisible to the invocation that polls it). `0.1.6+`
moved the session store to the shared S3-via-mint backend, which is required for
the broker to run on aux4.cloud.

With this fix, installing a provider plugin (`aux4/oauth-app-google`,
`aux4/oauth-app-x`) transitively pulls the correct, Lambda-safe `aux4/oauth` —
so a broker deployment only needs to list the provider plugins, never the core
or the oauth primitive.
