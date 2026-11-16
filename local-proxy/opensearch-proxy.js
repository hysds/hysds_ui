#!/usr/bin/env node
/**
 * Credential-injecting proxy for the EAGLE-VSWIR OpenSearch domain.
 *
 * WHY THIS EXISTS
 * hysds_ui is a static SPA: @appbaseio/reactivesearch queries OpenSearch from
 * the browser (src/pages/Tosca/index.jsx:100). Three things make a direct
 * browser connection impossible:
 *   1. the domain needs HTTP basic auth, and anything in src/config lands in
 *      index_bundle.js where every user can read it;
 *   2. AWS OpenSearch Service sends no CORS headers, so the preflight fails;
 *   3. it is a VPC endpoint, so it only resolves inside the VPC or on VPN.
 * Upstream hysds_ui solves this with a same-origin "/grq_es" path proxied by
 * the GRQ host's webserver (see src/config/index.template.js:11). This script
 * is the local-development stand-in for that proxy.
 *
 * Node core modules only -- no npm install, nothing from the repo.
 *
 * Usage:
 *   set -a && source ./local-proxy/proxy.env && set +a
 *   node local-proxy/opensearch-proxy.js
 */

"use strict";

const http = require("http");
const https = require("https");

const TARGET_HOST =
  process.env.OS_HOST ||
  "vpc-eaglevswir-proto-ylwe6yiuzvfjv5voxzmk57vxfy.us-west-2.es.amazonaws.com";
const TARGET_PORT = parseInt(process.env.OS_PORT || "443", 10);
const PORT = parseInt(process.env.PROXY_PORT || "9200", 10);
// Bind to loopback only. This process holds a credential and adds it to every
// forwarded request; it must not be reachable from the network.
const BIND = process.env.PROXY_BIND || "127.0.0.1";

const USER = process.env.OS_USER;
const PASS = process.env.OS_PASS;

if (!USER || !PASS) {
  console.error(
    "ERROR: OS_USER and OS_PASS must be set.\n" +
      "  cp local-proxy/proxy.env.example local-proxy/proxy.env\n" +
      "  # fill it in, then:\n" +
      "  set -a && source ./local-proxy/proxy.env && set +a"
  );
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

/** Headers we must not forward upstream. */
const STRIP = new Set([
  "host",
  "origin",
  "referer",
  "connection",
  "authorization", // we set our own
  "cookie",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-dest",
]);

function corsHeaders(req) {
  return {
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, HEAD, OPTIONS",
    "Access-Control-Allow-Headers":
      req.headers["access-control-request-headers"] || "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

/** Never let the credential reach a client or a log line. */
function scrub(text) {
  if (!text) return text;
  return String(text)
    .split(PASS)
    .join("<redacted>")
    .split(AUTH)
    .join("<redacted>");
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    return res.end();
  }

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("error", () => {
    /* client hung up mid-body; upstream request is never made */
  });

  req.on("end", () => {
    const body = Buffer.concat(chunks);

    const headers = { Authorization: AUTH, Host: TARGET_HOST };
    for (const [k, v] of Object.entries(req.headers)) {
      if (!STRIP.has(k.toLowerCase())) headers[k] = v;
    }
    if (body.length) headers["Content-Length"] = body.length;
    else delete headers["content-length"];

    const upstream = https.request(
      {
        host: TARGET_HOST,
        port: TARGET_PORT,
        method: req.method,
        path: req.url,
        headers,
        timeout: 30000,
      },
      (up) => {
        const out = { ...corsHeaders(req) };
        for (const [k, v] of Object.entries(up.headers)) {
          if (k.toLowerCase() === "access-control-allow-origin") continue;
          out[k] = v;
        }
        res.writeHead(up.statusCode, out);
        up.pipe(res);

        if (up.statusCode >= 400) {
          console.warn(
            `  ${req.method} ${req.url} -> ${up.statusCode}` +
              (up.statusCode === 401
                ? "  (bad OS_USER/OS_PASS)"
                : up.statusCode === 403
                ? "  (domain access policy is denying you, not FGAC)"
                : up.statusCode === 404
                ? "  (index missing? check GRQ_ES_INDICES in src/config/index.js)"
                : "")
          );
        }
      }
    );

    upstream.on("timeout", () => {
      upstream.destroy(new Error("upstream timeout after 30s"));
    });

    upstream.on("error", (err) => {
      const hint =
        err.code === "ENOTFOUND" || err.code === "EAI_AGAIN"
          ? " -- the VPC endpoint does not resolve here. Are you on JPL VPN?"
          : "";
      const msg = scrub(err.message) + hint;
      console.error(`  ${req.method} ${req.url} -> proxy error: ${msg}`);
      if (!res.headersSent) {
        res.writeHead(502, {
          ...corsHeaders(req),
          "Content-Type": "application/json",
        });
      }
      res.end(JSON.stringify({ error: "proxy_error", message: msg }));
    });

    if (body.length) upstream.write(body);
    upstream.end();
  });
});

server.listen(PORT, BIND, () => {
  console.log(`OpenSearch proxy listening on http://${BIND}:${PORT}`);
  console.log(
    `  -> https://${TARGET_HOST}${TARGET_PORT === 443 ? "" : ":" + TARGET_PORT} as ${USER}`
  );
  console.log(`  set GRQ_ES_URL = "http://localhost:${PORT}" in src/config/index.js`);
  console.log("  Ctrl-C to stop.\n");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `ERROR: port ${PORT} is already in use. Stop the other listener or set PROXY_PORT.`
    );
    process.exit(1);
  }
  throw err;
});
