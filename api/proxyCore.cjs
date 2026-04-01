/**
 * Shared logic for Vercel serverless /api/* → Express backend proxy.
 * Used by api/[...path].js (repo root deploy). Copy stays in sync with frontend/api/proxyCore.cjs.
 */

function normalizeBackendUrl(raw) {
  let s = (raw || "").trim().replace(/\/+$/, "");
  if (!s) return "";
  if (s.toLowerCase().endsWith("/api")) {
    s = s.slice(0, -4).replace(/\/+$/, "");
  }
  return s;
}

function stripLeadingApi(seg) {
  let s = String(seg ?? "").replace(/^\/+/, "").replace(/\/+$/, "");
  while (s.toLowerCase().startsWith("api/")) {
    s = s.slice(4).replace(/^\/+/, "");
  }
  return s;
}

function safeSegment(s) {
  const t = stripLeadingApi(s);
  if (t.includes("..")) return null;
  return t;
}

/**
 * Resolve path after /api for upstream GET https://BACKEND/api/<rest>.
 * Vercel may send req.url as /api/users/me, /users/me, or only populate req.query.path.
 */
function computeApiRest(req) {
  const rawFull = req.url || "/";
  const rawPath = rawFull.split("?")[0] || "/";

  const afterApiPrefix = (pathStr) => {
    const i = pathStr.indexOf("/api/");
    if (i === -1) return null;
    const seg = safeSegment(pathStr.slice(i + 5));
    if (seg === null) return null;
    return seg;
  };

  let rest = afterApiPrefix(rawPath);
  if (rest !== null) return rest;

  let pathPart = rawPath;
  if (pathPart.includes("://")) {
    try {
      pathPart = new URL(pathPart).pathname;
      rest = afterApiPrefix(pathPart);
      if (rest !== null) return rest;
    } catch (_) {
      /* ignore */
    }
  }

  const qp = req.query && req.query.path;
  if (qp != null) {
    const joined = Array.isArray(qp) ? qp.filter(Boolean).join("/") : String(qp);
    const seg = safeSegment(joined);
    if (seg !== null && seg !== "") return seg;
  }

  const tail = pathPart.replace(/^\/+/, "");
  if (tail && !tail.includes("..")) {
    const seg = safeSegment(tail);
    if (seg !== null) return seg;
  }

  const h = req.headers || {};
  const fwd = h["x-vercel-forwarded-path"] || h["x-invoke-path"] || h["x-matched-path"];
  if (typeof fwd === "string") {
    const fp = fwd.split("?")[0];
    rest = afterApiPrefix(fp);
    if (rest !== null) return rest;
    const t2 = safeSegment(fp.replace(/^\/+/, ""));
    if (t2 !== null && t2 !== "") return t2;
  }

  return "";
}

/** BACKEND_URL must be a different host than this deployment, or the proxy calls itself and gets HTML 404s. */
function backendPointsToThisVercelDeployment(backendUrl) {
  const vercelHost = (process.env.VERCEL_URL || "").trim().replace(/^https?:\/\//i, "").split("/")[0];
  if (!vercelHost || !backendUrl) return false;
  try {
    const u = new URL(backendUrl.includes("://") ? backendUrl : `https://${backendUrl}`);
    return u.hostname.toLowerCase() === vercelHost.toLowerCase();
  } catch {
    return false;
  }
}

async function proxyHandler(req, res) {
  const backend = normalizeBackendUrl(process.env.BACKEND_URL || "");
  if (!backend) {
    res.status(503).setHeader("content-type", "application/json");
    res.send(
      JSON.stringify({
        error:
          "BACKEND_URL is not set on Vercel. Add it under Project → Settings → Environment Variables (e.g. https://your-api.onrender.com), then redeploy. Or set VITE_API_URL at build time for direct API calls.",
      })
    );
    return;
  }

  if (backendPointsToThisVercelDeployment(backend)) {
    res.status(503).setHeader("content-type", "application/json");
    res.send(
      JSON.stringify({
        error:
          "BACKEND_URL must be your API server URL (e.g. Render/Railway or a Vercel project with Root Directory backend), not this frontend deployment URL. Same hostname causes the proxy to request itself and return 404. Fix BACKEND_URL or use VITE_API_URL at build time instead.",
      })
    );
    return;
  }

  try {
    const raw = req.url || "/";
    const qIdx = raw.indexOf("?");
    const search = qIdx === -1 ? "" : raw.slice(qIdx);

    let rest = computeApiRest(req);
    const targetUrl = `${backend}/api/${rest}${search}`;

    if (process.env.VERCEL === "1" || process.env.DEBUG_API_PROXY === "1") {
      console.log("[api proxy]", req.method, req.url, "→", targetUrl);
    }

    const headers = {};
    for (const key of Object.keys(req.headers)) {
      const lower = key.toLowerCase();
      if (lower === "host" || lower === "connection") continue;
      const val = req.headers[key];
      if (val === undefined) continue;
      headers[key] = Array.isArray(val) ? val.join(", ") : val;
    }

    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (typeof req.body === "string") body = req.body;
      else if (Buffer.isBuffer(req.body)) body = req.body;
      else if (req.body != null && Object.keys(req.body).length > 0) {
        body = JSON.stringify(req.body);
        if (!headers["content-type"] && !headers["Content-Type"]) {
          headers["content-type"] = "application/json";
        }
      }
    }

    const r = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: "manual",
      body,
    });
    const buf = Buffer.from(await r.arrayBuffer());
    r.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === "transfer-encoding" || k === "connection") return;
      res.setHeader(key, value);
    });
    res.status(r.status).send(buf);
  } catch (err) {
    console.error("[api proxy]", err);
    res.status(502).setHeader("content-type", "application/json");
    res.send(JSON.stringify({ error: "Bad gateway", detail: String(err?.message || err) }));
  }
}

module.exports = { proxyHandler, normalizeBackendUrl, computeApiRest };
