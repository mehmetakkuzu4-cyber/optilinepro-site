const accounts = {
  "admin@optilinepro.com": {
    password: "admin123",
    role: "admin",
    name: "Mehmet Celik",
    company: "OptiLine Pro"
  },
  "musteri@optilinepro.com": {
    password: "demo123",
    role: "customer",
    name: "Demo Musteri",
    company: "Panel Imalat"
  }
};

const defaultRequests = [
  {
    id: "REQ-2407",
    customer: "Demo Musteri",
    company: "Panel Imalat",
    machine: "MCH-8A92-44F0",
    modules: "Profil, Stok Danismani",
    status: "Bekliyor",
    date: "16.07.2026"
  },
  {
    id: "REQ-2406",
    customer: "Slava Uretim",
    company: "Aluminyum Hat",
    machine: "MCH-221B-90C7",
    modules: "Proje, Profil, Levha",
    status: "Aktif",
    date: "15.07.2026"
  }
];

const defaultReleases = [
  { version: "1.1.1", channel: "Kararli", file: "OptiLineKurulum.exe", date: "16.07.2026", status: "Yayinda" },
  { version: "1.1.0", channel: "Arsiv", file: "OptiLinePro_1.1.0.zip", date: "10.07.2026", status: "Arsiv" }
];

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function storeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function storeSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function currentUser() { return storeGet("optiline_user", null); }
function setUser(user) { storeSet("optiline_user", user); }
function logout() {
  localStorage.removeItem("optiline_user");
  window.location.href = "index.html";
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
  setTimeout(() => el.classList.remove("show"), 2400);
}

function initNav() {
  const page = document.body.dataset.page;
  qsa("[data-nav]").forEach(a => {
    if (a.dataset.nav === page) a.classList.add("active");
  });
  const user = currentUser();
  const panelLink = qs("[data-panel-link]");
  const loginLink = qs("[data-login-link]");
  const logoutBtn = qs("[data-logout]");
  if (panelLink) {
    if (user) {
      panelLink.href = user.role === "admin" ? "admin.html" : "customer.html";
      panelLink.textContent = user.role === "admin" ? "Admin Paneli" : "Musteri Paneli";
      panelLink.style.display = "";
    } else {
      panelLink.style.display = "none";
    }
  }
  if (loginLink && user) loginLink.textContent = user.name;
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}

function requireRole(role) {
  const user = currentUser();
  if (!user || user.role !== role) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function initLogin() {
  const form = qs("#loginForm");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const email = qs("#email").value.trim().toLowerCase();
    const pass = qs("#password").value;
    const account = accounts[email];
    if (!account || account.password !== pass) {
      toast("Giris bilgileri hatali.");
      return;
    }
    setUser({ email, role: account.role, name: account.name, company: account.company });
    window.location.href = account.role === "admin" ? "admin.html" : "customer.html";
  });
  qsa("[data-demo-login]").forEach(btn => {
    btn.addEventListener("click", () => {
      const email = btn.dataset.demoLogin === "admin" ? "admin@optilinepro.com" : "musteri@optilinepro.com";
      qs("#email").value = email;
      qs("#password").value = accounts[email].password;
    });
  });
}

function getRequests() {
  const saved = storeGet("optiline_license_requests", null);
  if (saved) return saved;
  storeSet("optiline_license_requests", defaultRequests);
  return defaultRequests;
}
function saveRequests(rows) { storeSet("optiline_license_requests", rows); }
function getReleases() {
  const saved = storeGet("optiline_releases", null);
  if (saved) return saved;
  storeSet("optiline_releases", defaultReleases);
  return defaultReleases;
}
function saveReleases(rows) { storeSet("optiline_releases", rows); }

function renderRequests(target, rows) {
  if (!target) return;
  target.innerHTML = rows.map(row => `
    <tr>
      <td><strong>${row.id}</strong><br><span class="hint">${row.date}</span></td>
      <td>${row.customer}<br><span class="hint">${row.company}</span></td>
      <td>${row.machine}</td>
      <td>${row.modules}</td>
      <td><span class="pill ${row.status === "Aktif" ? "green" : "amber"}">${row.status}</span></td>
      <td><button class="btn" data-approve="${row.id}">Onayla</button></td>
    </tr>
  `).join("");
  qsa("[data-approve]", target).forEach(btn => {
    btn.addEventListener("click", () => {
      const list = getRequests().map(item => item.id === btn.dataset.approve ? { ...item, status: "Aktif" } : item);
      saveRequests(list);
      renderRequests(target, list);
      toast("Lisans istegi aktif yapildi.");
    });
  });
}

function initCustomer() {
  if (document.body.dataset.page !== "customer") return;
  const user = requireRole("customer");
  if (!user) return;
  const name = qs("[data-user-name]");
  const company = qs("[data-user-company]");
  if (name) name.textContent = user.name;
  if (company) company.textContent = user.company;

  const form = qs("#requestForm");
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const modules = qsa("input[name='modules']:checked", form).map(i => i.value).join(", ");
      const rows = getRequests();
      rows.unshift({
        id: `REQ-${Math.floor(3000 + Math.random() * 6000)}`,
        customer: user.name,
        company: user.company,
        machine: qs("#machineCode").value.trim() || "MCH-YENI",
        modules: modules || "Profil",
        status: "Bekliyor",
        date: new Date().toLocaleDateString("tr-TR")
      });
      saveRequests(rows);
      toast("Lisans istegi admin paneline gonderildi.");
      form.reset();
    });
  }
}

function initAdmin() {
  if (document.body.dataset.page !== "admin") return;
  const user = requireRole("admin");
  if (!user) return;
  const name = qs("[data-user-name]");
  if (name) name.textContent = user.name;

  renderRequests(qs("#requestRows"), getRequests());
  renderReleases();

  const licenseForm = qs("#licenseForm");
  if (licenseForm) {
    licenseForm.addEventListener("submit", event => {
      event.preventDefault();
      const key = "OPL-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      qs("#generatedKey").value = key;
      toast("Lisans anahtari olusturuldu.");
    });
  }

  const releaseForm = qs("#releaseForm");
  if (releaseForm) {
    releaseForm.addEventListener("submit", event => {
      event.preventDefault();
      const rows = getReleases();
      rows.unshift({
        version: qs("#versionNo").value.trim() || "1.1.2",
        channel: qs("#releaseChannel").value,
        file: qs("#releaseFile").value.trim() || "OptiLineKurulum.exe",
        date: new Date().toLocaleDateString("tr-TR"),
        status: "Yayinda"
      });
      saveReleases(rows);
      renderReleases();
      toast("Yeni surum yayina hazirlandi.");
      releaseForm.reset();
    });
  }
}

function renderReleases() {
  const target = qs("#releaseRows");
  if (!target) return;
  target.innerHTML = getReleases().map(row => `
    <tr>
      <td><strong>${row.version}</strong></td>
      <td>${row.channel}</td>
      <td>${row.file}</td>
      <td>${row.date}</td>
      <td><span class="pill ${row.status === "Yayinda" ? "green" : ""}">${row.status}</span></td>
    </tr>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initLogin();
  initCustomer();
  initAdmin();
});
