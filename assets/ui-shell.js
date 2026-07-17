const uiPages = {
  public: [
    ["home", "Ana Sayfa"], ["features", "Özellikler"], ["product", "Ürün Detayı"],
    ["pricing", "Paketler"], ["updates", "Güncellemeler"], ["downloads", "İndirme Merkezi"],
    ["support", "Destek"], ["request-license", "Lisans İste"], ["login", "Giriş"]
  ],
  customer: [
    ["customer-dashboard", "Genel Bakış"], ["my-licenses", "Lisanslarım"],
    ["devices", "Cihazlarım"], ["customer-downloads", "Dosyalar"],
    ["tickets", "Destek Talepleri"], ["profile", "Hesabım"]
  ],
  admin: [
    ["admin-dashboard", "Yönetim Özeti"], ["licenses", "Lisans Yönetimi"],
    ["customers", "Müşteriler"], ["admin-devices", "Cihazlar"],
    ["admin-support", "Destek Talepleri"], ["versions", "Sürüm Yönetimi"],
    ["publish-update", "Güncelleme Yayınla"], ["audit-logs", "İşlem Kayıtları"]
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
  <div class="product-frame-head"><strong>OptiLine Pro Desktop</strong><span class="badge good">v${safeText(publicRelease.version || "1.1.2")}</span></div>
  <img src="assets/screen-profile.png" alt="OptiLine Pro hızlı optimizasyon ekranı">
  <div class="product-kpis"><div><span>Kesim planı</span><strong>100 adım</strong></div><div><span>Raporlama</span><strong>PDF + Excel</strong></div></div>
</div>`;

function renderMetrics() {
  const licenses = uiMode === "customer"
    ? (getCustomerLicense() ? [getCustomerLicense()] : [])
    : getLicenses();
  const active = licenses.filter(item => item.status === "Aktif").length;
  const customers = portalState.customers?.length || new Set(licenses.map(item => item.label)).size;
  const customerDevices = portalState.customer?.devices?.length || 0;
  const customerTickets = portalState.customer?.tickets?.length || 0;
  const expiring = licenses.filter(item => item.expires_at && new Date(item.expires_at) - new Date() < 31 * 86400000).length;
  const values = uiMode === "public"
    ? [["Optimizasyon modülü", "4"], ["Rapor formatı", "2"], ["Güncel sürüm", publicRelease.version || "1.1.2"], ["Windows", "10 / 11"]]
    : uiMode === "customer"
      ? [["Aktif lisans", active], ["Kayıtlı cihaz", customerDevices], ["Güncel sürüm", publicRelease.version || "1.1.2"], ["Destek talebi", customerTickets]]
      : [["Aktif lisans", active], ["Müşteri", customers], ["Güncel sürüm", getRelease().version || "1.1.2"], ["Yaklaşan bitiş", expiring]];
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
    <article class="card feature-card"><h3>Kontrollü lisans</h3><p class="muted">Modül yetkilerini, cihaz sayısını ve lisans süresini tek lisans yapısında yönetir.</p></article>
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
  return `<div class="grid-2"><article class="card"><span class="badge">OptiLine Pro 1.1.2</span><h1 style="margin-top:16px">Kesim planlamasının merkezi.</h1><p class="lead">Dört uzman modül, ortak stok yapısı, ölçü girişleri ve üretim raporları aynı masaüstü deneyiminde birleşir.</p><div class="notice" style="margin-top:22px">Profil, levha, stok danışmanı ve proje optimizasyonu ayrı ayrı lisanslanabilir.</div></article>${productVisual()}</div>`;
}

function pricingView() {
  return `${sectionHead("Lisans paketleri", "İhtiyaç duyduğunuz modüller lisansa özel tanımlanır ve seçilen modüller sınırsız açılır.")}
    <div class="grid-3"><article class="card"><h3>Başlangıç</h3><p class="muted">Seçili tek modülde tam ve sınırsız kullanım.</p><button class="button ghost" data-go="request-license" type="button">Lisans iste</button></article><article class="card" style="border-color:var(--accent)"><span class="badge">Önerilen</span><h3 style="margin-top:12px">Profesyonel</h3><p class="muted">Birden fazla modül için tam erişim, cihaz ve süre seçimi.</p><button class="button primary" data-go="request-license" type="button">Lisans iste</button></article><article class="card"><h3>Kurumsal</h3><p class="muted">Proje, kullanıcı ve cihaz ihtiyacına göre özel yapı.</p><button class="button ghost" data-go="support" type="button">İletişime geç</button></article></div>`;
}

function updatesView() {
  const release = publicRelease;
  return `${sectionHead("Sürüm notları", "Yayınlanan güncellemeler ve kurulum bilgileri.", `<span class="badge good">Son sürüm ${safeText(release.version || "1.1.2")}</span>`)}
    <article class="card"><div class="section-head"><div><h3>OptiLine Pro ${safeText(release.version || "1.1.2")}</h3><p>${safeText(release.date || "Yayın tarihi belirtilmedi")}</p></div><span class="badge good">Kararlı</span></div><p>${safeText(release.notes || "Sürüm notu hazırlanıyor.")}</p></article>`;
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
    <div class="grid-2"><article class="card"><span class="badge ${releaseUrlReady(release.setup_url) ? "good" : "warn"}">${releaseUrlReady(release.setup_url) ? "Güncel" : "Bekliyor"}</span><h3 style="margin-top:14px">OptiLine Pro Setup</h3><p class="muted">Sürüm ${safeText(release.version || "1.1.2")} · Windows 10 / 11</p>${setupAction}</article><article class="card"><span class="badge">Update</span><h3 style="margin-top:14px">Güncelleme paketi</h3><p class="muted">Mevcut kurulumlar için yayınlanan paket.</p>${updateAction}</article></div>`;
}

function releaseUrlReady(value) {
  return /^https:\/\//i.test(value || "") && !String(value).includes("USERNAME");
}

function supportView() {
  return `${sectionHead("Destek merkezi", "Kurulum, lisans ve program kullanımı için doğru kanala ulaşın.")}
    <div class="grid-3"><article class="card"><h3>Kullanım kılavuzu</h3><p class="muted">Modüllerin adım adım kullanımına ulaşın.</p></article><article class="card"><h3>Lisans desteği</h3><p class="muted">Makine kodu ve lisans aktivasyonu için merkezi talep oluşturun.</p><button class="button ghost" data-go="request-license" type="button">Talep oluştur</button></article><article class="card"><h3>Teknik destek</h3><p class="muted">Kurulum ve program davranışıyla ilgili destek alın.</p></article></div>`;
}

function loginView() {
  return `<div class="form-panel" style="max-width:560px;margin:0 auto"><span class="badge">Merkezi erişim</span><h2 style="margin-top:16px">OptiLine paneline giriş</h2><p class="muted">Müşteriler lisans anahtarı ve makine koduyla kendi kayıtlarına ulaşır. Yönetim ekranı yalnızca admin hesabına açıktır.</p><div class="actions" style="margin-top:22px"><button class="button primary" data-mode-target="customer" type="button">Müşteri girişi</button><button class="button ghost" data-mode-target="admin" type="button">Admin girişi</button></div></div>`;
}

function licenseRequestView() {
  return `${sectionHead("Lisans isteği", "Talebiniz doğrudan merkezi lisans sistemine kaydedilir.")}
    <form class="form-panel form-grid" id="uiLicenseRequestForm">
      <label>Ad / firma<input id="requestCustomerName" required autocomplete="organization"></label>
      <label>İletişim bilgisi<input id="requestContact" required placeholder="E-posta veya telefon"></label>
      <label style="grid-column:1/-1">Makine kodu<input id="requestMachineCode" required placeholder="Programda görünen makine kodu" autocomplete="off"></label>
      <fieldset style="grid-column:1/-1"><legend>İstenen modüller</legend><div class="check-grid">${["Proje", "Profil", "Stok Danışmanı", "Levha"].map(module => `<label><input type="checkbox" name="requestModule" value="${module}"> ${module}</label>`).join("")}</div></fieldset>
      <label style="grid-column:1/-1">Not<textarea id="requestNote" placeholder="İhtiyacınızı kısaca yazabilirsiniz"></textarea></label>
      <button class="button primary" type="submit">Lisans isteğini gönder</button>
    </form>`;
}

function customerDashboardView() {
  const active = getCustomerLicense();
  return `${sectionHead("Müşteri paneli", "Lisans, cihaz ve indirme işlemlerinin merkezi.", `<button class="button ghost" data-customer-logout type="button">Çıkış yap</button>`)}
    <div class="grid-2"><article class="card"><div class="section-head"><div><h3>${safeText(active?.label || "OptiLine Pro")}</h3><p>${safeText(active?.modules?.join(", ") || "Lisans bekleniyor")}</p></div><span class="badge ${active?.status === "Aktif" ? "good" : "warn"}">${safeText(active?.status || "Bekliyor")}</span></div><p class="muted">Bitiş: ${safeText(active?.expires_at || "Sınırsız")}</p><div class="bar"><span style="width:84%"></span></div></article><article class="card"><h3>Son sürüm</h3><h1>${safeText(publicRelease.version || "1.1.2")}</h1><button class="button ghost" data-go="customer-downloads" type="button">Güncellemeyi indir</button></article></div>`;
}

function licensesView(admin = false) {
  const rows = admin ? getLicenses() : (getCustomerLicense() ? [getCustomerLicense()] : []);
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
    <div class="license-create-heading"><small>YENİ LİSANS</small><h2>Lisans Oluştur</h2><p>Modül yetkilerini, cihaz sayısını ve lisans süresini tek kayıtta tanımlayın.</p></div>
    <div class="license-preview" aria-hidden="true"><div class="preview-top"><i></i><i></i><i></i><span></span></div><div class="preview-grid"><div class="preview-side"><b></b><b></b><b></b></div><div class="preview-main"><span></span><span></span><span></span><em></em><em></em><em></em></div></div></div>
    <form id="uiLicenseForm" class="license-create-form">
      <label>Etiket<input id="uiLicLabel" required placeholder="Örn: Optimization Pro v1"></label>
      <label>Makine kodu<input id="uiLicMachine" placeholder="İsteğe bağlı"></label>
      <label>Maksimum cihaz<input id="uiLicDevices" type="number" min="1" value="1"></label>
      <div class="license-expiry-row"><label>Bitiş tarihi<input id="uiLicExpiry" type="date"></label><label class="inline-check"><input id="uiLicUnlimited" type="checkbox">Sınırsız süre</label></div>
      <fieldset class="license-modules"><legend>Tam erişim verilecek modüller</legend><label><input name="uiModule" type="checkbox" value="Proje">Proje</label><label><input name="uiModule" type="checkbox" value="Profil">Profil</label><label><input name="uiModule" type="checkbox" value="Stok Danışmanı">Stok Danışmanı</label><label><input name="uiModule" type="checkbox" value="Levha">Levha</label></fieldset>
      <div class="license-rule-note"><strong>Seçilen modüller sınırsız açılır.</strong><span>2 proje, 50 profil, 200 danışman ve 50 levha sınırı yalnızca lisans girilmemiş deneme kullanımında uygulanır.</span></div>
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
  const devices = getCustomerLicense()?.devices || [];
  return `${sectionHead("Bağlı cihazlar", "Lisansınızla etkinleştirilen bilgisayarlar.")}
    <div class="grid-2">${devices.map(device => `<article class="card"><h3>${safeText(device.machine || "Makine")}</h3><p class="muted">Sürüm ${safeText(device.version || "-")} · Son kontrol ${safeText(device.last_check || "-")}</p><span class="badge ${licenseBadgeClass(device.status || "Aktif")}">${safeText(device.status || "Aktif")}</span></article>`).join("") || `<article class="card empty">Henüz bağlı cihaz yok.</article>`}</div>`;
}

function profileView() {
  const license = getCustomerLicense();
  return `${sectionHead("Hesabım", "Merkezi lisans hesabınıza ait bilgiler.")}
    <div class="grid-2"><article class="card"><h3>${safeText(license?.label || "OptiLine Pro müşterisi")}</h3><p class="muted">Lisans anahtarı</p><strong>${safeText(license?.key || "-")}</strong></article><article class="card"><h3>Yetkili modüller</h3><p>${safeText((license?.modules || []).join(", ") || "Modül tanımlanmamış")}</p><p class="muted">Cihaz hakkı: ${safeText(license?.max_devices || 0)}</p></article></div>`;
}

function customerTicketsView() {
  const tickets = portalState.tickets || [];
  return `${sectionHead("Destek talepleri", "Teknik, lisans ve kurulum taleplerinizi merkezi sisteme gönderin.")}
    <form class="form-panel form-grid" id="customerSupportForm">
      <label>Kategori<select id="supportCategory"><option>Teknik</option><option>Lisans</option><option>Kurulum</option><option>Güncelleme</option></select></label>
      <label>Konu<input id="supportSubject" required maxlength="160"></label>
      <label style="grid-column:1/-1">Açıklama<textarea id="supportMessage" required maxlength="5000"></textarea></label>
      <button class="button primary" type="submit">Talep oluştur</button>
    </form>
    <div class="table-wrap" style="margin-top:18px"><table><thead><tr><th>No</th><th>Konu</th><th>Kategori</th><th>Tarih</th><th>Durum</th></tr></thead><tbody>${tickets.map(ticket => `<tr><td>${safeText(ticket.id)}</td><td>${safeText(ticket.subject)}</td><td>${safeText(ticket.category)}</td><td>${safeText(ticket.created_at)}</td><td><span class="badge ${ticket.status === "Kapalı" ? "good" : "warn"}">${safeText(ticket.status)}</span></td></tr>`).join("") || `<tr><td colspan="5">Henüz destek talebi yok.</td></tr>`}</tbody></table></div>`;
}

function adminDashboardView() {
  const rows = getLicenses();
  const release = getRelease();
  const releaseReady = releaseUrlReady(release.setup_url) && releaseUrlReady(release.update_url);
  return `${sectionHead("Yönetim paneli", "OptiLine sisteminin genel durumu.", `<div class="actions"><button class="button primary" data-go="licenses" type="button">Lisans merkezini aç</button><button class="button ghost" data-admin-logout type="button">Çıkış yap</button></div>`)}
    <div class="grid-2"><article class="card"><h3>Son lisans işlemleri</h3>${rows.slice(0, 3).map(row => `<p>${safeText(row.label)} <span class="badge ${licenseBadgeClass(row.status)}">${safeText(row.status)}</span></p>`).join("") || `<p class="muted">Henüz lisans yok.</p>`}</article><article class="card"><h3>Sistem durumu</h3><p>Lisans kayıtları <span class="badge good">Cloudflare D1 merkezi</span></p><p>Güncelleme paketleri <span class="badge ${releaseReady ? "good" : "warn"}">${releaseReady ? "Bağlı" : "Bağlantı bekliyor"}</span></p><p>API <span class="badge good">Çevrimiçi</span></p></article></div>`;
}

function customersView() {
  const customers = portalState.customers || [];
  return `${sectionHead("Müşteriler", "Merkezi veritabanındaki müşteri ve firma kayıtları.")}<div class="grid-2">${customers.map(customer => `<article class="card"><h3>${safeText(customer.name || customer.company || "Müşteri")}</h3><p class="muted">${safeText(customer.company || "Firma bilgisi yok")}</p><p>${getLicenses().filter(item => item.customer_id === customer.id || item.label === customer.name).length} lisans kaydı</p></article>`).join("") || `<article class="card empty">Henüz müşteri kaydı yok.</article>`}</div>`;
}

function adminDevicesView() {
  const devices = portalState.devices || [];
  return `${sectionHead("Cihazlar", "Tüm lisanslara bağlı bilgisayarlar ve son bağlantı bilgileri.")}
    <div class="table-wrap"><table><thead><tr><th>Müşteri</th><th>Makine kodu</th><th>Aktivasyon</th><th>Son kontrol</th><th>Sürüm</th><th>Durum</th></tr></thead><tbody>${devices.map(device => `<tr><td>${safeText(device.label)}</td><td>${safeText(device.machine)}</td><td>${safeText(device.activated_at)}</td><td>${safeText(device.last_check || "-")}</td><td>${safeText(device.version || "-")}</td><td><span class="badge ${licenseBadgeClass(device.status)}">${safeText(device.status)}</span></td></tr>`).join("") || `<tr><td colspan="6">Bağlı cihaz yok.</td></tr>`}</tbody></table></div>`;
}

function adminSupportView() {
  const tickets = portalState.tickets || [];
  return `${sectionHead("Destek talepleri", "Müşterilerin merkezi sisteme gönderdiği talepler.")}
    <div class="grid-2">${tickets.map(ticket => `<article class="card"><div class="section-head"><div><h3>${safeText(ticket.subject)}</h3><p>${safeText(ticket.label)} · ${safeText(ticket.category)} · ${safeText(ticket.created_at)}</p></div><span class="badge ${ticket.status === "Kapalı" ? "good" : "warn"}">${safeText(ticket.status)}</span></div><p>${safeText(ticket.message)}</p><div class="actions"><button class="button ghost" data-support-action="open" data-ticket-id="${safeText(ticket.id)}" type="button">Açık</button><button class="button ghost" data-support-action="progress" data-ticket-id="${safeText(ticket.id)}" type="button">İşlemde</button><button class="button primary" data-support-action="close" data-ticket-id="${safeText(ticket.id)}" type="button">Kapat</button></div></article>`).join("") || `<article class="card empty">Destek talebi yok.</article>`}</div>`;
}

function auditLogView() {
  const rows = portalState.audit || [];
  return `${sectionHead("İşlem kayıtları", "Lisans, cihaz, destek ve sürüm işlemlerinin denetim izi.")}
    <div class="table-wrap"><table><thead><tr><th>Tarih</th><th>İşlemi yapan</th><th>İşlem</th><th>Kayıt türü</th><th>Kayıt</th></tr></thead><tbody>${rows.map(row => `<tr><td>${safeText(row.created_at)}</td><td>${safeText(row.actor)}</td><td>${safeText(row.action)}</td><td>${safeText(row.entity_type)}</td><td>${safeText(row.entity_id || "-")}</td></tr>`).join("") || `<tr><td colspan="5">İşlem kaydı yok.</td></tr>`}</tbody></table></div>`;
}

function versionsView() {
  const release = getRelease();
  const ready = releaseUrlReady(release.setup_url) && releaseUrlReady(release.update_url);
  return `${sectionHead("Sürüm yönetimi", "Yayındaki kurulum ve güncelleme kaydı.", `<button class="button primary" data-go="publish-update" type="button">Yeni sürüm</button>`)}<article class="card"><div class="section-head"><div><h3>OptiLine Pro ${safeText(release.version)}</h3><p>${safeText(release.date || "Tarih yok")}</p></div><span class="badge ${ready ? "good" : "warn"}">${ready ? "Yayına hazır" : "Dosya bağlantısı eksik"}</span></div><p class="muted">${safeText(release.notes || "Sürüm notu yok.")}</p></article>`;
}

function publishUpdateView() {
  const release = getRelease();
  return `${sectionHead("Güncelleme yayınla", "Sürüm numarası, paket bağlantıları ve sürüm notunu hazırlayın.")}
    <form class="form-panel form-grid" id="uiReleaseForm"><label>Sürüm numarası<input id="uiRelVersion" required value="${safeText(release.version || "1.1.2")}"></label><label>Yayın tarihi<input id="uiRelDate" type="date" value="${safeText(release.date || todayIso())}"></label><label style="grid-column:1/-1">Setup bağlantısı<input id="uiRelSetup" value="${safeText(release.setup_url || "")}"></label><label style="grid-column:1/-1">Update bağlantısı<input id="uiRelUpdate" value="${safeText(release.update_url || "")}"></label><label style="grid-column:1/-1">SHA-256<input id="uiRelSha" value="${safeText(release.sha256 || "")}"></label><label style="grid-column:1/-1">Sürüm notları<textarea id="uiRelNotes">${safeText(release.notes || "")}</textarea></label><button class="button primary" type="submit">Sürüm kaydını hazırla</button></form>`;
}

function genericView(title, text) {
  return `${sectionHead(title, text)}<article class="card empty"><div><h3>${title}</h3><p>${text}</p></div></article>`;
}

function adminLoginView() {
  return `<div class="form-panel" style="max-width:520px;margin:40px auto"><span class="badge">Güvenli yönetim</span><h2 style="margin-top:16px">Admin girişi</h2><p class="muted">Lisans, müşteri ve sürüm kayıtları merkezi Cloudflare veritabanından yönetilir.</p><form class="form-grid" style="grid-template-columns:1fr;margin-top:20px" id="adminLoginForm"><label>E-posta<input id="adminEmail" type="email" required value="admin@optilinepro.com" autocomplete="username"></label><label>Şifre<input id="adminPassword" type="password" required autocomplete="current-password"></label><button class="button primary" type="submit">Yönetim paneline gir</button></form></div>`;
}

function customerLoginView() {
  return `<div class="form-panel" style="max-width:520px;margin:40px auto"><span class="badge">Müşteri erişimi</span><h2 style="margin-top:16px">Lisansınıza bağlanın</h2><p class="muted">Lisans anahtarı ve programdaki makine koduyla yalnızca kendi kaydınıza erişirsiniz.</p><form class="form-grid" style="grid-template-columns:1fr;margin-top:20px" id="customerLoginForm"><label>Lisans anahtarı<input id="customerLicenseKey" required placeholder="OPL-XXXX-XXXX-XXXX-XXXX" autocomplete="off"></label><label>Makine kodu<input id="customerMachineCode" required placeholder="Programdaki makine kodu" autocomplete="off"></label><button class="button primary" type="submit">Müşteri paneline gir</button></form></div>`;
}

function currentView() {
  if (uiMode === "admin" && !portalState.adminAuthenticated) return adminLoginView();
  if (uiMode === "customer" && !portalState.customerAuthenticated) return customerLoginView();
  const views = {
    home: homeView,
    features: featuresView,
    product: productView,
    pricing: pricingView,
    updates: updatesView,
    downloads: () => downloadsView(false),
    support: supportView,
    "request-license": licenseRequestView,
    login: loginView,
    "customer-dashboard": customerDashboardView,
    "my-licenses": () => licensesView(false),
    devices: devicesView,
    "customer-downloads": () => downloadsView(true),
    tickets: customerTicketsView,
    profile: profileView,
    "admin-dashboard": adminDashboardView,
    licenses: () => licensesView(true),
    customers: customersView,
    "admin-devices": adminDevicesView,
    "admin-support": adminSupportView,
    versions: versionsView,
    "publish-update": publishUpdateView,
    "audit-logs": auditLogView,
  };
  return (views[uiCurrent] || (() => genericView("Sayfa hazırlanıyor", "Bu bölüm henüz hazırlanmadı.")))();
}

function renderScreen() {
  uiScreen.innerHTML = currentView();
}

async function changeMode(mode) {
  uiMode = mode;
  uiCurrent = uiPages[mode][0][0];
  history.replaceState(null, "", `#${uiMode}/${uiCurrent}`);
  document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
  uiScreen.innerHTML = `<article class="card empty">Merkezi sistem kontrol ediliyor...</article>`;
  try {
    if (mode === "admin") {
      const authenticated = await checkAdminSession();
      if (authenticated) await loadAdminSnapshot();
    }
    if (mode === "customer") await loadCustomerSnapshot();
  } catch (error) {
    showUiToast(error.message);
  }
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

document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
  changeMode(button.dataset.mode);
}));

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
    return;
  }
  const supportButton = event.target.closest("[data-support-action]");
  if (supportButton) {
    runSupportTicketActionOnApi(supportButton.dataset.ticketId, supportButton.dataset.supportAction)
      .then(() => { renderScreen(); showUiToast("Destek talebi güncellendi."); })
      .catch(error => showUiToast(error.message));
    return;
  }
  if (event.target.closest("[data-admin-logout]")) {
    logoutAdmin().then(() => changeMode("admin")).catch(error => showUiToast(error.message));
    return;
  }
  if (event.target.closest("[data-customer-logout]")) {
    logoutCustomer().then(() => changeMode("customer")).catch(error => showUiToast(error.message));
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

async function handleUiLicenseAction(action, key) {
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
  }
  try {
    if (action === "delete") {
      await deleteLicenseOnApi(row.id);
      showUiToast("Lisans merkezi sistemden kalıcı olarak silindi.");
    } else {
      const updated = await runLicenseActionOnApi(row.id, action);
      if (action === "renew" && updated?.key) navigator.clipboard?.writeText(updated.key);
      const messages = {
        activate: "Lisans aktif edildi.", pause: "Lisans askıya alındı.", cancel: "Lisans iptal edildi.",
        renew: "Yeni lisans anahtarı üretildi ve kopyalandı.", "reset-device": "Bağlı cihazlar sıfırlandı."
      };
      showUiToast(messages[action] || "Lisans güncellendi.");
    }
    renderMetrics();
    renderScreen();
  } catch (error) {
    if (error.status === 401) portalState.adminAuthenticated = false;
    showUiToast(error.message);
    renderScreen();
  }
}

uiScreen.addEventListener("submit", async event => {
  event.preventDefault();
  if (event.target.id === "adminLoginForm") {
    try {
      await loginAdmin(document.querySelector("#adminEmail").value.trim(), document.querySelector("#adminPassword").value);
      uiCurrent = "admin-dashboard";
      renderMetrics(); renderNav(); renderScreen(); showUiToast("Merkezi yönetim paneli açıldı.");
    } catch (error) {
      showUiToast(error.message);
    }
    return;
  }
  if (event.target.id === "customerLoginForm") {
    try {
      await loginCustomer(document.querySelector("#customerLicenseKey").value.trim(), document.querySelector("#customerMachineCode").value.trim());
      uiCurrent = "customer-dashboard";
      renderMetrics(); renderNav(); renderScreen(); showUiToast("Müşteri paneli açıldı.");
    } catch (error) {
      showUiToast(error.message);
    }
    return;
  }
  if (event.target.id === "uiLicenseRequestForm") {
    const modules = [...event.target.querySelectorAll("input[name='requestModule']:checked")].map(input => input.value);
    if (!modules.length) {
      showUiToast("En az bir modül seçin.");
      return;
    }
    try {
      const result = await createLicenseRequestOnApi({
        customer_name: document.querySelector("#requestCustomerName").value.trim(),
        contact: document.querySelector("#requestContact").value.trim(),
        machine_code: document.querySelector("#requestMachineCode").value.trim(),
        modules,
        note: document.querySelector("#requestNote").value.trim()
      });
      event.target.reset();
      showUiToast(`Lisans isteği gönderildi. İstek no: ${result.request.id}`);
    } catch (error) {
      showUiToast(error.message);
    }
    return;
  }
  if (event.target.id === "customerSupportForm") {
    try {
      const result = await createSupportTicketOnApi({
        category: document.querySelector("#supportCategory").value,
        subject: document.querySelector("#supportSubject").value.trim(),
        message: document.querySelector("#supportMessage").value.trim()
      });
      event.target.reset();
      renderScreen();
      showUiToast(`Destek talebi oluşturuldu: ${result.id}`);
    } catch (error) {
      showUiToast(error.message);
    }
    return;
  }
  if (event.target.id === "uiLicenseForm") {
    const modules = [...event.target.querySelectorAll("input[name='uiModule']:checked")].map(input => input.value);
    if (!modules.length) {
      showUiToast("En az bir modül seçin.");
      return;
    }
    const license = {
      label: document.querySelector("#uiLicLabel").value.trim(), machine: document.querySelector("#uiLicMachine").value.trim(),
      version: getRelease().version,
      max_devices: Number(document.querySelector("#uiLicDevices").value || 1), expires_at: document.querySelector("#uiLicUnlimited").checked ? null : (document.querySelector("#uiLicExpiry").value || null), modules,
      note: document.querySelector("#uiLicNote").value.trim()
    };
    try {
      const created = await createLicenseOnApi(license);
      navigator.clipboard?.writeText(created.key);
      event.target.reset();
      document.querySelector("#uiLicExpiry").disabled = false;
      renderMetrics(); renderScreen(); showUiToast("Lisans merkezi sistemde oluşturuldu ve anahtar kopyalandı.");
    } catch (error) {
      showUiToast(error.message);
    }
    return;
  }
  if (event.target.id === "uiReleaseForm") {
    const release = {
      version: document.querySelector("#uiRelVersion").value.trim(), date: document.querySelector("#uiRelDate").value,
      setup_url: document.querySelector("#uiRelSetup").value.trim(), update_url: document.querySelector("#uiRelUpdate").value.trim(),
      sha256: document.querySelector("#uiRelSha").value.trim(), required: false, notes: document.querySelector("#uiRelNotes").value.trim()
    };
    try {
      publicRelease = await saveReleaseOnApi(release);
      renderMetrics(); uiCurrent = "versions"; renderNav(); renderScreen(); showUiToast("Sürüm merkezi sistemde yayınlandı.");
    } catch (error) {
      showUiToast(error.message);
    }
  }
});

async function loadPublicRelease() {
  try {
    publicRelease = await loadPublicReleaseFromApi();
  } catch (error) {
    showUiToast(`Sürüm bilgisi alınamadı: ${error.message}`);
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
async function bootstrapPortal() {
  await loadPublicRelease();
  try {
    if (uiMode === "admin" && await checkAdminSession()) await loadAdminSnapshot();
    if (uiMode === "customer") await loadCustomerSnapshot();
  } catch (error) {
    showUiToast(error.message);
  }
  renderMetrics();
  renderNav();
  renderScreen();
}

bootstrapPortal();
