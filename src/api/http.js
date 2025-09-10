/**
 * Lightweight fetch wrapper using Vue CLI devServer proxy.
 * All paths are relative (e.g., "/Shoes"), proxied to https://localhost:7183.
 */

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (contentType.includes("application/json")) {
      try {
        const body = await res.json();
        if (body && (body.message || body.error)) {
          message += ` - ${body.message || body.error}`;
        }
      } catch (_) {
        // ignore parse errors
      }
    } else {
      try {
        const text = await res.text();
        if (text) message += ` - ${text}`;
      } catch (_) {
        // ignore
      }
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const opts = { ...options, headers };
  const res = await fetch(path, opts);
  return handleResponse(res);
}

export function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export function getJson(path, params) {
  const url = `${path}${buildQuery(params)}`;
  return request(url, { method: "GET" });
}

export function postJson(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body || {}) });
}

export function putJson(path, body) {
  return request(path, { method: "PUT", body: JSON.stringify(body || {}) });
}

export function deleteJson(path) {
  return request(path, { method: "DELETE" });
}