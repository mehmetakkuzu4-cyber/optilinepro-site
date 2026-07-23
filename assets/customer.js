let optiDemoState = { customers: [], licenses: [], requests: [], notifications: [], tickets: [], logs: [], release: {} };

function escapePrototypeText(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function deviceActionLabel(action, machine = "") {
  if (action === "reset") return "Tüm cihazları sıfırla";
  if (action === "remove") return machine ? `${machine} cihazını kaldır` : "Seçili cihazı kaldır";
  return action || "Mevcut cihazlar korunur";
}

function showPrototypeToast(message, type = "success") {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `prototype-toast is-visible is-${type}`;
  clearTimeout(showPrototypeToast.timer);
  showPrototypeToast.timer = setTimeout(() => { toast.className = "prototype-toast"; }, 3400);
}

function adminStatusClass(status) {
  if (["Aktif", "Doğrulandı", "Yayında", "Başarılı", "Onaylandı", "Sağlıklı"].includes(status)) return "is-good";
  if (["Askıda", "Bekliyor", "İnceleniyor", "Yeni", "Ek bilgi bekleniyor", "Ek Bilgi Bekleniyor"].includes(status)) return "is-warning";
  if (["İptal", "Pasif", "Reddedildi", "Bağlantısız"].includes(status)) return "is-danger";
  return "is-neutral";
}

function requestIsOpen(request) {
  return ["Yeni", "İnceleniyor", "Ek bilgi bekleniyor", "Ek Bilgi Bekleniyor"].includes(request.status);
}

function maskAdminLicenseKey(key) {
  const parts = String(key || "").split("-");
  return parts.length < 5 ? `${String(key || "").slice(0, 8)}••••` : `${parts[0]}-${parts[1]}-••••-••••-${parts[4]}`;
}

function licenseHealth(license) {
  if (license.status === "Askıda") return "Askıda";
  if (license.status === "İptal") return "İptal";
  if (!license.devices.length) return "Bağlantısız";
  if (license.devices.length >= license.maxDevices) return "Cihaz sınırı dolu";
  return "Sağlıklı";
}

function currentPrototypeCustomer() {
  return optiDemoState.customers.find(customer => customer.id === optiDemoState.currentCustomerId) || optiDemoState.customers[0];
}

function prototypeCustomerLicenses(customerId) {
  return optiDemoState.licenses.filter(license => license.customerId === customerId);
}

async function reloadCustomerState() {
  const snapshot = await OptiApi.customerSnapshot();
  optiDemoState = OptiApi.customerState(snapshot);
  return snapshot;
}

function openDownloadScreen() {
  location.href = "download.html";
}

const customerDashboard = document.querySelector("[data-customer-screen]");
const customerNavButtons = customerDashboard.querySelectorAll("[data-customer-section]");
const customerOverview = customerDashboard.querySelector("[data-customer-overview]");
const customerOverviewContent = customerDashboard.querySelector("[data-customer-overview-content]");
const customerModuleView = customerDashboard.querySelector("[data-customer-module-view]");
const customerModuleContent = customerDashboard.querySelector("[data-customer-module-content]");
let currentCustomerSection = "overview";
const revealedCustomerLicenseKeys = new Set();

const customerSectionMeta = {
  licenses: ["Lisanslarım", "Lisans ayrıntılarınızı görün ve kontrollü değişiklik talepleri oluşturun."],
  requests: ["Taleplerim", "Yeni lisans, değişiklik, süre ve cihaz taleplerinizin karar sürecini takip edin."],
  devices: ["Cihazlarım", "Lisanslarınıza bağlı bilgisayarları görün ve cihaz işlemi talep edin."],
  downloads: ["Dosyalar", "Güncel setup ve güncelleme paketlerine ulaşın."],
  tickets: ["Destek talepleri", "Teknik, lisans ve kurulum taleplerinizi takip edin."],
  profile: ["Hesabım", "Firma, iletişim ve hesap durumunuzu görüntüleyin."],
};

function customerStatusClass(status) {
  return adminStatusClass(status);
}

function customerRequests() {
  const customer = currentPrototypeCustomer();
  return optiDemoState.requests.filter((request) => request.customerId === customer.id);
}

function customerLicenses() {
  const customer = currentPrototypeCustomer();
  return prototypeCustomerLicenses(customer.id);
}

function customerNotifications() {
  const customer = currentPrototypeCustomer();
  return optiDemoState.notifications.filter((notification) => notification.customerId === customer.id);
}

function customerInitials(customer) {
  return customer.company.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("tr");
}

function customerNotificationMarkup() {
  const notifications = customerNotifications().slice(0, 3);
  if (!notifications.length) return "";
  return `<section class="customer-notifications"><div><i data-lucide="bell-ring"></i><span><b>${notifications.length} bildirim</b>Hesabınızla ilgili son gelişmeler</span></div>${notifications.map((notification) => `<article><span>${escapePrototypeText(notification.title)}</span><p>${escapePrototypeText(notification.detail)}</p><small>${escapePrototypeText(notification.date)}</small></article>`).join("")}</section>`;
}

function customerOverviewMarkup() {
  const customer = currentPrototypeCustomer();
  const licenses = customerLicenses();
  const requests = customerRequests();
  const openRequests = requests.filter(requestIsOpen);
  const modules = [...new Set(licenses.flatMap((license) => license.modules))];
  const deviceCount = licenses.reduce((sum, license) => sum + license.devices.length, 0);
  const deviceLimit = licenses.reduce((sum, license) => sum + license.maxDevices, 0);
  const activeLicense = licenses.find((license) => license.status === "Aktif") || licenses[0];
  if (!activeLicense) {
    const request = requests[requests.length - 1];
    const candidate = customer.status === "Aday";
    return `${customerNotificationMarkup()}<section class="customer-candidate-banner"><div><i data-lucide="user-round-check"></i><span><b>${candidate ? "Aday müşteri hesabınız hazır" : "Müşteri hesabınız aktif"}</b>${candidate ? "Lisansınız onaylandığında aynı hesap aktif müşteri hesabına dönüşecek." : "Şu anda bu hesaba bağlı aktif lisans bulunmuyor."}</span></div><mark>${candidate ? "Aday" : "Lisans yok"}</mark></section><section class="customer-metrics"><div><i data-lucide="clipboard-list"></i><span>Açık talep<strong>${openRequests.length}</strong><small>${request ? escapePrototypeText(request.id) : "Henüz talep yok"}</small></span></div><div><i data-lucide="badge-check"></i><span>Aktif lisans<strong>0</strong><small>${candidate ? "Yönetici onayı bekleniyor" : "Yeni lisans talebi oluşturabilirsiniz"}</small></span></div><div><i data-lucide="boxes"></i><span>İstenen modül<strong>${request?.requested?.modules?.length || 0}</strong><small>${escapePrototypeText(request?.requested?.modules?.join(", ") || "-")}</small></span></div><div><i data-lucide="shield-check"></i><span>Panel hesabı<strong>Hazır</strong><small>Bilgileriniz kaydedildi</small></span></div></section>${request ? `<section class="customer-pending-request"><header><div><p>Son lisans talebi</p><h2>${escapePrototypeText(request.id)}</h2></div><span class="customer-request-status ${customerStatusClass(request.status)}">${escapePrototypeText(request.status)}</span></header><div class="customer-request-progress"><span class="is-done">Talep alındı</span><span class="${request.status === "İnceleniyor" ? "is-active" : ""}">İnceleniyor</span><span>Yönetici kararı</span><span>Lisans hazır</span></div><dl><div><dt>Modüller</dt><dd>${escapePrototypeText(request.requested.modules.join(", "))}</dd></div><div><dt>Cihaz</dt><dd>${request.requested.maxDevices}</dd></div><div><dt>Süre</dt><dd>${escapePrototypeText(request.requested.expires)}</dd></div></dl><button type="button" data-customer-jump="requests">Talebin ayrıntısını aç</button></section>` : ""}`;
  }
  return `${customerNotificationMarkup()}<section class="customer-metrics"><div><i data-lucide="badge-check"></i><span>Aktif lisans<strong>${licenses.filter((license) => license.status === "Aktif").length}</strong><small>${escapePrototypeText(activeLicense.label)}</small></span></div><div><i data-lucide="boxes"></i><span>Aktif modül<strong>${modules.length}</strong><small>${escapePrototypeText(modules.join(", "))}</small></span></div><div><i data-lucide="monitor-smartphone"></i><span>Bağlı cihaz<strong>${deviceCount} / ${deviceLimit}</strong><small>${deviceCount ? "Cihaz bağlantısı mevcut" : "Cihaz bağlantısı bekleniyor"}</small></span></div><div><i data-lucide="clipboard-list"></i><span>Açık talep<strong>${openRequests.length}</strong><small>${openRequests.length ? "Yönetici incelemesi sürüyor" : "Bekleyen işlem yok"}</small></span></div></section><section class="customer-grid"><article class="customer-license-card"><div class="customer-section-head"><div><p>Aktif paket</p><h2>${escapePrototypeText(activeLicense.label)}</h2></div><mark>${escapePrototypeText(activeLicense.status)}</mark></div><dl><div><dt>Lisans anahtarı</dt><dd>${escapePrototypeText(maskAdminLicenseKey(activeLicense.key))}</dd></div><div><dt>Lisans sağlığı</dt><dd>${escapePrototypeText(licenseHealth(activeLicense))}</dd></div><div><dt>Bitiş tarihi</dt><dd>${escapePrototypeText(activeLicense.expires)}</dd></div><div><dt>Cihaz hakkı</dt><dd>${activeLicense.devices.length} / ${activeLicense.maxDevices}</dd></div></dl><div class="customer-module-list">${["Proje", "Profil", "Stok Danışmanı", "Levha"].map((module) => activeLicense.modules.includes(module) ? `<span><i data-lucide="check"></i>${escapePrototypeText(module)}</span>` : `<span class="is-locked"><i data-lucide="lock"></i>${escapePrototypeText(module)}</span>`).join("")}</div><div class="customer-license-quick-actions"><button type="button" data-customer-license-action="change" data-license-id="${activeLicense.id}">Değişiklik talebi</button><button type="button" data-customer-license-action="renew" data-license-id="${activeLicense.id}">Süre uzatma</button><button type="button" data-customer-license-action="device" data-license-id="${activeLicense.id}">Cihaz işlemi</button></div></article><aside class="customer-update-card"><div class="customer-section-head"><div><p>Windows uygulaması</p><h2>Güncelleme hazır</h2></div><i data-lucide="package-check"></i></div><strong>OptiLine Pro ${escapePrototypeText(optiDemoState.release?.version || "-")}</strong><span>Doğrulanmış kurulum ve güncelleme paketi.</span><button type="button" data-customer-download>Dosyaları aç</button><small><i data-lucide="shield-check"></i>SHA-256 doğrulaması mevcut</small></aside></section>${activeLicense.customerMessage ? `<section class="customer-license-message"><i data-lucide="message-square-text"></i><span><b>Yönetici mesajı</b>${escapePrototypeText(activeLicense.customerMessage)}</span></section>` : ""}`;
}

function customerLicenseCardMarkup(license) {
  const keyVisible = revealedCustomerLicenseKeys.has(license.id);
  const openRequest = customerRequests().find((request) => request.licenseId === license.id && requestIsOpen(request));
  return `<article class="customer-license-detail" data-customer-license-id="${license.id}"><header><div><span>${escapePrototypeText(keyVisible ? license.key : maskAdminLicenseKey(license.key))}</span><h2>${escapePrototypeText(license.label)}</h2><p>${escapePrototypeText(license.customer)}</p></div><div><span class="customer-request-status ${customerStatusClass(license.status)}">${escapePrototypeText(license.status)}</span><span class="customer-request-status ${customerStatusClass(licenseHealth(license))}">${escapePrototypeText(licenseHealth(license))}</span></div></header><div class="customer-license-key-actions"><button type="button" data-customer-key-action="reveal"><i data-lucide="${keyVisible ? "eye-off" : "eye"}"></i>${keyVisible ? "Gizle" : "Anahtarı göster"}</button><button type="button" data-customer-key-action="copy"><i data-lucide="copy"></i>Kopyala</button></div><dl><div><dt>Modüller</dt><dd>${escapePrototypeText(license.modules.join(", "))}</dd></div><div><dt>Cihaz hakkı</dt><dd>${license.devices.length} / ${license.maxDevices}</dd></div><div><dt>Bitiş</dt><dd>${escapePrototypeText(license.expires)}</dd></div><div><dt>Son kontrol</dt><dd>${escapePrototypeText(license.lastCheck)}</dd></div></dl>${license.customerMessage ? `<p class="customer-license-public-note"><b>Yönetici mesajı</b>${escapePrototypeText(license.customerMessage)}</p>` : ""}<footer><button class="is-primary" type="button" data-customer-license-action="change">Değişiklik talebi</button><button type="button" data-customer-license-action="renew">Süre uzatma</button><button type="button" data-customer-license-action="device">Cihaz işlemleri</button></footer>${openRequest ? `<div class="customer-open-request"><i data-lucide="clock-3"></i><span><b>${escapePrototypeText(openRequest.type)} talebiniz açık</b>${escapePrototypeText(openRequest.id)} · ${escapePrototypeText(openRequest.status)}</span></div>` : ""}</article>`;
}

function customerLicensesMarkup() {
  const licenses = customerLicenses();
  return licenses.length ? `<div class="customer-license-detail-list">${licenses.map(customerLicenseCardMarkup).join("")}</div>` : '<div class="customer-empty-state"><i data-lucide="key-round"></i><h2>Henüz aktif lisansınız yok</h2><p>Gönderdiğiniz talep onaylandığında lisansınız burada görünecek.</p><button type="button" data-customer-jump="requests">Talebimi takip et</button></div>';
}

function customerRequestComparisonMarkup(request) {
  const current = request.current || {};
  const requested = request.requested || {};
  const rows = [];
  const add = (label, before, after) => rows.push(`<div><b>${escapePrototypeText(label)}</b><span>${escapePrototypeText(before || "-")}</span><i data-lucide="arrow-right"></i><strong>${escapePrototypeText(after || "-")}</strong></div>`);
  if (request.typeKey === "new") add("Hesap", "Aday müşteri", request.status === "Onaylandı" ? "Aktif müşteri" : "Yönetici onayı");
  if (requested.modules) add("Modüller", (current.modules || []).join(", ") || "Lisans yok", requested.modules.join(", "));
  if (requested.maxDevices) add("Cihaz sınırı", current.maxDevices ? `${current.maxDevices} cihaz` : "Lisans yok", `${requested.maxDevices} cihaz`);
  if (requested.expires) add("Bitiş", current.expires || "Lisans yok", requested.expires);
  if (requested.action) add("Cihaz işlemi", current.action || "Mevcut cihazlar", deviceActionLabel(requested.action, requested.machine));
  return rows.join("");
}

function customerRequestsMarkup() {
  const requests = [...customerRequests()].reverse();
  if (!requests.length) return '<div class="customer-empty-state"><i data-lucide="clipboard-list"></i><h2>Henüz talebiniz yok</h2><p>Yeni lisans veya mevcut lisans değişikliği talebi oluşturabilirsiniz.</p></div>';
  return `<div class="customer-request-list">${requests.map((request) => `<article data-customer-request-id="${request.id}"><header><div><span>${escapePrototypeText(request.id)} · ${escapePrototypeText(request.type)}</span><h2>${escapePrototypeText(request.company)}</h2></div><span class="customer-request-status ${customerStatusClass(request.status)}">${escapePrototypeText(request.status)}</span></header><div class="customer-request-progress"><span class="is-done">Talep alındı</span><span class="${requestIsOpen(request) ? "is-active" : "is-done"}">İncelendi</span><span class="${["Onaylandı", "Reddedildi"].includes(request.status) ? "is-done" : ""}">Karar</span><span class="${request.status === "Onaylandı" ? "is-done" : ""}">Uygulandı</span></div><div class="customer-request-comparison">${customerRequestComparisonMarkup(request)}</div>${request.reason ? `<p><b>Talep açıklamanız</b>${escapePrototypeText(request.reason)}</p>` : ""}${request.adminMessage ? `<p class="is-admin-message"><b>Yönetici mesajı</b>${escapePrototypeText(request.adminMessage)}</p>` : ""}${request.status === "Ek bilgi bekleniyor" ? '<button class="customer-request-reply" type="button" data-customer-request-reply>İstenen bilgiyi gönder</button>' : ""}</article>`).join("")}</div>`;
}

function customerDevicesMarkup() {
  const licenses = customerLicenses();
  const rows = licenses.flatMap((license) => license.devices.map((device) => `<tr><td><strong>${escapePrototypeText(device.name || "Tanımsız cihaz")}</strong><small>${escapePrototypeText(device.machine)}</small></td><td>${escapePrototypeText(license.label)}</td><td>${escapePrototypeText(device.system || "Windows")}</td><td>${escapePrototypeText(device.version)}</td><td>${escapePrototypeText(device.lastCheck)}</td><td><mark>${escapePrototypeText(device.status)}</mark></td><td><button type="button" data-customer-device-request="${license.id}" data-machine="${escapePrototypeText(device.machine)}">İşlem iste</button></td></tr>`)).join("");
  return `<div class="customer-device-table"><table class="customer-content-table"><thead><tr><th>Cihaz</th><th>Lisans</th><th>Sistem</th><th>Sürüm</th><th>Son kontrol</th><th>Durum</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7">Henüz bağlı cihaz yok.</td></tr>'}</tbody></table></div>${licenses.length ? `<button class="customer-new-device-request" type="button" data-customer-license-action="device" data-license-id="${licenses[0].id}"><i data-lucide="monitor-cog"></i>Cihaz işlemi talep et</button>` : ""}`;
}

function customerTicketsMarkup() {
  const customer = currentPrototypeCustomer();
  const rows = optiDemoState.tickets.filter((ticket) => !ticket.customerId || ticket.customerId === customer.id).map((ticket) => `<tr><td>${escapePrototypeText(ticket.id)}</td><td>${escapePrototypeText(ticket.subject)}</td><td>${escapePrototypeText(ticket.category)}</td><td>${escapePrototypeText(ticket.date)}</td><td><mark>${escapePrototypeText(ticket.status)}</mark></td></tr>`).join("") || '<tr><td colspan="5">Henüz destek talebi yok.</td></tr>';
  return `<form class="customer-support-form" data-customer-support-form><label>Kategori<select name="category"><option>Teknik</option><option>Lisans</option><option>Kurulum</option><option>Güncelleme</option></select></label><label>Konu<input name="subject" required placeholder="Kısa konu"></label><label class="is-wide">Açıklama<textarea name="message" required placeholder="Sorunu veya talebi açıklayın"></textarea></label><button type="submit">Talep oluştur</button></form><table class="customer-content-table"><thead><tr><th>No</th><th>Konu</th><th>Kategori</th><th>Tarih</th><th>Durum</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function customerProfileMarkup() {
  const customer = currentPrototypeCustomer();
  return `<div class="customer-profile-grid"><div class="customer-profile-card"><div><span>${escapePrototypeText(customerInitials(customer))}</span><section><h2>${escapePrototypeText(customer.company)}</h2><p>${escapePrototypeText(customer.accountType)} · ${escapePrototypeText(customer.status)}</p></section></div><dl><div><dt>Yetkili</dt><dd>${escapePrototypeText(customer.contact)}</dd></div><div><dt>E-posta</dt><dd>${escapePrototypeText(customer.email)}</dd></div><div><dt>Telefon</dt><dd>${escapePrototypeText(customer.phone || "-")}</dd></div><div><dt>Hesap oluşturma</dt><dd>${escapePrototypeText(customer.createdAt)}</dd></div></dl></div><form class="customer-password-card" data-customer-password-form><header><i data-lucide="lock-keyhole"></i><span><b>Şifre değiştir</b><small>Hesabınıza giriş yaptıktan sonra şifrenizi buradan yenileyebilirsiniz.</small></span></header><label>Mevcut şifre<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>Yeni şifre<input name="newPassword" type="password" autocomplete="new-password" minlength="8" required></label><label>Yeni şifre tekrar<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></label><p data-customer-password-message></p><button type="submit">Şifreyi Güncelle</button></form></div>`;
}

async function submitCustomerPasswordChange(form) {
  const formData = new FormData(form);
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const message = form.querySelector("[data-customer-password-message]");
  const submit = form.querySelector('button[type="submit"]');

  if (newPassword !== confirmPassword) {
    message.textContent = "Yeni şifre tekrarı eşleşmiyor.";
    message.dataset.tone = "warning";
    return;
  }

  submit.disabled = true;
  message.textContent = "Şifreniz güvenli servis üzerinden güncelleniyor...";
  message.dataset.tone = "info";
  try {
    await OptiApi.changeCustomerPassword({ currentPassword, newPassword, confirmPassword });
    form.reset();
    message.textContent = "Şifreniz güncellendi. Bu cihazdaki oturum açık kaldı, diğer oturumlar kapatıldı.";
    message.dataset.tone = "success";
    showPrototypeToast("Şifre güncellendi.", "success");
  } catch (error) {
    message.textContent = error.message || "Şifre değiştirilemedi.";
    message.dataset.tone = "warning";
  } finally {
    submit.disabled = false;
  }
}

function customerSectionMarkup(section) {
  if (section === "licenses") return customerLicensesMarkup();
  if (section === "requests") return customerRequestsMarkup();
  if (section === "devices") return customerDevicesMarkup();
  if (section === "downloads") return `<div class="customer-content-card"><h2>OptiLine Pro ${escapePrototypeText(optiDemoState.release?.version || "-")}</h2><p>Doğrulanmış setup ve güncelleme paketi kullanıma hazır.</p><button class="customer-primary-command" type="button" data-customer-download>İndirme merkezini aç</button></div>`;
  if (section === "tickets") return customerTicketsMarkup();
  return customerProfileMarkup();
}

function customerRequestFormMarkup(type, license, machine = "") {
  const typeMeta = { change: ["Lisans değişikliği", "Modül, cihaz limiti veya süre değerini değiştirme talebi"], renew: ["Süre uzatma", "Lisans kullanım süresini uzatma talebi"], device: ["Cihaz işlemi", "Bağlı cihazı kaldırma veya tüm cihazları sıfırlama talebi"] };
  const [title, description] = typeMeta[type];
  const allModules = ["Proje", "Profil", "Stok Danışmanı", "Levha"];
  const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  return `<div class="customer-request-form-shell"><header><div><p>Kontrollü lisans işlemi</p><h2>${title}</h2><span>${description}</span></div><button type="button" data-customer-request-close aria-label="Formu kapat"><i data-lucide="x"></i></button></header><div class="customer-request-current"><b>Mevcut lisans</b><span>${escapePrototypeText(license.label)} · ${escapePrototypeText(license.modules.join(", "))} · ${license.devices.length}/${license.maxDevices} cihaz · ${escapePrototypeText(license.expires)}</span></div><form data-customer-license-request-form data-type="${type}" data-license-id="${license.id}">${type === "change" ? `<fieldset><legend>Talep edilen modüller</legend><div class="customer-request-module-grid">${allModules.map((module) => `<label><input name="modules" type="checkbox" value="${module}" ${license.modules.includes(module) ? "checked" : ""}><span>${module}</span></label>`).join("")}</div></fieldset><label>Cihaz sınırı<input name="maxDevices" type="number" min="1" max="100" value="${license.maxDevices}"></label><label>Bitiş tarihi<input name="expires" type="date" value="${escapePrototypeText(license.expiresIso || nextYear)}"></label>` : ""}${type === "renew" ? `<label>Yeni bitiş tarihi<input name="expires" type="date" value="${escapePrototypeText(nextYear)}" required></label>` : ""}${type === "device" ? `<label>Cihaz işlemi<select name="deviceAction"><option value="reset">Tüm cihazları sıfırla</option>${machine ? `<option value="remove:${escapePrototypeText(machine)}">${escapePrototypeText(machine)} cihazını kaldır</option>` : ""}</select></label>` : ""}<label class="is-wide">Talep nedeni<textarea name="reason" required placeholder="Bu değişikliğe neden ihtiyaç duyduğunuzu açıklayın"></textarea></label><button type="submit">Talebi yönetime gönder</button></form></div>`;
}

function openCustomerRequestForm(type, licenseId, machine = "") {
  const license = customerLicenses().find((item) => item.id === licenseId) || customerLicenses()[0];
  if (!license) { showPrototypeToast("Bu işlem için aktif lisans bulunamadı.", "warning"); return; }
  const typeKey = type === "change" ? "change" : type === "renew" ? "renew" : "device";
  const existing = customerRequests().find((request) => request.licenseId === license.id && request.typeKey === typeKey && requestIsOpen(request));
  if (existing) { showPrototypeToast(`${existing.id} numaralı aynı türde açık talebiniz var.`, "warning"); selectCustomerSection("requests"); return; }
  customerOverview.hidden = true;
  customerModuleView.hidden = false;
  customerDashboard.querySelector("[data-customer-page-title]").textContent = "Yeni lisans talebi";
  customerDashboard.querySelector("[data-customer-page-description]").textContent = "Mevcut lisansınız doğrudan değişmez; talep yönetici onayından sonra uygulanır.";
  customerModuleContent.innerHTML = customerRequestFormMarkup(type, license, machine);
  bindCustomerDynamicActions();
  window.lucide?.createIcons();
  customerDashboard.querySelector(".customer-main").scrollTop = 0;
}

async function submitCustomerLicenseRequest(form) {
  const license = customerLicenses().find((item) => item.id === form.dataset.licenseId);
  if (!license) return;
  const formData = new FormData(form);
  const type = form.dataset.type;
  const input = {
    type,
    license_id: license.id,
    modules: [...license.modules],
    max_devices: license.maxDevices,
    expires_at: license.expiresIso || "",
    reason: String(formData.get("reason")).trim()
  };
  if (type === "change") {
    input.modules = formData.getAll("modules");
    input.max_devices = Number(formData.get("maxDevices"));
    input.expires_at = String(formData.get("expires") || "");
    if (!input.modules.length) { showPrototypeToast("En az bir modül seçmelisiniz.", "warning"); return; }
  }
  if (type === "renew") input.expires_at = String(formData.get("expires") || "");
  if (type === "device") {
    const value = String(formData.get("deviceAction"));
    const [action, machine = ""] = value.split(":");
    input.device_action = action;
    input.machine_code = machine;
  }
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await OptiApi.createCustomerRequest(input);
    await reloadCustomerState();
    refreshCustomerDemoData();
    selectCustomerSection("requests");
    showPrototypeToast("Talebiniz yönetim merkezine gönderildi.", "success");
  } catch (error) {
    submit.disabled = false;
    showPrototypeToast(error.message, "warning");
  }
}

function bindCustomerDynamicActions() {
  customerModuleContent.querySelector("[data-customer-download]")?.addEventListener("click", openDownloadScreen);
  customerModuleContent.querySelectorAll("[data-customer-license-action]").forEach((button) => button.addEventListener("click", () => openCustomerRequestForm(button.dataset.customerLicenseAction, button.dataset.licenseId)));
  customerModuleContent.querySelectorAll("[data-customer-device-request]").forEach((button) => button.addEventListener("click", () => openCustomerRequestForm("device", button.dataset.customerDeviceRequest, button.dataset.machine)));
  customerModuleContent.querySelectorAll("[data-customer-key-action]").forEach((button) => button.addEventListener("click", async () => {
    const card = button.closest("[data-customer-license-id]");
    const license = customerLicenses().find((item) => item.id === card?.dataset.customerLicenseId);
    if (!license) return;
    if (button.dataset.customerKeyAction === "reveal") {
      if (revealedCustomerLicenseKeys.has(license.id)) revealedCustomerLicenseKeys.delete(license.id); else revealedCustomerLicenseKeys.add(license.id);
      selectCustomerSection("licenses");
    } else {
      try { await navigator.clipboard.writeText(license.key); } catch (_) { /* Yerel prototip panoya erişemeyebilir. */ }
      showPrototypeToast("Lisans anahtarı kopyalandı.", "success");
    }
  }));
  customerModuleContent.querySelector("[data-customer-request-close]")?.addEventListener("click", () => selectCustomerSection("licenses"));
  const licenseRequest = customerModuleContent.querySelector("[data-customer-license-request-form]");
  licenseRequest?.addEventListener("submit", (event) => { event.preventDefault(); if (licenseRequest.reportValidity()) submitCustomerLicenseRequest(licenseRequest); });
  const passwordForm = customerModuleContent.querySelector("[data-customer-password-form]");
  passwordForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (passwordForm.reportValidity()) submitCustomerPasswordChange(passwordForm);
  });
  customerModuleContent.querySelectorAll("[data-customer-request-reply]").forEach((button) => button.addEventListener("click", () => {
    const request = customerRequests().find((item) => item.id === button.closest("[data-customer-request-id]")?.dataset.customerRequestId);
    if (!request) return;
    customerModuleContent.innerHTML = `<div class="customer-request-form-shell"><header><div><p>Ek bilgi</p><h2>${escapePrototypeText(request.id)}</h2><span>Yöneticinin mesajını yanıtlayın.</span></div></header><div class="customer-request-current"><b>Yönetici mesajı</b><span>${escapePrototypeText(request.adminMessage)}</span></div><form data-customer-reply-form><label class="is-wide">Yanıtınız<textarea name="reply" required></textarea></label><button type="submit">Bilgiyi gönder</button></form></div>`;
    const replyForm = customerModuleContent.querySelector("[data-customer-reply-form]");
    replyForm.addEventListener("submit", async event => {
      event.preventDefault();
      if (!replyForm.reportValidity()) return;
      const submit = replyForm.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        await OptiApi.replyCustomerRequest(request.id, replyForm.elements.reply.value.trim());
        await reloadCustomerState();
        refreshCustomerDemoData();
        selectCustomerSection("requests");
        showPrototypeToast("Ek bilgi yönetime gönderildi.", "success");
      } catch (error) {
        submit.disabled = false;
        showPrototypeToast(error.message, "warning");
      }
    });
    window.lucide?.createIcons();
  }));
  customerModuleContent.querySelectorAll("[data-customer-jump]").forEach((button) => button.addEventListener("click", () => selectCustomerSection(button.dataset.customerJump)));
  const supportForm = customerModuleContent.querySelector("[data-customer-support-form]");
  supportForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!supportForm.reportValidity()) return;
    const submit = supportForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await OptiApi.createSupport({
        subject: supportForm.elements.subject.value.trim(),
        category: supportForm.elements.category.value,
        message: supportForm.elements.message.value.trim()
      });
      await reloadCustomerState();
      refreshCustomerDemoData();
      selectCustomerSection("tickets");
      showPrototypeToast("Destek talebi oluşturuldu.", "success");
    } catch (error) {
      submit.disabled = false;
      showPrototypeToast(error.message, "warning");
    }
  });
}

function bindCustomerOverviewActions() {
  customerOverviewContent.querySelector("[data-customer-download]")?.addEventListener("click", openDownloadScreen);
  customerOverviewContent.querySelectorAll("[data-customer-license-action]").forEach((button) => button.addEventListener("click", () => openCustomerRequestForm(button.dataset.customerLicenseAction, button.dataset.licenseId)));
  customerOverviewContent.querySelectorAll("[data-customer-jump]").forEach((button) => button.addEventListener("click", () => selectCustomerSection(button.dataset.customerJump)));
}

function selectCustomerSection(section) {
  currentCustomerSection = section;
  customerNavButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.customerSection === section));
  if (section === "overview") {
    customerOverview.hidden = false;
    customerModuleView.hidden = true;
    customerDashboard.querySelector("[data-customer-page-title]").textContent = "Genel bakış";
    customerDashboard.querySelector("[data-customer-page-description]").textContent = "Lisansınızı, taleplerinizi, cihazlarınızı ve hesabınızı yönetin.";
    customerOverviewContent.innerHTML = customerOverviewMarkup();
    bindCustomerOverviewActions();
  } else {
    const [title, description] = customerSectionMeta[section];
    customerOverview.hidden = true;
    customerModuleView.hidden = false;
    customerDashboard.querySelector("[data-customer-page-title]").textContent = title;
    customerDashboard.querySelector("[data-customer-page-description]").textContent = description;
    customerModuleContent.innerHTML = customerSectionMarkup(section);
    bindCustomerDynamicActions();
  }
  window.lucide?.createIcons();
  customerDashboard.querySelector(".customer-main").scrollTop = 0;
}

function refreshCustomerDemoData() {
  const customer = currentPrototypeCustomer();
  const requests = customerRequests();
  const licenses = customerLicenses();
  const openRequests = requests.filter(requestIsOpen).length;
  const unread = customerNotifications().filter((notification) => !notification.read).length;
  customerDashboard.querySelector("[data-customer-ticket-count]").textContent = String(optiDemoState.tickets.filter((ticket) => !ticket.customerId || ticket.customerId === customer.id).length);
  customerDashboard.querySelector("[data-customer-request-count]").textContent = String(openRequests);
  customerDashboard.querySelector("[data-customer-name]").textContent = customer.company;
  customerDashboard.querySelector("[data-customer-initials]").textContent = customerInitials(customer);
  const status = customerDashboard.querySelector("[data-customer-account-status]");
  status.classList.toggle("is-candidate", customer.status === "Aday");
  status.querySelector("b").textContent = licenses.some((license) => license.status === "Aktif") ? "Lisans aktif" : (customer.status === "Aday" ? "Aday müşteri" : "Lisans bulunmuyor");
  status.querySelector("span").lastChild.textContent = customer.status === "Aday" ? `${openRequests} talep inceleniyor` : `${unread} yeni bildirim`;
  if (currentCustomerSection === "overview") {
    customerOverviewContent.innerHTML = customerOverviewMarkup();
    bindCustomerOverviewActions();
    window.lucide?.createIcons();
  }
}

customerNavButtons.forEach((button) => button.addEventListener("click", () => selectCustomerSection(button.dataset.customerSection)));
customerDashboard.querySelector("[data-customer-refresh]")?.addEventListener("click", async event => {
  event.currentTarget.disabled = true;
  try {
    await reloadCustomerState();
    refreshCustomerDemoData();
    selectCustomerSection(currentCustomerSection);
    showPrototypeToast("Müşteri bilgileri canlı servisten yenilendi.", "success");
  } catch (error) {
    showPrototypeToast(error.message, "warning");
  } finally {
    event.currentTarget.disabled = false;
  }
});
customerDashboard.querySelector("[data-customer-home]")?.addEventListener("click", () => { location.href = "index.html"; });
customerDashboard.querySelectorAll("[data-customer-download]").forEach(button => button.addEventListener("click", openDownloadScreen));
customerDashboard.querySelector("[data-customer-license-request]")?.addEventListener("click", () => { location.href = "license.html"; });
customerDashboard.querySelector("[data-customer-logout]")?.addEventListener("click", async () => {
  try { await OptiApi.customerLogout(); } finally { location.href = "login.html"; }
});

async function initializeCustomer() {
  try {
    await reloadCustomerState();
    refreshCustomerDemoData();
    selectCustomerSection("overview");
    window.lucide?.createIcons();
  } catch (error) {
    if (error.status === 401) location.replace("login.html");
    else showPrototypeToast(`Müşteri bilgileri alınamadı: ${error.message}`, "warning");
  }
}

initializeCustomer();
