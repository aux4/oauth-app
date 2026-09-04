// auth-validate — the aux4/api `security.auth.command` for the OAuth broker.
//
// It is the decision function the api runtime runs on every gated request. The
// api invokes it as:
//   aux4 oauth-app auth-validate --cookies '<json>' --headers '<json>'
// and reads the result from exit code + stdout:
//   exit 0 + JSON on stdout  -> authenticated; the JSON becomes the route
//                               command's `${principal.*}`.
//   non-zero exit            -> the api returns 401 (Unauthorized).
//
// Policy (uniform for the whole VM; a different policy = a different VM):
//   * SECURE BY DEFAULT.
//   * OAUTH_APP_PUBLIC=true (or OAUTH_APP_AUTH=public) -> allow everyone with an
//     anonymous principal, no token required.
//   * Otherwise require `Authorization: Bearer <aux4 idToken>`, validate it
//     against the aux4 SSO `GET <sso>/userinfo` endpoint, and require the caller
//     to be entitled to THIS machine's scope.
//
// Zero third-party dependencies — only node builtins, so the package needs no
// bundling step.
import http from "node:http";
import https from "node:https";

const DEFAULT_SSO_BASE_URL = "https://sso.aux4.io";

// Parse the machine scope out of the aux4.cloud machine URL. aux4.cloud injects
// AUX4_CLOUD_VM_URL as `https://<scope>.on.aux4.cloud/<vm>` (dev:
// `https://<scope>.on.dev.aux4.cloud/<vm>`). The scope is the first host label.
export function scopeFromVmUrl(vmUrl) {
  if (!vmUrl) return "";
  try {
    const host = new URL(vmUrl).hostname;
    if (!host) return "";
    return host.split(".")[0] || "";
  } catch {
    return "";
  }
}

// Collect the scopes the SSO userinfo response attributes to the caller. The api
// oauth session gate reads a `scopes` array claim populated from SSO userinfo; we
// accept that plus a space/comma separated `scope` string for robustness.
export function callerScopes(user) {
  const scopes = [];
  if (user && Array.isArray(user.scopes)) {
    for (const s of user.scopes) if (typeof s === "string" && s) scopes.push(s);
  }
  if (user && typeof user.scope === "string") {
    for (const s of user.scope.split(/[\s,]+/)) if (s) scopes.push(s);
  }
  return scopes;
}

// Decide public vs secure from the two accepted toggles.
export function isPublicMode(oauthAppPublic, oauthAppAuth) {
  if ((oauthAppPublic || "").trim().toLowerCase() === "true") return true;
  if ((oauthAppAuth || "").trim().toLowerCase() === "public") return true;
  return false;
}

// Pull the Bearer token out of the (already lowercased by the api) headers object.
export function bearerToken(headers) {
  const raw = (headers && (headers.authorization || headers.Authorization)) || "";
  if (typeof raw !== "string" || !raw.startsWith("Bearer ")) return "";
  return raw.slice(7).trim();
}

function getUserInfo(ssoBaseUrl, token) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(`${ssoBaseUrl.replace(/\/+$/, "")}/userinfo`);
    } catch (error) {
      reject(error);
      return;
    }
    const transport = url.protocol === "http:" ? http : https;
    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "http:" ? 80 : 443),
        path: url.pathname + url.search,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      },
      res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`userinfo responded ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function deny(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main() {
  const [headersJson = "{}", oauthAppPublic = "", oauthAppAuth = "", ssoUrlArg = "", vmUrl = "", scopeEnv = ""] =
    process.argv.slice(2);

  // Public mode: allow all with an anonymous principal, no token required.
  if (isPublicMode(oauthAppPublic, oauthAppAuth)) {
    process.stdout.write(JSON.stringify({ anonymous: true }));
    process.exit(0);
  }

  // Secure mode.
  let headers = {};
  try {
    headers = JSON.parse(headersJson || "{}") || {};
  } catch {
    headers = {};
  }

  const token = bearerToken(headers);
  if (!token) deny("Authentication required");

  const ssoBaseUrl =
    (ssoUrlArg && ssoUrlArg.trim()) ||
    (process.env.SSO_BASE_URL && process.env.SSO_BASE_URL.trim()) ||
    DEFAULT_SSO_BASE_URL;
  const machineScope = (scopeEnv && scopeEnv.trim()) || scopeFromVmUrl(vmUrl);

  // Fail CLOSED: without a machine scope we cannot verify entitlement.
  if (!machineScope) deny("machine scope not configured (set AUX4_CLOUD_VM_URL or OAUTH_APP_SCOPE)");

  let user;
  try {
    user = await getUserInfo(ssoBaseUrl, token);
  } catch (error) {
    deny(`Invalid or expired token: ${error.message}`);
  }

  if (!user || !user.sub) deny("Invalid user identity");

  const scopes = callerScopes(user);
  if (!scopes.includes(machineScope)) {
    deny(`Access denied: no permission for scope '${machineScope}'`);
  }

  process.stdout.write(JSON.stringify({ sub: user.sub, email: user.email || "", scope: machineScope }));
  process.exit(0);
}

main().catch(error => deny(`auth-validate failed: ${error.message}`));
