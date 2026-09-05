import crypto from "node:crypto";
import http from "node:http";
import { forwardGraphqlRequest } from "./graphql";
import {
  createTokenManager,
  NonJsonUpstreamResponseError,
  type TokenEnv,
} from "./token";

export interface RelayEnv extends TokenEnv {
  SHOPIFY_RELAY_SECRET?: string;
}

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

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function createServer(env: RelayEnv): http.Server {
  const tokenManager = createTokenManager(env);

  return http.createServer((req, res) => {
    const method = req.method ?? "";
    const path = (req.url ?? "").split("?")[0];

    if (method === "GET" && path === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    if (method === "POST" && path === "/graphql") {
      const provided = req.headers["x-relay-secret"];
      const secretHeader = Array.isArray(provided) ? provided[0] : provided;

      if (!isValidRelaySecret(env, secretHeader)) {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("unauthorized");
        return;
      }

      readBody(req)
        .then(async (raw) => {
          const parsed = JSON.parse(raw) as {
            query: string;
            variables?: Record<string, unknown>;
          };
          const result = await forwardGraphqlRequest(env, tokenManager, {
            query: parsed.query,
            variables: parsed.variables,
          });
          res.writeHead(result.status, {
            "Content-Type": result.contentType ?? "application/octet-stream",
          });
          res.end(result.body);
        })
        .catch((err: unknown) => {
          if (err instanceof NonJsonUpstreamResponseError) {
            res.writeHead(err.status, { "Content-Type": "text/plain" });
            res.end(err.body);
            return;
          }
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("bad gateway");
        });
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  });
}

if (require.main === module) {
  const env: RelayEnv = {
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN ?? "",
    SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID ?? "",
    SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET ?? "",
    SHOPIFY_RELAY_SECRET: process.env.SHOPIFY_RELAY_SECRET,
  };
  const port = Number(process.env.PORT ?? 8080);
  createServer(env).listen(port);
}
