const MODULES = new Set(["Proje", "Profil", "Stok Danışmanı", "Levha"]);
const SESSION_COOKIE = "optiline_admin_session";
const CUSTOMER_COOKIE = "optiline_customer_session";
const SESSION_HOURS = 12;
const CUSTOMER_SESSION_HOURS = 8;
const PUBLIC_API_BASE = "https://api.optilinepro.com/v1/public/release";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return json({ ok: true, service: "optiline-control-api", time: now() }, 200, cors);
      }

      if (url.pathname === "/v1/public/release" && request.method === "GET") {
        return json(await publicRelease(env), 200, cors);
      }

      if (url.pathname === "/v1/public/release/download" && request.method === "GET") {
        return proxyReleaseFile(env, cors, "update");
      }

      if (url.pathname === "/v1/public/release/setup" && request.method === "GET") {
        return proxyReleaseFile(env, cors, "setup");
      }

      if (url.pathname === "/v1/license-requests" && request.method === "POST") {
        return createLicenseRequest(request, env, cors);
      }

      if ([
        "/v1/licenses/verify",
        "/v1/license/verify",
        "/api/v1/license/verify"
      ].includes(url.pathname) && request.method === "POST") {
        return verifyLicense(request, env, cors);
      }

      if (url.pathname === "/api/v1/license/device/remove" && request.method === "POST") {
        return removeLicenseDevice(request, env, cors);
      }

      if (url.pathname === "/v1/admin/login" && request.method === "POST") {
        return adminLogin(request, env, cors);
      }

      if (url.pathname === "/v1/admin/logout" && request.method === "POST") {
        return adminLogout(request, env, cors);
      }

      if (url.pathname === "/v1/customer/login" && request.method === "POST") {
        return customerLogin(request, env, cors);
      }

      if (url.pathname === "/v1/customer/logout" && request.method === "POST") {
        return customerLogout(request, env, cors);
      }

      if (url.pathname === "/v1/customer/snapshot" && request.method === "GET") {
        const customer = await requireCustomer(request, env);
        if (!customer) return json({ error: "Müşteri oturumu gerekli." }, 401, cors);
        const licenses = await listLicenses(env);
        return json({
          license: licenses.find(row => row.id === customer.license_id) || null,
          release: await publicRelease(env),
          tickets: await listSupportTickets(env, customer.license_id)
        }, 200, cors);
      }

      if (url.pathname === "/v1/customer/support-tickets" && request.method === "POST") {
        const customer = await requireCustomer(request, env);
        if (!customer) return json({ error: "Müşteri oturumu gerekli." }, 401, cors);
        return createSupportTicket(request, env, cors, customer);
      }

      const admin = await requireAdmin(request, env);
      if (!admin) return json({ error: "Yönetici oturumu gerekli." }, 401, cors);

      if (url.pathname === "/v1/admin/session" && request.method === "GET") {
        return json({ authenticated: true, email: admin.email }, 200, cors);
      }

      if (url.pathname === "/v1/admin/snapshot" && request.method === "GET") {
        const [licenses, release, requests, customers, devices, tickets, audit] = await Promise.all([
          listLicenses(env), currentRelease(env), listRequests(env), listCustomers(env),
          listAllDevices(env), listSupportTickets(env), listAuditLog(env)
        ]);
        return json({ licenses, release, requests, customers, devices, tickets, audit }, 200, cors);
      }

      if (url.pathname === "/v1/admin/licenses" && request.method === "GET") {
        return json({ licenses: await listLicenses(env) }, 200, cors);
      }

      if (url.pathname === "/v1/admin/licenses" && request.method === "POST") {
        return createLicense(request, env, cors, admin);
      }

      const licenseMatch = url.pathname.match(/^\/v1\/admin\/licenses\/([^/]+)$/);
      if (licenseMatch && request.method === "DELETE") {
        return deleteLicense(decodeURIComponent(licenseMatch[1]), env, cors, admin);
      }

      const actionMatch = url.pathname.match(/^\/v1\/admin\/licenses\/([^/]+)\/actions\/([^/]+)$/);
      if (actionMatch && request.method === "POST") {
        return licenseAction(
          decodeURIComponent(actionMatch[1]),
          decodeURIComponent(actionMatch[2]),
          env,
          cors,
          admin
        );
      }

      if (url.pathname === "/v1/admin/release" && request.method === "PUT") {
        return saveRelease(request, env, cors, admin);
      }

      const supportActionMatch = url.pathname.match(/^\/v1\/admin\/support-tickets\/([^/]+)\/actions\/([^/]+)$/);
      if (supportActionMatch && request.method === "POST") {
        return supportTicketAction(
          decodeURIComponent(supportActionMatch[1]),
          decodeURIComponent(supportActionMatch[2]),
          env,
          cors,
          admin
        );
      }

      return json({ error: "Uç nokta bulunamadı." }, 404, cors);
    } catch (error) {
      console.error(error);
      return json({ error: "Sunucu işlemi tamamlanamadı.", detail: String(error.message || error) }, 500, cors);
    }
  }
};

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set(String(env.ALLOWED_ORIGINS || "").split(",").map(item => item.trim()).filter(Boolean));
  const headers = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-OptiLine-Admin",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };
  if (allowed.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function bodyJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("application/json")) throw new Error("JSON gövdesi gerekli.");
  return request.json();
}

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function licenseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const blocks = [];
  for (let block = 0; block < 4; block += 1) {
    let value = "";
    for (let i = 0; i < 4; i += 1) value += alphabet[bytes[block * 4 + i] % alphabet.length];
    blocks.push(value);
  }
  return `OPL-${blocks.join("-")}`;
}

function cookies(request) {
  return Object.fromEntries((request.headers.get("Cookie") || "").split(";").map(part => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function sameSecret(left, right) {
  const a = new TextEncoder().encode(String(left || ""));
  const b = new TextEncoder().encode(String(right || ""));
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) diff |= (a[index] || 0) ^ (b[index] || 0);
  return diff === 0;
}

async function adminLogin(request, env, cors) {
  const input = await bodyJson(request);
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  if (!sameSecret(email, String(env.ADMIN_EMAIL || "").toLowerCase()) || !sameSecret(password, env.ADMIN_PASSWORD)) {
    return json({ error: "E-posta veya şifre hatalı." }, 401, cors);
  }

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
  const tokenHash = await sha256(token);
  const created = now();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600000).toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").bind(created),
    env.DB.prepare("INSERT INTO admin_sessions (token_hash, email, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, email, expires, created)
  ]);

  const headers = new Headers(cors);
  headers.append("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_HOURS * 3600}`);
  return json({ authenticated: true, email }, 200, headers);
}

async function adminLogout(request, env, cors) {
  const token = cookies(request)[SESSION_COOKIE];
  if (token) await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  const headers = new Headers(cors);
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`);
  return json({ authenticated: false }, 200, headers);
}

async function customerLogin(request, env, cors) {
  const input = await bodyJson(request);
  const activation = await activateLicense(input, env);
  if (!activation.ok) return json({ error: activation.error }, activation.status || 403, cors);

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
  const tokenHash = await sha256(token);
  const created = now();
  const expires = new Date(Date.now() + CUSTOMER_SESSION_HOURS * 3600000).toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM customer_sessions WHERE expires_at <= ?").bind(created),
    env.DB.prepare("INSERT INTO customer_sessions (token_hash, license_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, activation.license.id, expires, created)
  ]);
  const headers = new Headers(cors);
  headers.append("Set-Cookie", `${CUSTOMER_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${CUSTOMER_SESSION_HOURS * 3600}`);
  return json({ authenticated: true, label: activation.license.label }, 200, headers);
}

async function customerLogout(request, env, cors) {
  const token = cookies(request)[CUSTOMER_COOKIE];
  if (token) await env.DB.prepare("DELETE FROM customer_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  const headers = new Headers(cors);
  headers.append("Set-Cookie", `${CUSTOMER_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`);
  return json({ authenticated: false }, 200, headers);
}

async function requireCustomer(request, env) {
  const token = cookies(request)[CUSTOMER_COOKIE];
  if (!token) return null;
  const row = await env.DB.prepare("SELECT license_id, expires_at FROM customer_sessions WHERE token_hash = ?")
    .bind(await sha256(token)).first();
  if (!row || row.expires_at <= now()) return null;
  return row;
}

async function requireAdmin(request, env) {
  const token = cookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const row = await env.DB.prepare("SELECT email, expires_at FROM admin_sessions WHERE token_hash = ?")
    .bind(await sha256(token)).first();
  if (!row || row.expires_at <= now()) return null;
  return row;
}

async function currentRelease(env) {
  const row = await env.DB.prepare("SELECT * FROM releases WHERE is_current = 1 ORDER BY updated_at DESC LIMIT 1").first();
  if (!row) return {
    version: "1.1.1", date: "", setup_url: "", update_url: "", sha256: "",
    required: false, notes: "", channel: "stable", size_bytes: 0
  };
  return {
    id: row.id,
    version: row.version,
    date: row.release_date,
    setup_url: row.setup_url || "",
    update_url: row.update_url || "",
    sha256: row.sha256 || "",
    required: Boolean(row.required),
    notes: row.notes || "",
    channel: row.channel || "stable",
    size_bytes: Number(row.size_bytes || 0)
  };
}

async function publicRelease(env) {
  const release = await currentRelease(env);
  const packageAvailable = Boolean(release.update_url);
  const setupAvailable = Boolean(release.setup_url);
  return {
    version: release.version,
    date: release.date,
    notes: release.notes,
    sha256: release.sha256,
    required: release.required,
    channel: release.channel || "stable",
    size_bytes: Number(release.size_bytes || 0),
    package_available: packageAvailable,
    setup_available: setupAvailable,
    download_url: packageAvailable ? `${PUBLIC_API_BASE}/download` : "",
    setup_download_url: setupAvailable ? `${PUBLIC_API_BASE}/setup` : "",
    update_url: packageAvailable ? `${PUBLIC_API_BASE}/download` : "",
    setup_url: setupAvailable ? `${PUBLIC_API_BASE}/setup` : ""
  };
}

function trustedReleaseHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "github.com" ||
    host === "objects.githubusercontent.com" ||
    host === "release-assets.githubusercontent.com" ||
    host.endsWith(".githubusercontent.com");
}

function trustedReleaseUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "https:" && trustedReleaseHost(parsed.hostname);
  } catch (_) {
    return false;
  }
}

async function fetchTrustedRelease(sourceUrl) {
  let target = String(sourceUrl || "");
  for (let redirects = 0; redirects < 6; redirects += 1) {
    if (!trustedReleaseUrl(target)) throw new Error("Yayın paketi güvenilir depoda değil.");
    const upstream = await fetch(target, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "OptiLine-Control-API" }
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("Location");
      if (!location) throw new Error("Yayın paketi yönlendirmesi geçersiz.");
      target = new URL(location, target).toString();
      continue;
    }
    return upstream;
  }
  throw new Error("Yayın paketi çok fazla yönlendirme yaptı.");
}

async function proxyReleaseFile(env, cors, kind) {
  const release = await currentRelease(env);
  const sourceUrl = kind === "setup" ? release.setup_url : release.update_url;
  if (!sourceUrl) return json({ error: "Bu sürüm için paket yayınlanmadı." }, 404, cors);

  const upstream = await fetchTrustedRelease(sourceUrl);
  if (!upstream.ok || !upstream.body) {
    return json({ error: "Yayın paketi depodan alınamadı." }, 502, cors);
  }

  const headers = new Headers(cors);
  headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/octet-stream");
  headers.set("Cache-Control", "private, no-store, max-age=0");
  const length = upstream.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);
  const disposition = upstream.headers.get("Content-Disposition");
  headers.set(
    "Content-Disposition",
    disposition || `attachment; filename="OptiLine${kind === "setup" ? "Setup" : "Update"}-${release.version}.exe"`
  );
  return new Response(upstream.body, { status: 200, headers });
}

async function listLicenses(env) {
  const [licenseResult, moduleResult, deviceResult] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM licenses ORDER BY created_at DESC"),
    env.DB.prepare("SELECT license_id, module FROM license_modules ORDER BY module"),
    env.DB.prepare("SELECT * FROM devices ORDER BY activated_at DESC")
  ]);
  const modules = new Map();
  for (const row of moduleResult.results || []) {
    if (!modules.has(row.license_id)) modules.set(row.license_id, []);
    modules.get(row.license_id).push(row.module);
  }
  const devices = new Map();
  for (const row of deviceResult.results || []) {
    if (!devices.has(row.license_id)) devices.set(row.license_id, []);
    devices.get(row.license_id).push({
      id: row.id,
      machine: row.machine_code,
      activated_at: row.activated_at,
      last_check: row.last_check,
      version: row.program_version,
      status: row.status
    });
  }
  return (licenseResult.results || []).map(row => ({
    id: row.id,
    key: row.license_key,
    customer_id: row.customer_id,
    label: row.label,
    machine: row.machine_code || "",
    status: row.status,
    created_at: row.created_at,
    last_check: row.last_check || "-",
    version: row.program_version || "-",
    max_devices: row.max_devices,
    expires_at: row.expires_at,
    modules: modules.get(row.id) || [],
    devices: devices.get(row.id) || [],
    access: row.access_level,
    note: row.note || ""
  }));
}

async function createLicense(request, env, cors, admin) {
  const input = await bodyJson(request);
  const label = String(input.label || "").trim();
  const modules = [...new Set(Array.isArray(input.modules) ? input.modules.filter(module => MODULES.has(module)) : [])];
  const maxDevices = Math.max(1, Math.min(100, Number(input.max_devices || 1)));
  if (!label) return json({ error: "Lisans etiketi gerekli." }, 400, cors);
  if (!modules.length) return json({ error: "En az bir modül seçin." }, 400, cors);

  const created = now();
  const existingCustomer = await env.DB.prepare("SELECT id FROM customers WHERE lower(name) = lower(?) LIMIT 1")
    .bind(label).first();
  const customerId = existingCustomer?.id || id("cus");
  const license = {
    id: id("lic"),
    key: licenseKey(),
    label,
    machine: String(input.machine || "").trim(),
    max_devices: maxDevices,
    expires_at: input.expires_at || null,
    note: String(input.note || "").trim(),
    modules
  };
  const statements = [
    ...(!existingCustomer ? [env.DB.prepare(`INSERT INTO customers (
      id, name, company, note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`).bind(customerId, label, label, license.note || null, created, created)] : []),
    env.DB.prepare(`INSERT INTO licenses (
      id, license_key, customer_id, label, machine_code, status, max_devices, expires_at,
      access_level, note, program_version, last_check, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'Aktif', ?, ?, 'unlimited', ?, ?, NULL, ?, ?)`)
      .bind(license.id, license.key, customerId, license.label, license.machine || null, license.max_devices,
        license.expires_at, license.note || null, input.version || null, created, created),
    ...modules.map(module => env.DB.prepare("INSERT INTO license_modules (license_id, module) VALUES (?, ?)").bind(license.id, module)),
    auditStatement(env, admin.email, "license.create", "license", license.id, { label, modules })
  ];
  if (license.machine) {
    statements.push(env.DB.prepare(`INSERT INTO devices (
      id, license_id, machine_code, activated_at, last_check, program_version, status
    ) VALUES (?, ?, ?, ?, NULL, ?, 'Aktif')`).bind(id("dev"), license.id, license.machine, created, input.version || null));
  }
  await env.DB.batch(statements);
  const rows = await listLicenses(env);
  return json({ license: rows.find(row => row.id === license.id) }, 201, cors);
}

async function licenseAction(licenseId, action, env, cors, admin) {
  const row = await env.DB.prepare("SELECT id, label FROM licenses WHERE id = ?").bind(licenseId).first();
  if (!row) return json({ error: "Lisans bulunamadı." }, 404, cors);
  const updated = now();
  const statements = [];
  if (action === "activate") statements.push(env.DB.prepare("UPDATE licenses SET status = 'Aktif', updated_at = ? WHERE id = ?").bind(updated, licenseId));
  else if (action === "pause") statements.push(env.DB.prepare("UPDATE licenses SET status = 'Askıda', updated_at = ? WHERE id = ?").bind(updated, licenseId));
  else if (action === "cancel") statements.push(env.DB.prepare("UPDATE licenses SET status = 'İptal', updated_at = ? WHERE id = ?").bind(updated, licenseId));
  else if (action === "renew") statements.push(env.DB.prepare("UPDATE licenses SET license_key = ?, updated_at = ? WHERE id = ?").bind(licenseKey(), updated, licenseId));
  else if (action === "reset-device") {
    statements.push(env.DB.prepare("DELETE FROM devices WHERE license_id = ?").bind(licenseId));
    statements.push(env.DB.prepare("UPDATE licenses SET machine_code = NULL, last_check = NULL, updated_at = ? WHERE id = ?").bind(updated, licenseId));
  } else return json({ error: "Geçersiz lisans işlemi." }, 400, cors);
  statements.push(auditStatement(env, admin.email, `license.${action}`, "license", licenseId, { label: row.label }));
  await env.DB.batch(statements);
  const rows = await listLicenses(env);
  return json({ license: rows.find(item => item.id === licenseId) }, 200, cors);
}

async function deleteLicense(licenseId, env, cors, admin) {
  const row = await env.DB.prepare("SELECT label FROM licenses WHERE id = ?").bind(licenseId).first();
  if (!row) return json({ error: "Lisans bulunamadı." }, 404, cors);
  await env.DB.batch([
    auditStatement(env, admin.email, "license.delete", "license", licenseId, { label: row.label }),
    env.DB.prepare("DELETE FROM licenses WHERE id = ?").bind(licenseId)
  ]);
  return json({ deleted: true, id: licenseId }, 200, cors);
}

async function saveRelease(request, env, cors, admin) {
  const input = await bodyJson(request);
  const version = String(input.version || "").trim();
  if (!version) return json({ error: "Sürüm numarası gerekli." }, 400, cors);
  const timestamp = now();
  const releaseId = id("rel");
  await env.DB.batch([
    env.DB.prepare("UPDATE releases SET is_current = 0, updated_at = ? WHERE is_current = 1").bind(timestamp),
    env.DB.prepare(`INSERT INTO releases (
      id, version, release_date, setup_url, update_url, sha256, required, notes, channel, size_bytes,
      is_current, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(version) DO UPDATE SET
      release_date = excluded.release_date,
      setup_url = excluded.setup_url,
      update_url = excluded.update_url,
      sha256 = excluded.sha256,
      required = excluded.required,
      notes = excluded.notes,
      channel = excluded.channel,
      size_bytes = excluded.size_bytes,
      is_current = 1,
      updated_at = excluded.updated_at`)
      .bind(releaseId, version, input.date || timestamp.slice(0, 10), input.setup_url || "", input.update_url || "",
        input.sha256 || "", input.required ? 1 : 0, input.notes || "", input.channel || "stable",
        Math.max(0, Number(input.size_bytes || 0)), timestamp, timestamp),
    auditStatement(env, admin.email, "release.publish", "release", version, { version })
  ]);
  return json({ release: await currentRelease(env) }, 200, cors);
}

async function createLicenseRequest(request, env, cors) {
  const input = await bodyJson(request);
  const customerName = String(input.customer_name || "").trim();
  const machineCode = String(input.machine_code || "").trim();
  const modules = [...new Set(Array.isArray(input.modules) ? input.modules.filter(module => MODULES.has(module)) : [])];
  if (!customerName || !machineCode) return json({ error: "Müşteri adı ve makine kodu gerekli." }, 400, cors);
  const timestamp = now();
  const requestId = id("req");
  await env.DB.prepare(`INSERT INTO license_requests (
    id, customer_name, contact, machine_code, modules_json, note, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, 'Yeni', ?, ?)`)
    .bind(requestId, customerName, input.contact || null, machineCode, JSON.stringify(modules), input.note || null, timestamp, timestamp).run();
  return json({ request: { id: requestId, status: "Yeni" } }, 201, cors);
}

async function listRequests(env) {
  const result = await env.DB.prepare("SELECT * FROM license_requests ORDER BY created_at DESC LIMIT 500").all();
  return (result.results || []).map(row => ({ ...row, modules: JSON.parse(row.modules_json || "[]") }));
}

async function listCustomers(env) {
  const result = await env.DB.prepare("SELECT * FROM customers ORDER BY created_at DESC").all();
  return result.results || [];
}

async function listAllDevices(env) {
  const result = await env.DB.prepare(`SELECT
    d.id, d.license_id, d.machine_code AS machine, d.activated_at, d.last_check,
    d.program_version AS version, d.status, l.label, l.license_key
    FROM devices d
    JOIN licenses l ON l.id = d.license_id
    ORDER BY d.activated_at DESC`).all();
  return result.results || [];
}

async function listSupportTickets(env, licenseId = null) {
  const query = licenseId
    ? env.DB.prepare(`SELECT t.*, l.label, l.license_key FROM support_tickets t
        JOIN licenses l ON l.id = t.license_id
        WHERE t.license_id = ? ORDER BY t.created_at DESC`).bind(licenseId)
    : env.DB.prepare(`SELECT t.*, l.label, l.license_key FROM support_tickets t
        JOIN licenses l ON l.id = t.license_id
        ORDER BY t.created_at DESC LIMIT 500`);
  const result = await query.all();
  return result.results || [];
}

async function createSupportTicket(request, env, cors, customer) {
  const input = await bodyJson(request);
  const subject = String(input.subject || "").trim();
  const message = String(input.message || "").trim();
  const category = String(input.category || "Teknik").trim().slice(0, 40) || "Teknik";
  if (!subject || !message) return json({ error: "Konu ve açıklama gerekli." }, 400, cors);
  if (subject.length > 160 || message.length > 5000) return json({ error: "Destek talebi çok uzun." }, 400, cors);

  const license = await env.DB.prepare("SELECT customer_id FROM licenses WHERE id = ?")
    .bind(customer.license_id).first();
  if (!license) return json({ error: "Lisans kaydı bulunamadı." }, 404, cors);

  const ticketId = id("sup");
  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO support_tickets (
      id, customer_id, license_id, subject, category, message, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'Açık', ?, ?)`)
      .bind(ticketId, license.customer_id || null, customer.license_id, subject, category, message, timestamp, timestamp),
    auditStatement(env, `customer:${customer.license_id}`, "support.create", "support", ticketId, { subject, category })
  ]);
  const tickets = await listSupportTickets(env, customer.license_id);
  return json({ ticket: tickets.find(row => row.id === ticketId) }, 201, cors);
}

async function supportTicketAction(ticketId, action, env, cors, admin) {
  const statuses = { open: "Açık", progress: "İşlemde", close: "Kapalı" };
  const status = statuses[action];
  if (!status) return json({ error: "Geçersiz destek işlemi." }, 400, cors);
  const ticket = await env.DB.prepare("SELECT id, subject FROM support_tickets WHERE id = ?").bind(ticketId).first();
  if (!ticket) return json({ error: "Destek talebi bulunamadı." }, 404, cors);
  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare("UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?").bind(status, timestamp, ticketId),
    auditStatement(env, admin.email, `support.${action}`, "support", ticketId, { subject: ticket.subject, status })
  ]);
  return json({ ticket: { ...ticket, status, updated_at: timestamp } }, 200, cors);
}

async function listAuditLog(env) {
  const result = await env.DB.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500").all();
  return (result.results || []).map(row => {
    let detail = {};
    try { detail = JSON.parse(row.detail_json || "{}"); } catch (_) { detail = {}; }
    return { ...row, detail };
  });
}

async function verifyLicense(request, env, cors) {
  const input = await bodyJson(request);
  const activation = await activateLicense(input, env);
  if (!activation.ok) {
    return json({
      ok: false,
      valid: false,
      error: activation.error,
      error_code: activation.errorCode || "license_invalid"
    }, activation.status || 403, cors);
  }
  const license = activation.license;
  const moduleRows = await env.DB.prepare("SELECT module FROM license_modules WHERE license_id = ? ORDER BY module").bind(license.id).all();
  const modules = (moduleRows.results || []).map(row => row.module);
  const device = await env.DB.prepare(
    "SELECT activated_at, last_check, program_version, status FROM devices WHERE license_id = ? AND machine_code = ?"
  ).bind(license.id, String(input.machine_code || "").trim()).first();
  const deviceCount = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM devices WHERE license_id = ? AND status = 'Aktif'"
  ).bind(license.id).first();
  const connectedDevices = Number(deviceCount?.count || 0);
  const release = await publicRelease(env);
  return json({
    ok: true,
    valid: true,
    status: license.status,
    label: license.label,
    expires_at: license.expires_at,
    max_devices: license.max_devices,
    access: license.access_level,
    package: license.access_level,
    activated_at: device?.activated_at || "",
    connected_devices: connectedDevices,
    modules,
    license: {
      status: "active",
      label: license.label,
      customer_name: license.label,
      company: license.label,
      expires_at: license.expires_at || "",
      max_devices: license.max_devices,
      access: license.access_level,
      package: license.access_level,
      activated_at: device?.activated_at || "",
      connected_devices: connectedDevices,
      modules,
      limits: {}
    },
    update: release
  }, 200, cors);
}

async function removeLicenseDevice(request, env, cors) {
  const input = await bodyJson(request);
  const key = String(input.key || input.license_key || "").trim().toUpperCase();
  const machine = String(input.machine_code || "").trim();
  if (!key || !machine) {
    return json({ ok: false, error: "Lisans ve makine kodu gerekli.", error_code: "required_fields" }, 400, cors);
  }
  const license = await env.DB.prepare("SELECT id FROM licenses WHERE license_key = ?").bind(key).first();
  if (!license) {
    return json({ ok: false, error: "Lisans bulunamadı.", error_code: "license_not_found" }, 404, cors);
  }
  const existing = await env.DB.prepare(
    "SELECT id FROM devices WHERE license_id = ? AND machine_code = ?"
  ).bind(license.id, machine).first();
  if (!existing) {
    return json({ ok: false, error: "Cihaz kaydı bulunamadı.", error_code: "device_not_found" }, 404, cors);
  }
  await env.DB.prepare("DELETE FROM devices WHERE id = ?").bind(existing.id).run();
  await env.DB.prepare(
    "UPDATE licenses SET machine_code = CASE WHEN machine_code = ? THEN NULL ELSE machine_code END, updated_at = ? WHERE id = ?"
  ).bind(machine, now(), license.id).run();
  await auditStatement(env, `desktop:${machine}`, "device.remove", "device", existing.id, { machine_code: machine }).run();
  return json({ ok: true, removed: true }, 200, cors);
}

async function activateLicense(input, env) {
  const key = String(input.key || input.license_key || "").trim().toUpperCase();
  const machine = String(input.machine_code || "").trim();
  const version = String(input.version || input.app_version || "").trim();
  if (!key || !machine) {
    return {
      ok: false,
      status: 400,
      error: "Lisans ve makine kodu gerekli.",
      errorCode: "license_key_and_machine_code_required"
    };
  }
  const license = await env.DB.prepare("SELECT * FROM licenses WHERE license_key = ?").bind(key).first();
  if (!license) {
    return { ok: false, status: 404, error: "Lisans bulunamadı.", errorCode: "license_not_found" };
  }
  if (license.status !== "Aktif") {
    return { ok: false, status: 403, error: "Lisans aktif değil.", errorCode: "license_not_active" };
  }
  if (license.expires_at && license.expires_at < now().slice(0, 10)) {
    return { ok: false, status: 403, error: "Lisans süresi dolmuş.", errorCode: "license_expired" };
  }

  const existing = await env.DB.prepare("SELECT id FROM devices WHERE license_id = ? AND machine_code = ?")
    .bind(license.id, machine).first();
  const timestamp = now();
  if (existing) {
    await env.DB.prepare("UPDATE devices SET last_check = ?, program_version = ?, status = 'Aktif' WHERE id = ?")
      .bind(timestamp, version || null, existing.id).run();
  } else {
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM devices WHERE license_id = ?").bind(license.id).first();
    if (Number(count?.count || 0) >= Number(license.max_devices || 1)) {
      return {
        ok: false,
        status: 403,
        error: "Lisansın cihaz sınırı dolu.",
        errorCode: "device_limit_reached"
      };
    }
    await env.DB.prepare(`INSERT INTO devices (
      id, license_id, machine_code, activated_at, last_check, program_version, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'Aktif')`)
      .bind(id("dev"), license.id, machine, timestamp, timestamp, version || null).run();
  }
  await env.DB.prepare("UPDATE licenses SET machine_code = ?, last_check = ?, program_version = ?, updated_at = ? WHERE id = ?")
    .bind(machine, timestamp, version || null, timestamp, license.id).run();
  return { ok: true, license };
}

function auditStatement(env, actor, action, entityType, entityId, detail) {
  return env.DB.prepare(`INSERT INTO audit_log (
    id, actor, action, entity_type, entity_id, detail_json, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id("audit"), actor, action, entityType, entityId || null, JSON.stringify(detail || {}), now());
}
