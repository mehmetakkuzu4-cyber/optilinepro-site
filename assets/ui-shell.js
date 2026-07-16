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
    ["customers", "Müşteriler"],
    ["versions", "Sürüm Yönetimi"], ["publish-update", "Güncelleme Yayınla"]
  ]
};

let uiMode = "public";
let uiCurrent = "home";
let publicRelease = defaultRelease;
let uiLicenseFilter = "all";
let uiLicenseSearch = "";
let uiLicenseLayout = "cards";

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
  const setupAction = releaseUrlReady(release.setup_url)
    ? `<a class="button primary" href="${safeText(release.setup_url)}" target="_blank" rel="noreferrer">Setup dosyasını indir</a>`
    : `<button class="button primary" type="button" disabled>Setup henüz yayınlanmadı</button>`;
  const updateAction = releaseUrlReady(release.update_url)
    ? `<a class="button ghost" href="${safeText(release.update_url)}" target="_blank" rel="noreferrer">Paketi aç</a>`
    : `<button class="button ghost" type="button" disabled>Güncelleme henüz yayınlanmadı</button>`;
  return `${sectionHead(customer ? "Dosyalarım" : "İndirme merkezi", "Windows kurulum dosyası ve yayınlanan güncelleme paketi.")}
    <div class="grid-2"><article class="card"><span class="badge ${releaseUrlReady(release.setup_url) ? "good" : "warn"}">${releaseUrlReady(release.setup_url) ? "Güncel" : "Bekliyor"}</span><h3 style="margin-top:14px">OptiLine Pro Setup</h3><p class="muted">Sürüm ${safeText(release.version || "1.1.1")} · Windows 10 / 11</p>${setupAction}</article><article class="card"><span class="badge">Update</span><h3 style="margin-top:14px">Güncelleme paketi</h3><p class="muted">Mevcut kurulumlar için yayınlanan paket.</p>${updateAction}</article></div>`;
}

function releaseUrlReady(value) {
  return /^https:\/\//i.test(value || "") && !String(value).includes("USERNAME");
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
  if (admin) return licenseManagementView();
  return `${sectionHead("Lisanslarım", "Hesabınıza bağlı lisansları görüntüleyin.")}
    <div class="table-wrap"><table><thead><tr><th>Lisans</th><th>Müşteri</th><th>Modüller</th><th>Bitiş</th><th>Durum</th></tr></thead><tbody>${rows.map(row => `<tr><td>${safeText(row.key)}</td><td>${safeText(row.label)}</td><td>${safeText((row.modules || []).join(", "))}</td><td>${safeText(row.expires_at || "Sınırsız")}</td><td><span class="badge ${licenseBadgeClass(row.status)}">${safeText(row.status)}</span></td></tr>`).join("")}</tbody></table></div>`;
}

function licenseBadgeClass(status) {
  if (status === "Aktif") return "good";
  if (status === "Askıda") return "warn";
  return "danger";
}

function filteredLicenses() {
  const query = uiLicenseSearch.trim().toLocaleLowerCase("tr-TR");
  return getLicenses().filter(row => {
    const filterMatches = uiLicenseFilter === "all" || row.status === uiLicenseFilter;
    const searchable = `${row.key || ""} ${row.label || ""} ${row.machine || ""} ${(row.modules || []).join(" ")}`.toLocaleLowerCase("tr-TR");
    return filterMatches && searchable.includes(query);
  });
}

function licenseDeviceRows(row) {
  const devices = Array.isArray(row.devices) && row.devices.length
    ? row.devices
    : row.machine
      ? [{ machine: row.machine, activated_at: row.created_at, last_check: row.last_check, version: row.version, status: row.status }]
      : [];
  if (!devices.length) return `<div class="license-device-empty">Henüz etkinleştirilmiş cihaz yok.</div>`;
  return `<div class="license-device-table"><div class="license-device-head"><span>Makine ID</span><span>Aktivasyon tarihi</span><span>Son kontrol</span><span>Program sürümü</span><span>Durum</span></div>${devices.map(device => `<div class="license-device-row"><strong>${safeText(device.machine || "-")}</strong><span>${safeText(device.activated_at || "-")}</span><span>${safeText(device.last_check || "-")}</span><span>${safeText(device.version || "-")}</span><span><span class="badge ${licenseBadgeClass(device.status || row.status)}">${safeText(device.status || row.status)}</span></span></div>`).join("")}</div>`;
}

function licenseCardsMarkup(rows) {
  if (!rows.length) return `<div class="license-empty"><strong>Bu filtrede lisans bulunamadı.</strong><span>Aramayı temizleyin veya başka bir durum seçin.</span></div>`;
  return rows.map(row => `<article class="license-item">
    <div class="license-item-main">
      <div class="license-key-row"><code>${safeText(row.key)}</code><button class="icon-button" data-license-action="copy" data-key="${safeText(row.key)}" type="button" title="Anahtarı kopyala">Kopyala</button></div>
      <div class="license-title-row"><div><h3>${safeText(row.label || "Etiketsiz lisans")}</h3><div class="license-meta"><span class="badge ${licenseBadgeClass(row.status)}">${safeText(row.status)}</span><span>Cihaz: ${safeText(row.max_devices || 1)}</span><span>Bitiş: ${safeText(row.expires_at || "Sınırsız")}</span><span>Son kontrol: ${safeText(row.last_check || "-")}</span></div></div></div>
      <div class="license-module-line"><strong>Yetkiler</strong><span>${safeText((row.modules || []).join(" · ") || "Modül seçilmedi")}</span></div>
      <div class="license-device-title"><strong>Cihazlar</strong><span>${row.machine ? "1 bağlı cihaz" : "Cihaz bekleniyor"}</span></div>
      ${licenseDeviceRows(row)}
    </div>
    <div class="license-card-actions">
      ${row.status === "Askıda" || row.status === "İptal" ? `<button class="license-action success" data-license-action="activate" data-key="${safeText(row.key)}" type="button">Aktif Yap</button>` : `<button class="license-action" data-license-action="pause" data-key="${safeText(row.key)}" type="button">Askıya Al</button>`}
      <button class="license-action success" data-license-action="renew" data-key="${safeText(row.key)}" type="button">Anahtar Yenile</button>
      <button class="license-action danger" data-license-action="cancel" data-key="${safeText(row.key)}" type="button">Lisansı İptal Et</button>
      <button class="license-action danger" data-license-action="delete" data-key="${safeText(row.key)}" type="button">Kalıcı Sil</button>
      <button class="license-action warning" data-license-action="reset-device" data-key="${safeText(row.key)}" type="button">Cihazları Sıfırla</button>
    </div>
  </article>`).join("");
}

function licenseTableMarkup(rows) {
  if (!rows.length) return `<div class="license-empty"><strong>Bu filtrede lisans bulunamadı.</strong></div>`;
  return `<div class="table-wrap license-summary-table"><table><thead><tr><th>Anahtar</th><th>Etiket</th><th>Cihaz</th><th>Bitiş</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>${rows.map(row => `<tr><td><code>${safeText(row.key)}</code></td><td>${safeText(row.label)}</td><td>${safeText(row.machine || "-")}</td><td>${safeText(row.expires_at || "Sınırsız")}</td><td><span class="badge ${licenseBadgeClass(row.status)}">${safeText(row.status)}</span></td><td><button class="button ghost" data-license-action="copy" data-key="${safeText(row.key)}" type="button">Kopyala</button></td></tr>`).join("")}</tbody></table></div>`;
}

function licenseResultsMarkup() {
  const rows = filteredLicenses();
  return uiLicenseLayout === "table" ? licenseTableMarkup(rows) : licenseCardsMarkup(rows);
}

function licenseCreateForm() {
  return `<aside class="license-create-panel">
    <div class="license-create-heading"><small>YENİ LİSANS</small><h2>Lisans Oluştur</h2><p>Modül, cihaz ve kullanım limitlerini tek kayıtta tanımlayın.</p></div>
    <div class="license-preview" aria-hidden="true"><div class="preview-top"><i></i><i></i><i></i><span></span></div><div class="preview-grid"><div class="preview-side"><b></b><b></b><b></b></div><div class="preview-main"><span></span><span></span><span></span><em></em><em></em><em></em></div></div></div>
    <form id="uiLicenseForm" class="license-create-form">
      <label>Etiket<input id="uiLicLabel" required placeholder="Örn: Optimization Pro v1"></label>
      <label>Makine kodu<input id="uiLicMachine" placeholder="İsteğe bağlı"></label>
      <label>Maksimum cihaz<input id="uiLicDevices" type="number" min="1" value="1"></label>
      <div class="license-expiry-row"><label>Bitiş tarihi<input id="uiLicExpiry" type="date"></label><label class="inline-check"><input id="uiLicUnlimited" type="checkbox">Sınırsız süre</label></div>
      <fieldset class="license-modules"><legend>Modül yetkileri</legend><label><input name="uiModule" type="checkbox" value="Proje">Proje</label><label><input name="uiModule" type="checkbox" value="Profil">Profil</label><label><input name="uiModule" type="checkbox" value="Stok Danışmanı">Stok Danışmanı</label><label><input name="uiModule" type="checkbox" value="Levha">Levha</label></fieldset>
      <div class="license-limit-grid"><label>Proje limiti<input id="uiLimitProject" type="number" min="0" value="2"></label><label>Profil limiti<input id="uiLimitProfile" type="number" min="0" value="50"></label><label>Danışman limiti<input id="uiLimitAdvisor" type="number" min="0" value="200"></label><label>Levha limiti<input id="uiLimitSheet" type="number" min="0" value="50"></label></div>
      <label>Not<textarea id="uiLicNote" placeholder="Müşteri, paket veya satış notu"></textarea></label>
      <button class="button primary license-create-button" type="submit">Lisans Oluştur</button>
    </form>
  </aside>`;
}

function licenseManagementView() {
  const rows = filteredLicenses();
  return `<div class="license-workspace">
    <section class="license-list-panel">
      <div class="license-toolbar"><div class="license-search"><input id="uiLicenseSearch" value="${safeText(uiLicenseSearch)}" placeholder="Etikete, anahtara veya makine koduna göre ara"></div><div class="license-filter-group"><button class="filter-chip ${uiLicenseFilter === "all" ? "active" : ""}" data-license-filter="all" type="button">Tümü</button><button class="filter-chip ${uiLicenseFilter === "Aktif" ? "active good" : ""}" data-license-filter="Aktif" type="button">Aktif</button><button class="filter-chip ${uiLicenseFilter === "Askıda" ? "active warn" : ""}" data-license-filter="Askıda" type="button">Askıda</button><button class="filter-chip ${uiLicenseFilter === "İptal" ? "active danger" : ""}" data-license-filter="İptal" type="button">İptal</button></div><button class="layout-toggle" data-license-layout type="button">${uiLicenseLayout === "cards" ? "Tablo Görünümü" : "Kart Görünümü"}</button></div>
      <div class="license-list-info"><strong id="uiLicenseCount">${rows.length} lisans listeleniyor</strong><span>Lisansları, bağlı cihazları ve durum işlemlerini buradan yönetin.</span></div>
      <div id="uiLicenseResults" class="license-results">${licenseResultsMarkup()}</div>
    </section>
    ${licenseCreateForm()}
  </div>`;
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
  const release = getRelease();
  const releaseReady = releaseUrlReady(release.setup_url) && releaseUrlReady(release.update_url);
  return `${sectionHead("Yönetim paneli", "OptiLine sisteminin genel durumu.", `<button class="button primary" data-go="licenses" type="button">Lisans merkezini aç</button>`)}
    <div class="grid-2"><article class="card"><h3>Son lisans işlemleri</h3>${rows.slice(0, 3).map(row => `<p>${safeText(row.label)} <span class="badge ${licenseBadgeClass(row.status)}">${safeText(row.status)}</span></p>`).join("") || `<p class="muted">Henüz lisans yok.</p>`}</article><article class="card"><h3>Sistem durumu</h3><p>Lisans kayıtları <span class="badge warn">Tarayıcıda yerel</span></p><p>Güncelleme paketleri <span class="badge ${releaseReady ? "good" : "warn"}">${releaseReady ? "Bağlı" : "Bağlantı bekliyor"}</span></p><p>GitHub Pages <span class="badge good">Yayında</span></p></article></div>`;
}

function customersView() {
  const grouped = [...new Set(getLicenses().map(item => item.label))];
  return `${sectionHead("Müşteriler", "Lisans kayıtlarındaki müşteri ve firmalar.")}<div class="grid-2">${grouped.map(name => `<article class="card"><h3>${safeText(name)}</h3><p class="muted">${getLicenses().filter(item => item.label === name).length} lisans kaydı</p></article>`).join("") || `<article class="card empty">Henüz müşteri kaydı yok.</article>`}</div>`;
}

function versionsView() {
  const release = getRelease();
  const ready = releaseUrlReady(release.setup_url) && releaseUrlReady(release.update_url);
  return `${sectionHead("Sürüm yönetimi", "Yayındaki kurulum ve güncelleme kaydı.", `<button class="button primary" data-go="publish-update" type="button">Yeni sürüm</button>`)}<article class="card"><div class="section-head"><div><h3>OptiLine Pro ${safeText(release.version)}</h3><p>${safeText(release.date || "Tarih yok")}</p></div><span class="badge ${ready ? "good" : "warn"}">${ready ? "Yayına hazır" : "Dosya bağlantısı eksik"}</span></div><p class="muted">${safeText(release.notes || "Sürüm notu yok.")}</p></article>`;
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
    customers: customersView,
    versions: versionsView,
    "publish-update": publishUpdateView,
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
  const filterButton = event.target.closest("[data-license-filter]");
  if (filterButton) {
    uiLicenseFilter = filterButton.dataset.licenseFilter;
    renderScreen();
    return;
  }
  const layoutButton = event.target.closest("[data-license-layout]");
  if (layoutButton) {
    uiLicenseLayout = uiLicenseLayout === "cards" ? "table" : "cards";
    renderScreen();
    return;
  }
  const actionButton = event.target.closest("[data-license-action]");
  if (actionButton) {
    handleUiLicenseAction(actionButton.dataset.licenseAction, actionButton.dataset.key);
  }
});

uiScreen.addEventListener("input", event => {
  if (event.target.id !== "uiLicenseSearch") return;
  uiLicenseSearch = event.target.value;
  refreshUiLicenseResults();
});

uiScreen.addEventListener("change", event => {
  if (event.target.id !== "uiLicUnlimited") return;
  const expiry = document.querySelector("#uiLicExpiry");
  expiry.disabled = event.target.checked;
  if (event.target.checked) expiry.value = "";
});

function refreshUiLicenseResults() {
  const target = document.querySelector("#uiLicenseResults");
  const count = document.querySelector("#uiLicenseCount");
  if (target) target.innerHTML = licenseResultsMarkup();
  if (count) count.textContent = `${filteredLicenses().length} lisans listeleniyor`;
}

function handleUiLicenseAction(action, key) {
  const rows = getLicenses();
  const index = rows.findIndex(item => item.key === key);
  if (index < 0) return;
  const row = rows[index];
  if (action === "copy") {
    navigator.clipboard?.writeText(row.key);
    showUiToast("Lisans anahtarı kopyalandı.");
    return;
  }
  if (action === "delete") {
    if (!window.confirm(`${row.label || "Bu lisans"} kalıcı olarak silinsin mi?`)) return;
    rows.splice(index, 1);
    showUiToast("Lisans kalıcı olarak silindi.");
  }
  if (action === "activate") row.status = "Aktif";
  if (action === "pause") row.status = "Askıda";
  if (action === "cancel") row.status = "İptal";
  if (action === "renew") {
    row.key = generateKey();
    navigator.clipboard?.writeText(row.key);
    showUiToast("Yeni lisans anahtarı üretildi ve kopyalandı.");
  }
  if (action === "reset-device") {
    row.machine = "";
    row.devices = [];
    row.last_check = "-";
    showUiToast("Lisansın bağlı cihazları sıfırlandı.");
  }
  setLicenses(rows);
  renderMetrics();
  refreshUiLicenseResults();
}

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
      max_devices: Number(document.querySelector("#uiLicDevices").value || 1), expires_at: document.querySelector("#uiLicUnlimited").checked ? null : (document.querySelector("#uiLicExpiry").value || null), modules,
      limits: { project: Number(document.querySelector("#uiLimitProject").value || 0), profile: Number(document.querySelector("#uiLimitProfile").value || 0), advisor: Number(document.querySelector("#uiLimitAdvisor").value || 0), sheet: Number(document.querySelector("#uiLimitSheet").value || 0) },
      note: document.querySelector("#uiLicNote").value.trim()
    };
    const rows = getLicenses(); rows.unshift(license); setLicenses(rows);
    navigator.clipboard?.writeText(license.key);
    event.target.reset();
    document.querySelector("#uiLicExpiry").disabled = false;
    renderMetrics();
    refreshUiLicenseResults();
    showUiToast("Lisans oluşturuldu ve anahtar kopyalandı.");
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
