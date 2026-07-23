(function () {
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  const base = local ? "http://127.0.0.1:8787" : "https://api.optilinepro.com";

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
      cache: "no-store"
    });
    let payload = {};
    try { payload = await response.json(); } catch (_) { payload = {}; }
    if (!response.ok) {
      const error = new Error(payload.error || `Sunucu işlemi tamamlanamadı (${response.status}).`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function date(value, fallback = "-") {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      ...(String(value).includes("T") ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(parsed);
  }

  function isoDate(value) {
    if (!value) return "";
    const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : "";
  }

  function actionLabel(action) {
    const labels = {
      "license.create": "Lisans oluşturuldu",
      "license.update": "Lisans düzenlendi",
      "license.pause": "Lisans askıya alındı",
      "license.activate": "Lisans etkinleştirildi",
      "license.cancel": "Lisans iptal edildi",
      "license.renew": "Lisans anahtarı yenilendi",
      "license.reset-device": "Cihazlar sıfırlandı",
      "license.update.request": "Lisans talebi uygulandı",
      "license.create.request": "Talep üzerinden lisans oluşturuldu",
      "license_request.approve": "Lisans talebi onaylandı",
      "license_request.reject": "Lisans talebi reddedildi",
      "license_request.info": "Ek bilgi istendi",
      "license_request.reply": "Müşteri yanıt verdi",
      "support.create": "Destek talebi oluşturuldu",
      "support.open": "Destek talebi yeniden açıldı",
      "support.progress": "Destek talebi işleme alındı",
      "support.close": "Destek talebi kapatıldı",
      "release.publish": "Güncelleme yayınlandı"
    };
    return labels[action] || action || "Sistem işlemi";
  }

  function mapDevice(row) {
    return {
      id: row.id,
      machine: row.machine || row.machine_code || "-",
      name: "Üretim bilgisayarı",
      system: "Windows",
      activatedAt: date(row.activated_at),
      lastCheck: date(row.last_check),
      version: row.version || row.program_version || "-",
      status: row.status || "Aktif"
    };
  }

  function mapHistory(row) {
    return {
      id: row.id,
      date: date(row.created_at),
      actor: row.actor || "Sistem",
      title: actionLabel(row.action),
      detail: row.detail?.reason || row.detail?.decision_note || row.detail?.label || "İşlem başarıyla kaydedildi."
    };
  }

  function mapLicense(row) {
    const linkedCustomer = row.customer && typeof row.customer === "object" ? row.customer : {};
    const customerText = typeof row.customer === "string" ? row.customer : "";
    return {
      id: row.id,
      customerId: row.customer_id ?? row.customerId ?? linkedCustomer.id ?? "",
      key: row.key || row.license_key || "",
      label: row.label || "OptiLine Pro",
      customer: row.customer_company || row.company || linkedCustomer.company || row.customer_name || linkedCustomer.name || customerText || row.label || "Müşteri",
      company: row.customer_company || row.company || linkedCustomer.company || "",
      customerName: row.customer_name || row.contact_name || linkedCustomer.contact_name || linkedCustomer.name || customerText || "",
      email: row.customer_email || row.email || linkedCustomer.email || row.contact || "",
      phone: row.customer_phone || row.phone || linkedCustomer.phone || "",
      status: row.status || "Aktif",
      maxDevices: Number(row.max_devices || 1),
      expires: row.expires_at ? date(row.expires_at) : "Sınırsız",
      expiresIso: isoDate(row.expires_at),
      lastCheck: date(row.last_check, "Cihaz bağlantısı yok"),
      modules: Array.isArray(row.modules) ? row.modules : [],
      customerMessage: row.customer_message || "",
      adminNote: row.admin_note || "",
      note: row.note || "",
      devices: (row.devices || []).map(mapDevice),
      history: (row.history || []).map(mapHistory),
      raw: row
    };
  }

  function requestType(type) {
    return ({ new: "Yeni lisans", change: "Lisans değişikliği", renew: "Süre uzatma", device: "Cihaz işlemi" })[type] || "Lisans talebi";
  }

  function mapRequest(row) {
    const current = row.current || {};
    const requested = row.requested || {};
    const status = row.status === "Ek Bilgi Bekleniyor" ? "Ek bilgi bekleniyor" : row.status;
    return {
      id: row.id,
      type: requestType(row.type || row.request_type || "new"),
      typeKey: row.type || row.request_type || "new",
      customerId: row.customer_id,
      licenseId: row.target_license_id || row.license_id || "",
      createdLicenseId: row.license_id || "",
      licenseLabel: requested.label || "",
      company: row.company || row.customer_name || "Müşteri",
      customer: row.customer_name || "",
      email: row.email || row.contact || "",
      phone: row.phone || "",
      machine: row.machine_code || "",
      current: {
        modules: current.modules || [],
        maxDevices: Number(current.max_devices || 0),
        expires: current.expires_at ? date(current.expires_at) : (current.label ? "Sınırsız" : "Lisans yok"),
        action: current.action || "Mevcut cihazlar korunur"
      },
      requested: {
        modules: requested.modules || row.modules || [],
        maxDevices: Number(requested.max_devices || row.requested_max_devices || 1),
        expires: requested.expires_at ? date(requested.expires_at) : (requested.duration_months ? `${requested.duration_months} ay` : "Yönetici belirlesin"),
        expiresIso: isoDate(requested.expires_at || row.requested_expires_at),
        action: requested.action || "",
        machine: requested.machine || requested.machine_code || ""
      },
      reason: row.reason || row.note || "",
      status: status || "Yeni",
      date: date(row.created_at),
      decidedAt: date(row.reviewed_at || row.updated_at),
      adminMessage: row.customer_message || row.decision_note || "",
      adminNote: row.admin_note || "",
      raw: row
    };
  }

  function mapCustomer(row) {
    return {
      id: row.id,
      company: row.company || row.customer_company || row.name || row.customer_name || "Müşteri",
      contact: row.contact_name || row.customer_name || row.name || "",
      email: row.email || row.customer_email || "",
      phone: row.phone || row.customer_phone || "",
      status: row.account_status === "candidate" || row.status === "candidate" ? "Aday" : "Aktif",
      accountType: row.account_status === "candidate" || row.status === "candidate" ? "Aday müşteri" : "Müşteri",
      passwordSet: Boolean(row.has_password || row.last_login_at || row.status),
      licenseIds: [],
      createdAt: date(row.created_at),
      raw: row
    };
  }

  function mapNotification(row) {
    return {
      id: row.id,
      customerId: row.customer_id,
      title: row.title || "Bildirim",
      detail: row.message || "",
      date: date(row.created_at),
      read: Boolean(row.read_at)
    };
  }

  function mapTicket(row) {
    return {
      id: row.id,
      customerId: row.customer_id,
      licenseId: row.license_id,
      subject: row.subject || "Destek talebi",
      category: row.category || "Teknik",
      message: row.message || "",
      contactName: row.contact_name || "",
      company: row.company || "",
      email: row.email || "",
      phone: row.phone || "",
      machineCode: row.machine_code || "",
      source: row.public_request ? "Web sitesi" : "Müşteri paneli",
      date: date(row.created_at),
      status: row.status || "Açık",
      customer: row.label || row.company || row.contact_name || "Müşteri"
    };
  }

  function adminState(snapshot) {
    const licenses = (snapshot.licenses || []).map(mapLicense);
    const customers = (snapshot.customers || []).map(mapCustomer);
    const customerKey = value => value === undefined || value === null ? "" : String(value);
    const customersById = new Map(customers.map(customer => [customerKey(customer.id), customer]));
    licenses.forEach(license => {
      const customer = customersById.get(customerKey(license.customerId));
      if (!customer) return;
      license.company ||= customer.company;
      license.customerName ||= customer.contact;
      license.email ||= customer.email;
      license.phone ||= customer.phone;
      license.customer = license.company || license.customerName || license.customer;
    });
    customers.forEach(customer => {
      customer.licenseIds = licenses.filter(item => customerKey(item.customerId) === customerKey(customer.id)).map(item => item.id);
    });
    return {
      licenses,
      customers,
      requests: (snapshot.requests || []).map(mapRequest),
      notifications: [],
      tickets: (snapshot.tickets || []).map(mapTicket),
      visitors: snapshot.visitors || { summary: {}, recent: [], top_pages: [] },
      logs: (snapshot.audit || []).map(row => ({
        id: row.id,
        action: actionLabel(row.action),
        customer: row.detail?.label || row.entity_id || "Sistem",
        source: row.actor || "Sistem",
        result: "Başarılı",
        date: date(row.created_at)
      })),
      release: snapshot.release || {},
      devices: snapshot.devices || []
    };
  }

  function customerState(snapshot) {
    const customer = mapCustomer(snapshot.customer || {});
    const licenses = (snapshot.licenses || []).map(mapLicense);
    customer.licenseIds = licenses.map(item => item.id);
    return {
      currentCustomerId: customer.id,
      customers: [customer],
      licenses,
      requests: (snapshot.requests || []).map(mapRequest),
      notifications: (snapshot.notifications || []).map(mapNotification),
      tickets: (snapshot.tickets || []).map(mapTicket),
      logs: [],
      release: snapshot.release || {}
    };
  }

  window.OptiApi = {
    base,
    request,
    date,
    isoDate,
    mapLicense,
    mapRequest,
    adminState,
    customerState,
    publicRelease: () => request("/v1/public/release"),
    adminSession: () => request("/v1/admin/session"),
    adminLogin: (email, password, options = {}) => request("/v1/admin/login", { method: "POST", body: { email, password, remember: Boolean(options.remember) } }),
    adminLogout: () => request("/v1/admin/logout", { method: "POST", body: {} }),
    adminSnapshot: () => request("/v1/admin/snapshot"),
    visitorAnalytics: () => request("/v1/admin/analytics/visitors"),
    trackVisit: input => request("/v1/analytics/visit", { method: "POST", body: input }),
    customerLogin: (email, password, options = {}) => request("/v1/customer/login", { method: "POST", body: { email, password, remember: Boolean(options.remember) } }),
    customerLicenseLogin: (licenseKey, machineCode) => request("/v1/customer/login", {
      method: "POST",
      body: { license_key: licenseKey, machine_code: machineCode, app_version: "web-portal" }
    }),
    customerLogout: () => request("/v1/customer/logout", { method: "POST", body: {} }),
    customerSnapshot: () => request("/v1/customer/snapshot"),
    changeCustomerPassword: input => request("/v1/customer/password", { method: "POST", body: input }),
    createPublicRequest: input => request("/v1/license-requests", { method: "POST", body: input }),
    createPublicSupport: input => request("/v1/public/support-requests", { method: "POST", body: input }),
    createCustomerRequest: input => request("/v1/customer/license-requests", { method: "POST", body: input }),
    replyCustomerRequest: (id, message) => request(`/v1/customer/license-requests/${encodeURIComponent(id)}/reply`, { method: "POST", body: { message } }),
    createSupport: input => request("/v1/customer/support-tickets", { method: "POST", body: input }),
    createLicense: input => request("/v1/admin/licenses", { method: "POST", body: input }),
    updateLicense: (id, input) => request(`/v1/admin/licenses/${encodeURIComponent(id)}`, { method: "PATCH", body: input }),
    deleteLicense: (id, reason) => request(`/v1/admin/licenses/${encodeURIComponent(id)}`, { method: "DELETE", body: { reason } }),
    licenseAction: (id, action, reason = "") => request(`/v1/admin/licenses/${encodeURIComponent(id)}/actions/${encodeURIComponent(action)}`, { method: "POST", body: { reason } }),
    requestAction: (id, action, input = {}) => request(`/v1/admin/license-requests/${encodeURIComponent(id)}/actions/${encodeURIComponent(action)}`, { method: "POST", body: input }),
    deleteRequest: (id, reason = "") => request(`/v1/admin/license-requests/${encodeURIComponent(id)}`, { method: "DELETE", body: { reason } }),
    supportAction: (id, action) => request(`/v1/admin/support-tickets/${encodeURIComponent(id)}/actions/${encodeURIComponent(action)}`, { method: "POST", body: {} }),
    saveRelease: input => request("/v1/admin/release", { method: "PUT", body: input })
  };
})();
