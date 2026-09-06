import crypto from "node:crypto";
import http from "node:http";
import type { GraphqlRequestBody } from "./graphql";
import { forwardGraphqlRequest } from "./graphql";
import {
  createTokenManager,
  NonJsonUpstreamResponseError,
  type TokenEnv,
  type TokenManager,
} from "./token";

export interface RelayEnv extends TokenEnv {
  SHOPIFY_RELAY_SECRET?: string;
}

// Read cap for a client-supplied /graphql body. Auth is checked before
// readBody runs, so this only bounds an already-authenticated caller — but
// an unbounded buffer is still a self-inflicted memory exhaustion risk on a
// single always-on machine, and no legitimate {query, variables} payload
// approaches 1 MiB.
const MAX_BODY_BYTES = 1024 * 1024;

/** Thrown by readBody when the request body exceeds MAX_BODY_BYTES. */
class PayloadTooLargeError extends Error {}

/**
 * Constant-time string comparison. Hashing both inputs first normalizes them
 * to equal-length buffers before crypto.timingSafeEqual, so no early
 * length-comparison bail is needed (which would itself leak timing).
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function isValidRelaySecret(
  env: RelayEnv,
  provided: string | undefined,
): boolean {
  if (!env.SHOPIFY_RELAY_SECRET) return false;
  if (!provided) return false;
  return timingSafeStringEqual(provided, env.SHOPIFY_RELAY_SECRET);
}

function relaySecretHeader(req: http.IncomingMessage): string | undefined {
  const provided = req.headers["x-relay-secret"];
  return Array.isArray(provided) ? provided[0] : provided;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    // req.destroy() tears down the underlying socket, which on HTTP/1.1 is
    // shared with the response — destroying it here (before a response is
    // written) would prevent the 413 from ever reaching the client. So this
    // just stops buffering and rejects; the caller is responsible for
    // destroying the connection once its error response has been sent.
    let settled = false;
    req.on("data", (chunk: Buffer) => {
      if (settled) return;
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        settled = true;
        reject(new PayloadTooLargeError("request body exceeds 1 MiB"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

/**
 * Writes a relay-originated error as JSON, matching Shopify's own
 * `{"errors":[{"message":...}]}` shape. `fetchShopifyJson` on the client
 * (functions/api/_lib/shopify.ts) only retries a *non-JSON* response — so a
 * relay-side rejection (bad secret, bad body, upstream failure) now surfaces
 * to `createShopifyClient`'s existing `json.errors` branch immediately,
 * instead of burning all 5 retry attempts (~4.5s) on what is never going to
 * become valid JSON by trying again.
 */
function sendJsonError(
  res: http.ServerResponse,
  status: number,
  message: string,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ errors: [{ message }] }));
}

/**
 * Mutable per-request scratch space for facts the access log wants but the
 * response itself doesn't carry — currently just the status Shopify replied
 * with, which is the difference between "the relay rejected this" and "the
 * relay forwarded it and Shopify rejected it".
 */
interface RequestOutcome {
  upstreamStatus?: number;
}

/**
 * One structured line per request, emitted on response finish.
 *
 * Deliberately metadata only: method, path, the status we returned, the
 * status Shopify returned, and elapsed time. No bodies, no headers, no
 * token, no secret — the relay handles the Shopify client secret and a
 * shared relay secret, and an access log is the classic place both leak.
 * A test asserts none of them reach console.
 *
 * This exists because ADR-0003 calls for an observation period after
 * cutover to decide whether the static egress IP actually fixed the WAF
 * challenges, and until now the relay logged nothing at all — leaving no
 * way to tell a relay-side rejection from a Shopify-side one when a form
 * failed.
 */
function logRequest(
  method: string,
  path: string,
  status: number,
  startedAt: number,
  outcome: RequestOutcome,
): void {
  console.log(
    JSON.stringify({
      method,
      // Bound an arbitrary client-supplied URL so a long path can't bloat
      // the log line.
      path: path.slice(0, 100),
      status,
      upstreamStatus: outcome.upstreamStatus,
      ms: Date.now() - startedAt,
    }),
  );
}

/**
 * Runs a GraphQL request through the token manager and writes the result (or
 * failure) to the response. Shared by /graphql and /verify so there is one
 * fetch/error-handling path rather than two.
 */
async function forwardAndRespond(
  env: RelayEnv,
  tokenManager: TokenManager,
  body: GraphqlRequestBody,
  res: http.ServerResponse,
  outcome: RequestOutcome,
): Promise<void> {
  try {
    const result = await forwardGraphqlRequest(env, tokenManager, body);
    outcome.upstreamStatus = result.status;
    res.writeHead(result.status, {
      "Content-Type": result.contentType ?? "application/octet-stream",
    });
    res.end(result.body);
  } catch (err) {
    if (err instanceof NonJsonUpstreamResponseError) {
      // Deliberately the one error path NOT converted to JSON above: this is
      // Shopify's own non-JSON response (its HTML bot-challenge page),
      // forwarded verbatim by status and body. The client's 5-attempt
      // backoff in fetchShopifyJson exists precisely to ride out that
      // challenge, and it only retries when the response fails to parse as
      // JSON — wrapping it in `{"errors":[...]}` here would make it parse
      // successfully and short-circuit that retry.
      outcome.upstreamStatus = err.status;
      res.writeHead(err.status, { "Content-Type": "text/plain" });
      res.end(err.body);
      return;
    }
    sendJsonError(res, 502, "bad gateway");
  }
}

export function createServer(env: RelayEnv): http.Server {
  const tokenManager = createTokenManager(env);

  return http.createServer((req, res) => {
    const method = req.method ?? "";
    const path = (req.url ?? "").split("?")[0];

    if (method === "GET" && path === "/healthz") {
      // Not logged: Fly probes this every 15s, and 5,760 identical lines a
      // day would bury the handful that matter.
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    const startedAt = Date.now();
    const outcome: RequestOutcome = {};
    res.on("finish", () => {
      logRequest(method, path, res.statusCode, startedAt, outcome);
    });

    if (method === "POST" && path === "/graphql") {
      if (!isValidRelaySecret(env, relaySecretHeader(req))) {
        sendJsonError(res, 401, "unauthorized");
        return;
      }

      readBody(req)
        .then((raw) => {
          let parsed: GraphqlRequestBody;
          try {
            parsed = JSON.parse(raw) as GraphqlRequestBody;
          } catch {
            sendJsonError(res, 400, "invalid JSON body");
            return undefined;
          }
          return forwardAndRespond(
            env,
            tokenManager,
            { query: parsed.query, variables: parsed.variables },
            res,
            outcome,
          );
        })
        .catch((err: unknown) => {
          if (err instanceof PayloadTooLargeError) {
            sendJsonError(res, 413, "payload too large");
            // Only safe to stop reading the rest of an oversized body once
            // the response has actually gone out — destroying the request
            // mid-response (see readBody above) would take the response
            // down with it.
            res.on("finish", () => req.destroy());
            return;
          }
          sendJsonError(res, 502, "bad gateway");
        });
      return;
    }

    if (method === "GET" && path === "/verify") {
      // Authenticated no-op probe: proves secret + credentials + Shopify
      // reachability end to end with a read-only query, so a cutover can be
      // verified without writing a real customer record. Goes through the
      // same forwardAndRespond path as /graphql — no separate fetch logic.
      if (!isValidRelaySecret(env, relaySecretHeader(req))) {
        sendJsonError(res, 401, "unauthorized");
        return;
      }

      void forwardAndRespond(
        env,
        tokenManager,
        { query: "{ shop { name } }" },
        res,
        outcome,
      );
      return;
    }

    sendJsonError(res, 404, "not found");
  });
}

/**
 * Env vars this process cannot run without, checked at startup. Returns the
 * names of any that are missing/empty so the caller can log exactly which
 * ones before exiting.
 */
export function missingRequiredEnv(env: RelayEnv): string[] {
  const required: (keyof RelayEnv)[] = [
    "SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_CLIENT_ID",
    "SHOPIFY_CLIENT_SECRET",
    "SHOPIFY_RELAY_SECRET",
  ];
  return required.filter((key) => !env[key]);
}

if (require.main === module) {
  const env: RelayEnv = {
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN ?? "",
    SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID ?? "",
    SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET ?? "",
    SHOPIFY_RELAY_SECRET: process.env.SHOPIFY_RELAY_SECRET,
  };

  // Fail fast rather than serving /healthz 200 with no working credentials.
  // ADR-0003 already documents "healthy != reachable" as a trap that bit
  // this project once (the relay ran with no public IP while Fly's own
  // check reported 1/1); an unconfigured relay that 401s every request
  // while reporting healthy is the same trap one layer in. A crash-looping
  // machine with a clear log line is far more diagnosable than that.
  const missing = missingRequiredEnv(env);
  if (missing.length > 0) {
    process.stderr.write(
      `august-jones-relay: missing required env var(s): ${missing.join(", ")}\n`,
    );
    process.exit(1);
  }

  const port = Number(process.env.PORT ?? 8080);
  createServer(env).listen(port);
}
