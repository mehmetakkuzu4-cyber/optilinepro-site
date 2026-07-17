const API_BASE = "https://api.optilinepro.com";

const defaultRelease = {
  version: "1.1.1",
  date: "2026-07-16",
  setup_url: "",
  update_url: "",
  sha256: "",
  required: false,
  notes: "OptiLine Pro ilk dağıtım kaydı."
};

const portalState = {
  licenses: [],
  customers: [],
  requests: [],
  release: { ...defaultRelease },
  adminAuthenticated: false,
  adminEmail: "",
  customerAuthenticated: false,
  customerLicense: null
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getLicenses() {
  return portalState.licenses;
}

function getRelease() {
  return portalState.release;
}

function getCustomerLicense() {
  return portalState.customerLicense;
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
    cache: "no-store"
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || `Sunucu isteği başarısız (${response.status}).`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function loadPublicReleaseFromApi() {
  const release = await apiRequest("/v1/public/release");
  portalState.release = { ...defaultRelease, ...release };
  return portalState.release;
}

async function checkAdminSession() {
  try {
    const session = await apiRequest("/v1/admin/session");
    portalState.adminAuthenticated = Boolean(session.authenticated);
    portalState.adminEmail = session.email || "";
  } catch (error) {
    if (error.status !== 401) throw error;
    portalState.adminAuthenticated = false;
    portalState.adminEmail = "";
  }
  return portalState.adminAuthenticated;
}

async function loginAdmin(email, password) {
  const session = await apiRequest("/v1/admin/login", {
    method: "POST",
    body: { email, password }
  });
  portalState.adminAuthenticated = true;
  portalState.adminEmail = session.email || email;
  await loadAdminSnapshot();
  return session;
}

async function logoutAdmin() {
  await apiRequest("/v1/admin/logout", { method: "POST", body: {} });
  portalState.adminAuthenticated = false;
  portalState.adminEmail = "";
  portalState.licenses = [];
  portalState.customers = [];
  portalState.requests = [];
}

async function loadAdminSnapshot() {
  const snapshot = await apiRequest("/v1/admin/snapshot");
  portalState.licenses = Array.isArray(snapshot.licenses) ? snapshot.licenses : [];
  portalState.customers = Array.isArray(snapshot.customers) ? snapshot.customers : [];
  portalState.requests = Array.isArray(snapshot.requests) ? snapshot.requests : [];
  portalState.release = { ...defaultRelease, ...(snapshot.release || {}) };
  portalState.adminAuthenticated = true;
  return snapshot;
}

async function createLicenseOnApi(input) {
  const result = await apiRequest("/v1/admin/licenses", { method: "POST", body: input });
  await loadAdminSnapshot();
  return result.license;
}

async function runLicenseActionOnApi(id, action) {
  const result = await apiRequest(`/v1/admin/licenses/${encodeURIComponent(id)}/actions/${encodeURIComponent(action)}`, {
    method: "POST",
    body: {}
  });
  await loadAdminSnapshot();
  return result.license;
}

async function deleteLicenseOnApi(id) {
  await apiRequest(`/v1/admin/licenses/${encodeURIComponent(id)}`, { method: "DELETE" });
  await loadAdminSnapshot();
}

async function saveReleaseOnApi(release) {
  const result = await apiRequest("/v1/admin/release", { method: "PUT", body: release });
  portalState.release = { ...defaultRelease, ...(result.release || {}) };
  return portalState.release;
}

async function loginCustomer(key, machineCode) {
  const session = await apiRequest("/v1/customer/login", {
    method: "POST",
    body: { key, machine_code: machineCode, version: getRelease().version }
  });
  portalState.customerAuthenticated = true;
  await loadCustomerSnapshot();
  return session;
}

async function loadCustomerSnapshot() {
  try {
    const snapshot = await apiRequest("/v1/customer/snapshot");
    portalState.customerAuthenticated = true;
    portalState.customerLicense = snapshot.license || null;
    portalState.release = { ...defaultRelease, ...(snapshot.release || {}) };
    return snapshot;
  } catch (error) {
    if (error.status !== 401) throw error;
    portalState.customerAuthenticated = false;
    portalState.customerLicense = null;
    return null;
  }
}

async function logoutCustomer() {
  await apiRequest("/v1/customer/logout", { method: "POST", body: {} });
  portalState.customerAuthenticated = false;
  portalState.customerLicense = null;
}

async function createLicenseRequestOnApi(input) {
  return apiRequest("/v1/license-requests", { method: "POST", body: input });
}

function toast(message) {
  let el = qs(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 3000);
}

async function initLegacyRequestPage() {
  if (document.body.dataset.page !== "request") return;
  const form = qs("#requestForm");
  const output = qs("#requestOutput");
  form?.addEventListener("submit", async event => {
    event.preventDefault();
    const modules = qsa("input[name='reqModule']:checked").map(item => item.value);
    try {
      const result = await createLicenseRequestOnApi({
        customer_name: qs("#reqName").value.trim(),
        contact: qs("#reqContact").value.trim(),
        machine_code: qs("#reqMachine").value.trim(),
        modules,
        note: qs("#reqNote").value.trim()
      });
      output.value = `Lisans isteğiniz merkezi sisteme kaydedildi.\nİstek No: ${result.request.id}`;
      toast("Lisans isteği gönderildi.");
    } catch (error) {
      output.value = error.message;
      toast(error.message);
    }
  });
  qs("#copyRequest")?.addEventListener("click", () => navigator.clipboard?.writeText(output.value || ""));
}

async function initLegacyDownloadPage() {
  if (document.body.dataset.page !== "download") return;
  try {
    const release = await loadPublicReleaseFromApi();
    if (qs("#publicVersion")) qs("#publicVersion").textContent = release.version || "-";
    if (qs("#publicDate")) qs("#publicDate").textContent = release.date || "Tarih yok";
    if (qs("#publicSha")) qs("#publicSha").textContent = release.sha256 || "-";
    if (qs("#publicRequired")) qs("#publicRequired").textContent = release.required ? "Evet" : "Hayır";
    if (qs("#publicNotes")) qs("#publicNotes").textContent = release.notes || "-";
    if (qs("#setupLink")) qs("#setupLink").href = release.setup_url || "#";
    if (qs("#updateLink")) qs("#updateLink").href = release.update_url || "#";
  } catch (error) {
    toast(`Sürüm bilgisi alınamadı: ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "admin") {
    location.replace("index.html#admin/admin-dashboard");
    return;
  }
  initLegacyRequestPage();
  initLegacyDownloadPage();
});
