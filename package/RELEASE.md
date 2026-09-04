# aux4/oauth-app

Core host for deployable OAuth provider plugins. Provides the shared api/oauth
machinery, the `oauth-app` profile that plugins extend, and `GET /health`.
Install a provider plugin (aux4/oauth-app-google, aux4/oauth-app-x) on top — each
depends on this core, registers its provider under the `oauth-app` profile, and
brings its own routes. A machine can host several plugins at once.
