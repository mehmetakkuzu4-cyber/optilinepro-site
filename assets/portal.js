const STORE_LICENSES = "optiline_portal_licenses";
const STORE_RELEASE = "optiline_portal_release";

const moduleMap = {
  "Proje": "project",
  "Profil": "profile",
  "Stok Danışmanı": "advisor",
  "Levha": "sheet"
};

const defaultRelease = {
  version: "1.1.1",
  date: "2026-07-16",
  setup_url: "https://github.com/USERNAME/OptiLinePro-Releases/releases/latest/download/OptiLineSetup.exe",
  update_url: "https://github.com/USERNAME/OptiLinePro-Releases/releases/latest/download/OptiLineUpdate.zip",
  sha256: "",
  required: false,
  notes: "OptiLine Pro ilk GitHub dağıtım kaydı."
};

const seedLicenses = [
  {
    key: "FSL-AVAF-Q74M-SPAA-BB5M",
    label: "Mehmet ÇELİK / OPTILINE PRO",
    machine: "A1E8B364F932B50D",
    status: "Aktif",
    created_at: "2026-06-25 18:42",
    last_check: "2026-07-08 09:34",
    version: "1.0.0",
    max_devices: 1,
    expires_at: null,
    modules: ["Profil", "Stok Danışmanı"],
    limits: { project: 2, profile: 50, advisor: 200, sheet: 50 },
    note: "Örnek lisans kaydı."
  }
];

let activeFilter = "Aktif";

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

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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
  setTimeout(() => el.classList.remove("show"), 2600);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function randomBlock(size = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < size; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateKey() {
  return `OPL-${randomBlock()}-${randomBlock()}-${randomBlock()}-${randomBlock()}`;
}

function getLicenses() {
  const rows = loadJson(STORE_LICENSES, null);
  if (rows) return rows;
  saveJson(STORE_LICENSES, seedLicenses);
  return seedLicenses;
}

function setLicenses(rows) {
  saveJson(STORE_LICENSES, rows);
}

function getRelease() {
  return loadJson(STORE_RELEASE, defaultRelease);
}

function setRelease(release) {
  saveJson(STORE_RELEASE, release);
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function statusClass(status) {
  if (status === "Aktif") return "active";
  if (status === "Askıda") return "pending";
  return "cancel";
}

function renderLicenseCards() {
  const target = qs("#licenseCards");
  if (!target) return;

  const query = (qs("#licenseSearch")?.value || "").trim().toLowerCase();
  const rows = getLicenses().filter(row => {
    const matchFilter = activeFilter === "all" || row.status === activeFilter;
    const searchable = `${row.key} ${row.label} ${row.machine} ${row.modules.join(" ")}`.toLowerCase();
    return matchFilter && searchable.includes(query);
  });

  qs("#licenseListInfo").textContent = `${rows.length} lisans listeleniyor`;
  target.innerHTML = rows.map(row => `
    <article class="license-card">
      <div>
        <div class="license-key">${safeText(row.key)}</div>
        <h3>${safeText(row.label)}</h3>
        <div class="license-meta">
          <span class="pill ${statusClass(row.status)}">${safeText(row.status)}</span>
          <span>Cihaz: ${safeText(row.max_devices)}</span>
          <span>Bitiş: ${row.expires_at ? safeText(row.expires_at) : "Sınırsız"}</span>
          <span>Son kontrol: ${safeText(row.last_check || "-")}</span>
        </div>
        <div class="license-meta" style="margin-top:10px">
          <span>Makine ID: ${safeText(row.machine)}</span>
          <span>Modüller: ${safeText(row.modules.join(", "))}</span>
        </div>
      </div>
      <div class="license-actions">
        <button class="green" data-license-action="active" data-key="${safeText(row.key)}" type="button">Aktif Yap</button>
        <button class="amber" data-license-action="pause" data-key="${safeText(row.key)}" type="button">Askıya Al</button>
        <button class="red" data-license-action="cancel" data-key="${safeText(row.key)}" type="button">Lisansı İptal Et</button>
        <button data-license-action="copy" data-key="${safeText(row.key)}" type="button">Anahtarı Kopyala</button>
      </div>
    </article>
  `).join("");

  qsa("[data-license-action]", target).forEach(button => {
    button.addEventListener("click", () => handleLicenseAction(button.dataset.licenseAction, button.dataset.key));
  });
}

function handleLicenseAction(action, key) {
  const rows = getLicenses();
  const row = rows.find(item => item.key === key);
  if (!row) return;

  if (action === "copy") {
    navigator.clipboard?.writeText(row.key);
    toast("Lisans anahtarı kopyalandı.");
    return;
  }

  if (action === "active") row.status = "Aktif";
  if (action === "pause") row.status = "Askıda";
  if (action === "cancel") row.status = "İptal";
  setLicenses(rows);
  renderAdminStats();
  renderLicenseCards();
  renderJsonPreview();
}

function renderAdminStats() {
  const rows = getLicenses();
  const release = getRelease();
  if (qs("#licenseCount")) qs("#licenseCount").textContent = rows.length;
  if (qs("#activeCount")) qs("#activeCount").textContent = rows.filter(row => row.status === "Aktif").length;
  if (qs("#releaseVersion")) qs("#releaseVersion").textContent = release.version;
}

function renderJsonPreview() {
  const preview = qs("#jsonPreview");
  if (!preview) return;
  const payload = {
    generated_at: new Date().toISOString(),
    licenses: getLicenses().map(row => ({
      key: row.key,
      label: row.label,
      machine: row.machine,
      status: row.status,
      max_devices: row.max_devices,
      expires_at: row.expires_at,
      modules: row.modules.map(name => moduleMap[name] || name),
      limits: row.limits,
      note: row.note
    }))
  };
  preview.textContent = JSON.stringify(payload, null, 2);
}

function initAdmin() {
  if (document.body.dataset.page !== "admin") return;

  renderAdminStats();
  renderLicenseCards();
  renderJsonPreview();
  fillReleaseForm();

  qs("#licenseSearch")?.addEventListener("input", renderLicenseCards);
  qsa("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      qsa("[data-filter]").forEach(btn => btn.classList.remove("active"));
      if (activeFilter === "Aktif") button.classList.add("active");
      renderLicenseCards();
    });
  });

  qs("#licUnlimited")?.addEventListener("change", event => {
    const expiry = qs("#licExpiry");
    expiry.disabled = event.target.checked;
    if (event.target.checked) expiry.value = "";
  });

  qs("#licenseForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const modules = qsa("input[name='module']:checked").map(item => item.value);
    const license = {
      key: generateKey(),
      label: qs("#licLabel").value.trim(),
      machine: qs("#licMachine").value.trim(),
      status: "Aktif",
      created_at: new Date().toLocaleString("tr-TR"),
      last_check: "-",
      version: getRelease().version,
      max_devices: Number(qs("#licDevices").value || 1),
      expires_at: qs("#licUnlimited").checked ? null : (qs("#licExpiry").value || null),
      modules,
      limits: {
        project: Number(qs("#limitProject").value || 0),
        profile: Number(qs("#limitProfile").value || 0),
        advisor: Number(qs("#limitAdvisor").value || 0),
        sheet: Number(qs("#limitSheet").value || 0)
      },
      note: qs("#licNote").value.trim()
    };
    const rows = getLicenses();
    rows.unshift(license);
    setLicenses(rows);
    event.target.reset();
    qs("#licDevices").value = "1";
    qs("#limitProject").value = "2";
    qs("#limitProfile").value = "50";
    qs("#limitAdvisor").value = "200";
    qs("#limitSheet").value = "50";
    renderAdminStats();
    renderLicenseCards();
    renderJsonPreview();
    navigator.clipboard?.writeText(license.key);
    toast("Lisans oluşturuldu ve anahtar kopyalandı.");
  });

  qs("#releaseForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const release = {
      version: qs("#relVersion").value.trim() || "1.1.2",
      date: todayIso(),
      setup_url: qs("#relSetup").value.trim(),
      update_url: qs("#relUpdate").value.trim(),
      sha256: qs("#relSha").value.trim(),
      required: false,
      notes: qs("#relNotes").value.trim()
    };
    setRelease(release);
    renderAdminStats();
    renderJsonPreview();
    toast("Sürüm bilgisi kaydedildi. version.json indirebilirsin.");
  });

  qs("#downloadVersionJson")?.addEventListener("click", () => {
    downloadJson("version.json", getRelease());
  });

  qs("#downloadLicensesJson")?.addEventListener("click", () => {
    downloadJson("licenses.json", {
      generated_at: new Date().toISOString(),
      licenses: getLicenses()
    });
  });
}

function fillReleaseForm() {
  const release = getRelease();
  if (qs("#relVersion")) qs("#relVersion").value = release.version || "";
  if (qs("#relSetup")) qs("#relSetup").value = release.setup_url || "";
  if (qs("#relUpdate")) qs("#relUpdate").value = release.update_url || "";
  if (qs("#relSha")) qs("#relSha").value = release.sha256 || "";
  if (qs("#relNotes")) qs("#relNotes").value = release.notes || "";
}

function initRequest() {
  if (document.body.dataset.page !== "request") return;

  const output = qs("#requestOutput");
  const mail = qs("#mailRequest");
  qs("#requestForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const modules = qsa("input[name='reqModule']:checked").map(item => item.value);
    const text = [
      "OptiLine Pro Lisans İsteği",
      "",
      `Firma / Müşteri: ${qs("#reqName").value.trim()}`,
      `İletişim: ${qs("#reqContact").value.trim() || "-"}`,
      `Makine Kodu: ${qs("#reqMachine").value.trim()}`,
      `İstenen Modüller: ${modules.join(", ") || "-"}`,
      `Not: ${qs("#reqNote").value.trim() || "-"}`,
      "",
      "Bu bilgilerle lisans hazırlanmasını rica ederim."
    ].join("\n");
    output.value = text;
    mail.href = `mailto:?subject=${encodeURIComponent("OptiLine Pro Lisans İsteği")}&body=${encodeURIComponent(text)}`;
    toast("Lisans istek metni hazırlandı.");
  });

  qs("#copyRequest")?.addEventListener("click", () => {
    if (!output.value.trim()) {
      toast("Önce istek metni oluştur.");
      return;
    }
    navigator.clipboard?.writeText(output.value);
    toast("İstek metni kopyalandı.");
  });
}

async function initDownload() {
  if (document.body.dataset.page !== "download") return;

  let release = getRelease();
  try {
    const response = await fetch("version.json", { cache: "no-store" });
    if (response.ok) release = await response.json();
  } catch {
    // Local storage release stays as fallback.
  }

  qs("#publicVersion").textContent = release.version || "-";
  qs("#publicDate").textContent = release.date || "Tarih yok";
  qs("#publicSha").textContent = release.sha256 || "-";
  qs("#publicRequired").textContent = release.required ? "Evet" : "Hayır";
  qs("#publicNotes").textContent = release.notes || "-";
  if (qs("#setupLink")) qs("#setupLink").href = release.setup_url || "#";
  if (qs("#updateLink")) qs("#updateLink").href = release.update_url || "#";
}

document.addEventListener("DOMContentLoaded", () => {
  initAdmin();
  initRequest();
  initDownload();
});
