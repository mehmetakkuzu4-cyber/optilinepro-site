const uiPages = {
  public: [
    ["home", "Ana Sayfa"], ["features", "Özellikler"], ["product", "Ürün Detayı"],
    ["pricing", "Paketler"], ["updates", "Güncellemeler"], ["downloads", "İndirme Merkezi"],
    ["support", "Destek"], ["login", "Giriş"]
  ],
  customer: [
    ["customer-dashboard", "Genel Bakış"], ["my-licenses", "Lisanslarım"],
    ["devices", "Cihazlarım"], ["customer-downloads", "Dosyalar"],
    ["tickets", "Destek Talepleri"], ["profile", "Hesabım"]
  ],
  admin: [
    ["admin-dashboard", "Yönetim Özeti"], ["licenses", "Lisans Yönetimi"],
    ["create-license", "Lisans Oluştur"], ["customers", "Müşteriler"],
    ["versions", "Sürüm Yönetimi"], ["publish-update", "Güncelleme Yayınla"],
    ["products", "Ürün Yönetimi"], ["support-admin", "Destek Merkezi"],
    ["logs", "İşlem Kayıtları"], ["settings", "Sistem Ayarları"]
  ]
};

let uiMode = "public";
let uiCurrent = "home";
let publicRelease = defaultRelease;

const uiNav = document.querySelector("#sideNav");
const uiScreen = document.querySelector("#screen");
const uiMetrics = document.querySelector("#metrics");

const metric = (label, value) => `<article class="metric"><small>${safeText(label)}</small><strong>${safeText(value)}</strong></article>`;
const sectionHead = (title, text, action = "") => `<div class="section-head"><div><h2>${title}</h2><p>${text}</p></div>${action}</div>`;
const productVisual = () => `<div class="product-frame">
  <div class="product-frame-head"><strong>OptiLine Pro Desktop</strong><span class="badge good">v${safeText(publicRelease.version || "1.1.1")}</span></div>
  <img src="assets/screen-profile.png" alt="OptiLine Pro hızlı optimizasyon ekranı">
  <div class="product-kpis"><div><span>Kesim planı</span><strong>100 adım</strong></div><div><span>Raporlama</span><strong>PDF + Excel</strong></div></div>
</div>`;

function renderMetrics() {
  const licenses = getLicenses();
  const active = licenses.filter(item => item.status === "Aktif").length;
  const customers = new Set(licenses.map(item => item.label)).size;
  const expiring = licenses.filter(item => item.expires_at && new Date(item.expires_at) - new Date() < 31 * 86400000).length;
  const values = uiMode === "public"
    ? [["Optimizasyon modülü", "4"], ["Rapor formatı", "2"], ["Güncel sürüm", publicRelease.version || "1.1.1"], ["Windows", "10 / 11"]]
    : uiMode === "customer"
      ? [["Aktif lisans", active], ["Kayıtlı cihaz", licenses.reduce((sum, row) => sum + Number(row.max_devices || 0), 0)], ["Güncel sürüm", publicRelease.version || "1.1.1"], ["Destek talebi", "0"]]
      : [["Aktif lisans", active], ["Müşteri", customers], ["Güncel sürüm", getRelease().version || "1.1.1"], ["Yaklaşan bitiş", expiring]];
  uiMetrics.innerHTML = values.map(([label, value]) => metric(label, value)).join("");
}

function renderNav() {
  uiNav.innerHTML = "";
  uiPages[uiMode].forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.classList.toggle("active", id === uiCurrent);
    button.addEventListener("click", () => {
      uiCurrent = id;
      history.replaceState(null, "", `#${uiMode}/${uiCurrent}`);
      renderNav();
      renderScreen();
    });
    uiNav.appendChild(button);
  });
}

function homeView() {
  return `<div class="hero">
    <div class="hero-copy">
      <span class="badge">Profesyonel kesim optimizasyonu</span>
      <h1>Üretiminizi OptiLine Pro ile daha verimli yönetin.</h1>
      <p class="lead">Profil, levha, stok ve proje süreçlerini tek merkezde yönetin. Daha az fire, daha net stok ve üretime hazır kesim planları elde edin.</p>
      <div class="actions"><button class="button primary" data-go="downloads" type="button">Programı indir</button><button class="button ghost" data-go="product" type="button">Ürünü incele</button><button class="button ghost" data-go="support" type="button">Destek al</button></div>
    </div>
    ${productVisual()}
  </div>
  <div class="grid-3" style="margin-top:16px">
    <article class="card feature-card"><h3>Akıllı optimizasyon</h3><p class="muted">Kesim kombinasyonlarını arar, stok ve fire dengesine göre en güçlü planı öne çıkarır.</p></article>
    <article class="card feature-card"><h3>Detaylı raporlama</h3><p class="muted">Kesim planlarını, kullanılan stokları ve sonuç özetini okunaklı PDF ve Excel çıktısına dönüştürür.</p></article>
    <article class="card feature-card"><h3>Kontrollü lisans</h3><p class="muted">Modül, cihaz, süre ve kullanım limitlerini tek lisans yapısında yönetir.</p></article>
  </div>`;
}

function featuresView() {
  const rows = [
    ["Profil optimizasyonu", "Profil kesim listelerini stok seçenekleriyle değerlendirir ve üretim planına dönüştürür."],
    ["Levha optimizasyonu", "2D parçaları yön ve kesim payı kurallarıyla levha üzerine yerleştirir."],
    ["Stok danışmanı", "Farklı stok boylarını fire, toplam metre ve maliyet üzerinden karşılaştırır."],
    ["Proje optimizasyonu", "Excel kaynaklarını, profil seçimlerini ve proje raporlarını tek akışta toplar."],
    ["PDF ve Excel çıktısı", "Üretim ekibine aktarılabilir, düzenli ve takip edilebilir raporlar hazırlar."],
    ["Lisans ve güncelleme", "Yetkili modülleri kontrol eder ve yayınlanan sürümlere tek merkezden ulaşır."]
  ];
  return `${sectionHead("OptiLine Pro özellikleri", "Programın gerçek üretim akışına hizmet eden ana yetenekleri.")}
    <div class="grid-2">${rows.map((row, index) => `<article class="card feature-card"><span class="number">0${index + 1}</span><h3 style="margin-top:14px">${row[0]}</h3><p class="muted">${row[1]}</p></article>`).join("")}</div>`;
}

function productView() {
  return `<div class="grid-2"><article class="card"><span class="badge">OptiLine Pro 1.1.1</span><h1 style="margin-top:16px">Kesim planlamasının merkezi.</h1><p class="lead">Dört uzman modül, ortak stok yapısı, ölçü girişleri ve üretim raporları aynı masaüstü deneyiminde birleşir.</p><div class="notice" style="margin-top:22px">Profil, levha, stok danışmanı ve proje optimizasyonu ayrı ayrı lisanslanabilir.</div></article>${productVisual()}</div>`;
}

function pricingView() {
  return `${sectionHead("Lisans paketleri", "İhtiyaç duyduğunuz modüller ve kullanım limitleri lisansa özel tanımlanır.")}
    <div class="grid-3"><article class="card"><h3>Başlangıç</h3><p class="muted">Seçili tek modül ve sınırlı kullanım.</p><button class="button ghost" data-mode-target="customer" type="button">Lisans iste</button></article><article class="card" style="border-color:var(--accent)"><span class="badge">Önerilen</span><h3 style="margin-top:12px">Profesyonel</h3><p class="muted">Birden fazla modül, cihaz ve ihtiyaca özel limitler.</p><button class="button primary" data-mode-target="customer" type="button">Lisans iste</button></article><article class="card"><h3>Kurumsal</h3><p class="muted">Proje, kullanıcı ve cihaz ihtiyacına göre özel yapı.</p><button class="button ghost" data-go="support" type="button">İletişime geç</button></article></div>`;
}

function updatesView() {
  const release = publicRelease;
  return `${sectionHead("Sürüm notları", "Yayınlanan güncellemeler ve kurulum bilgileri.", `<span class="badge good">Son sürüm ${safeText(release.version || "1.1.1")}</span>`)}
    <article class="card"><div class="section-head"><div><h3>OptiLine Pro ${safeText(release.version || "1.1.1")}</h3><p>${safeText(release.date || "Yayın tarihi belirtilmedi")}</p></div><span class="badge good">Kararlı</span></div><p>${safeText(release.notes || "Sürüm notu hazırlanıyor.")}</p></article>`;
}

function downloadsView(customer = false) {
  const release = publicRelease;
  return `${sectionHead(customer ? "Dosyalarım" : "İndirme merkezi", "Windows kurulum dosyası ve yayınlanan güncelleme paketi.")}
    <div class="grid-2"><article class="card"><span class="badge good">Güncel</span><h3 style="margin-top:14px">OptiLine Pro Setup</h3><p class="muted">Sürüm ${safeText(release.version || "1.1.1")} · Windows 10 / 11</p><a class="button primary" href="${safeText(release.setup_url || "#")}" target="_blank" rel="noreferrer">Setup dosyasını indir</a></article><article class="card"><span class="badge">Update</span><h3 style="margin-top:14px">Güncelleme paketi</h3><p class="muted">Mevcut kurulumlar için yayınlanan paket.</p><a class="button ghost" href="${safeText(release.update_url || "#")}" target="_blank" rel="noreferrer">Paketi aç</a></article></div>`;
}

function supportView() {
  return `${sectionHead("Destek merkezi", "Kurulum, lisans ve program kullanımı için doğru kanala ulaşın.")}
    <div class="grid-3"><article class="card"><h3>Kullanım kılavuzu</h3><p class="muted">Modüllerin adım adım kullanımına ulaşın.</p></article><article class="card"><h3>Lisans desteği</h3><p class="muted">Makine kodu ve lisans aktivasyonu için talep oluşturun.</p></article><article class="card"><h3>Teknik destek</h3><p class="muted">Kurulum ve program davranışıyla ilgili kayıt açın.</p></article></div>`;
}

function loginView() {
  return `<div class="form-panel" style="max-width:500px;margin:0 auto"><h2>OptiLine hesabınıza giriş yapın</h2><p class="muted">Lisanslarınıza, cihazlarınıza ve dosyalarınıza ulaşın.</p><form class="form-grid" style="grid-template-columns:1fr;margin-top:20px" id="loginForm"><label>E-posta<input type="email" required placeholder="mail@firma.com"></label><label>Şifre<input type="password" required placeholder="••••••••"></label><button class="button primary" type="submit">Giriş yap</button></form></div>`;
}

function customerDashboardView() {
  const rows = getLicenses();
  const active = rows.find(item => item.status === "Aktif") || rows[0];
  return `${sectionHead("Müşteri paneli", "Lisans, cihaz, indirme ve destek işlemlerinin merkezi.")}
    <div class="grid-2"><article class="card"><div class="section-head"><div><h3>${safeText(active?.label || "OptiLine Pro")}</h3><p>${safeText(active?.modules?.join(", ") || "Lisans bekleniyor")}</p></div><span class="badge ${active?.status === "Aktif" ? "good" : "warn"}">${safeText(active?.status || "Bekliyor")}</span></div><p class="muted">Bitiş: ${safeText(active?.expires_at || "Sınırsız")}</p><div class="bar"><span style="width:84%"></span></div></article><article class="card"><h3>Son sürüm</h3><h1>${safeText(publicRelease.version || "1.1.1")}</h1><button class="button ghost" data-go="customer-downloads" type="button">Güncellemeyi indir</button></article></div>`;
}

function licensesView(admin = false) {
  const rows = getLicenses();
  const action = admin ? `<button class="button primary" data-go="create-license" type="button">Lisans oluştur</button>` : "";
  return `${sectionHead(admin ? "Lisans yönetimi" : "Lisanslarım", admin ? "Tüm lisansları görüntüleyin ve durumlarını yönetin." : "Hesabınıza bağlı lisansları görüntüleyin.", action)}
    <div class="table-wrap"><table><thead><tr><th>Lisans</th><th>Müşteri</th><th>Modüller</th><th>Bitiş</th><th>Durum</th>${admin ? "<th>İşlem</th>" : ""}</tr></thead><tbody>${rows.map(row => `<tr><td>${safeText(row.key)}</td><td>${safeText(row.label)}</td><td>${safeText(row.modules.join(", "))}</td><td>${safeText(row.expires_at || "Sınırsız")}</td><td><span class="badge ${row.status === "Aktif" ? "good" : row.status === "Askıda" ? "warn" : "danger"}">${safeText(row.status)}</span></td>${admin ? `<td><div class="table-actions"><button class="button success" data-license-status="Aktif" data-key="${safeText(row.key)}" type="button">Aktif</button><button class="button danger" data-license-status="Askıda" data-key="${safeText(row.key)}" type="button">Askı</button></div></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}

function devicesView() {
  return `${sectionHead("Bağlı cihazlar", "Lisanslarınızla etkinleştirilen bilgisayarlar.")}
    <div class="grid-2"><article class="card"><h3>OFIS-PC-01</h3><p class="muted">Windows 11 · Son kontrol bugün</p><button class="button ghost" type="button">Cihazı kaldır</button></article><article class="card"><h3>LAPTOP-MEHMET</h3><p class="muted">Windows 10 · Son kontrol dün</p><button class="button ghost" type="button">Cihazı kaldır</button></article></div>`;
}

function profileView() {
  return `${sectionHead("Hesap ayarları", "Firma ve iletişim bilgilerinizi yönetin.")}
    <form class="form-panel form-grid" id="profileForm"><label>Firma adı<input value="OptiLine Pro"></label><label>Yetkili kişi<input value="Mehmet Akkuzu"></label><label>E-posta<input type="email" placeholder="mail@firma.com"></label><label>Telefon<input placeholder="+90"></label><button class="button primary" type="submit">Bilgileri kaydet</button></form>`;
}

function adminDashboardView() {
  const rows = getLicenses();
  return `${sectionHead("Yönetim paneli", "OptiLine sisteminin genel durumu.", `<button class="button primary" data-go="create-license" type="button">Yeni lisans oluştur</button>`)}
    <div class="grid-2"><article class="card"><h3>Son lisans işlemleri</h3>${rows.slice(0, 3).map(row => `<p>${safeText(row.label)} <span class="badge ${row.status === "Aktif" ? "good" : "warn"}">${safeText(row.status)}</span></p>`).join("") || `<p class="muted">Henüz lisans yok.</p>`}</article><article class="card"><h3>Sistem durumu</h3><p>Lisans dosyası <span class="badge good">Hazır</span></p><p>Güncelleme kaydı <span class="badge good">Çalışıyor</span></p><p>GitHub Pages <span class="badge good">Yayında</span></p></article></div>`;
}

function createLicenseView() {
  return `${sectionHead("Yeni lisans oluştur", "Modülleri, cihaz limitini, kullanım sınırlarını ve bitiş tarihini belirleyin.")}
    <form class="form-panel form-grid" id="uiLicenseForm"><label>Etiket<input id="uiLicLabel" required placeholder="Firma / müşteri adı"></label><label>Makine kodu<input id="uiLicMachine" placeholder="İsteğe bağlı"></label><label>Maksimum cihaz<input id="uiLicDevices" type="number" min="1" value="1"></label><label>Bitiş tarihi<input id="uiLicExpiry" type="date"></label><div class="check-row"><label><input name="uiModule" type="checkbox" value="Proje">Proje</label><label><input name="uiModule" type="checkbox" value="Profil">Profil</label><label><input name="uiModule" type="checkbox" value="Stok Danışmanı">Stok Danışmanı</label><label><input name="uiModule" type="checkbox" value="Levha">Levha</label></div><label>Proje limiti<input id="uiLimitProject" type="number" value="2"></label><label>Profil limiti<input id="uiLimitProfile" type="number" value="50"></label><label>Danışman limiti<input id="uiLimitAdvisor" type="number" value="200"></label><label>Levha limiti<input id="uiLimitSheet" type="number" value="50"></label><label style="grid-column:1/-1">Not<textarea id="uiLicNote"></textarea></label><button class="button primary" type="submit">Lisans anahtarı üret</button></form>`;
}

function customersView() {
  const grouped = [...new Set(getLicenses().map(item => item.label))];
  return `${sectionHead("Müşteriler", "Lisans kayıtlarındaki müşteri ve firmalar.")}<div class="grid-2">${grouped.map(name => `<article class="card"><h3>${safeText(name)}</h3><p class="muted">${getLicenses().filter(item => item.label === name).length} lisans kaydı</p></article>`).join("") || `<article class="card empty">Henüz müşteri kaydı yok.</article>`}</div>`;
}

function versionsView() {
  const release = getRelease();
  return `${sectionHead("Sürüm yönetimi", "Yayındaki kurulum ve güncelleme kaydı.", `<button class="button primary" data-go="publish-update" type="button">Yeni sürüm</button>`)}<article class="card"><div class="section-head"><div><h3>OptiLine Pro ${safeText(release.version)}</h3><p>${safeText(release.date || "Tarih yok")}</p></div><span class="badge good">Yayında</span></div><p class="muted">${safeText(release.notes || "Sürüm notu yok.")}</p></article>`;
}

function publishUpdateView() {
  const release = getRelease();
  return `${sectionHead("Güncelleme yayınla", "Sürüm numarası, paket bağlantıları ve sürüm notunu hazırlayın.")}
    <form class="form-panel form-grid" id="uiReleaseForm"><label>Sürüm numarası<input id="uiRelVersion" required value="${safeText(release.version || "1.1.1")}"></label><label>Yayın tarihi<input id="uiRelDate" type="date" value="${safeText(release.date || todayIso())}"></label><label style="grid-column:1/-1">Setup bağlantısı<input id="uiRelSetup" value="${safeText(release.setup_url || "")}"></label><label style="grid-column:1/-1">Update bağlantısı<input id="uiRelUpdate" value="${safeText(release.update_url || "")}"></label><label style="grid-column:1/-1">SHA-256<input id="uiRelSha" value="${safeText(release.sha256 || "")}"></label><label style="grid-column:1/-1">Sürüm notları<textarea id="uiRelNotes">${safeText(release.notes || "")}</textarea></label><button class="button primary" type="submit">Sürüm kaydını hazırla</button></form>`;
}

function genericView(title, text) {
  return `${sectionHead(title, text)}<article class="card empty"><div><h3>${title}</h3><p>${text}</p></div></article>`;
}

function currentView() {
  const views = {
    home: homeView,
    features: featuresView,
    product: productView,
    pricing: pricingView,
    updates: updatesView,
    downloads: () => downloadsView(false),
    support: supportView,
    login: loginView,
    "customer-dashboard": customerDashboardView,
    "my-licenses": () => licensesView(false),
    devices: devicesView,
    "customer-downloads": () => downloadsView(true),
    tickets: () => genericView("Destek talepleri", "Açık ve sonuçlanan destek kayıtlarınızı görüntüleyin."),
    profile: profileView,
    "admin-dashboard": adminDashboardView,
    licenses: () => licensesView(true),
    "create-license": createLicenseView,
    customers: customersView,
    versions: versionsView,
    "publish-update": publishUpdateView,
    products: () => genericView("Ürün yönetimi", "OptiLine Pro modüllerini ve paketlerini yönetin."),
    "support-admin": () => genericView("Destek merkezi", "Müşteri destek taleplerini yönetin."),
    logs: () => `<h2>İşlem kayıtları</h2><div class="notice">Yönetim merkezi açıldı · ${new Date().toLocaleString("tr-TR")}</div><div class="notice">Sürüm kaydı kontrol edildi · ${safeText(getRelease().version)}</div>`,
    settings: () => `${sectionHead("Sistem ayarları", "Lisans ve güncelleme davranışlarını yönetin.")}<div class="form-panel form-grid"><label>Lisans doğrulama<select><option>Her açılışta</option><option>24 saatte bir</option></select></label><label>Yayın kanalı<select><option>Kararlı</option><option>Beta</option></select></label></div>`
  };
  return (views[uiCurrent] || (() => genericView("Sayfa hazırlanıyor", "Bu bölüm henüz hazırlanmadı.")))();
}

function renderScreen() {
  uiScreen.innerHTML = currentView();
}

function changeMode(mode) {
  uiMode = mode;
  uiCurrent = uiPages[mode][0][0];
  history.replaceState(null, "", `#${uiMode}/${uiCurrent}`);
  document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
  renderMetrics();
  renderNav();
  renderScreen();
}

function showUiToast(message) {
  const target = document.querySelector(".toast");
  target.textContent = message;
  target.classList.add("show");
  window.clearTimeout(showUiToast.timer);
  showUiToast.timer = window.setTimeout(() => target.classList.remove("show"), 2600);
}

document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => changeMode(button.dataset.mode)));

uiScreen.addEventListener("click", event => {
  const go = event.target.closest("[data-go]");
  if (go) {
    uiCurrent = go.dataset.go;
    history.replaceState(null, "", `#${uiMode}/${uiCurrent}`);
    renderNav();
    renderScreen();
    return;
  }
  const modeTarget = event.target.closest("[data-mode-target]");
  if (modeTarget) {
    changeMode(modeTarget.dataset.modeTarget);
    return;
  }
  const statusButton = event.target.closest("[data-license-status]");
  if (statusButton) {
    const rows = getLicenses();
    const row = rows.find(item => item.key === statusButton.dataset.key);
    if (row) {
      row.status = statusButton.dataset.licenseStatus;
      setLicenses(rows);
      renderMetrics();
      renderScreen();
      showUiToast("Lisans durumu güncellendi.");
    }
  }
});

uiScreen.addEventListener("submit", event => {
  event.preventDefault();
  if (event.target.id === "loginForm") {
    changeMode("customer");
    showUiToast("Müşteri paneli açıldı.");
  }
  if (event.target.id === "profileForm") showUiToast("Hesap bilgileri kaydedildi.");
  if (event.target.id === "uiLicenseForm") {
    const modules = [...event.target.querySelectorAll("input[name='uiModule']:checked")].map(input => input.value);
    if (!modules.length) {
      showUiToast("En az bir modül seçin.");
      return;
    }
    const license = {
      key: generateKey(), label: document.querySelector("#uiLicLabel").value.trim(), machine: document.querySelector("#uiLicMachine").value.trim(),
      status: "Aktif", created_at: new Date().toLocaleString("tr-TR"), last_check: "-", version: getRelease().version,
      max_devices: Number(document.querySelector("#uiLicDevices").value || 1), expires_at: document.querySelector("#uiLicExpiry").value || null, modules,
      limits: { project: Number(document.querySelector("#uiLimitProject").value || 0), profile: Number(document.querySelector("#uiLimitProfile").value || 0), advisor: Number(document.querySelector("#uiLimitAdvisor").value || 0), sheet: Number(document.querySelector("#uiLimitSheet").value || 0) },
      note: document.querySelector("#uiLicNote").value.trim()
    };
    const rows = getLicenses(); rows.unshift(license); setLicenses(rows);
    navigator.clipboard?.writeText(license.key);
    uiCurrent = "licenses"; renderMetrics(); renderNav(); renderScreen(); showUiToast("Lisans oluşturuldu ve anahtar kopyalandı.");
  }
  if (event.target.id === "uiReleaseForm") {
    const release = {
      version: document.querySelector("#uiRelVersion").value.trim(), date: document.querySelector("#uiRelDate").value,
      setup_url: document.querySelector("#uiRelSetup").value.trim(), update_url: document.querySelector("#uiRelUpdate").value.trim(),
      sha256: document.querySelector("#uiRelSha").value.trim(), required: false, notes: document.querySelector("#uiRelNotes").value.trim()
    };
    setRelease(release); publicRelease = release; renderMetrics(); uiCurrent = "versions"; renderNav(); renderScreen(); showUiToast("Sürüm kaydı hazırlandı.");
  }
});

async function loadPublicRelease() {
  publicRelease = getRelease();
  try {
    const response = await fetch("version.json", { cache: "no-store" });
    if (response.ok) publicRelease = await response.json();
  } catch {
    // Yerel kayıt çevrimdışı kullanım için yeterlidir.
  }
  renderMetrics();
  renderScreen();
}

function loadRoute() {
  const [mode, page] = location.hash.replace(/^#/, "").split("/");
  if (!uiPages[mode]) return;
  uiMode = mode;
  if (uiPages[mode].some(([id]) => id === page)) uiCurrent = page;
  else uiCurrent = uiPages[mode][0][0];
  document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === uiMode));
}

loadRoute();
renderNav();
renderMetrics();
renderScreen();
loadPublicRelease();
