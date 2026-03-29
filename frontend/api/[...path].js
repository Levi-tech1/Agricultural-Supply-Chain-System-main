/**
 * Same as repo-root api/[...path].js — used when Vercel "Root Directory" is `frontend`.
 * Set BACKEND_URL in Vercel → Environment Variables to your API origin (no trailing /api).
 */
function normalizeBackendUrl(raw) {
  let s = (raw || "").trim().replace(/\/+$/, "");
  if (!s) return "";
  if (s.toLowerCase().endsWith("/api")) {
    s = s.slice(0, -4).replace(/\/+$/, "");
  }
  return s;
}

function extractApiPathRest(pathname) {
  const m = pathname.match(/^\/api(\/(.*))?$/);
  if (m) return m[2] ? m[2] : "";
  const i = pathname.indexOf("/api/");
  if (i !== -1) return pathname.slice(i + 5);
  return "";
}

module.exports = async (req, res) => {
  const backend = normalizeBackendUrl(process.env.BACKEND_URL || "");
  if (!backend) {
    res.status(503).setHeader("content-type", "application/json");
    res.send(
      JSON.stringify({
        error:
          "BACKEND_URL is not set on Vercel. Add it under Project → Settings → Environment Variables (e.g. https://your-api.onrender.com), then redeploy. Alternatively build the frontend with VITE_API_URL pointing at your API.",
      })
    );
    return;
  }

  try {
    const raw = req.url || "/";
    const q = raw.indexOf("?");
    const pathname = q === -1 ? raw : raw.slice(0, q);
    const search = q === -1 ? "" : raw.slice(q);
    let rest = extractApiPathRest(pathname);
    if (!rest && req.query && req.query.path != null) {
      const p = req.query.path;
      rest = Array.isArray(p) ? p.join("/") : String(p);
    }
    const targetUrl = `${backend}/api/${rest}${search}`;

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
};
