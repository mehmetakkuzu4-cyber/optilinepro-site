PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  label TEXT NOT NULL,
  machine_code TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Askıda', 'İptal')),
  max_devices INTEGER NOT NULL DEFAULT 1 CHECK (max_devices > 0),
  expires_at TEXT,
  access_level TEXT NOT NULL DEFAULT 'unlimited',
  note TEXT,
  program_version TEXT,
  last_check TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS license_modules (
  license_id TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('Proje', 'Profil', 'Stok Danışmanı', 'Levha')),
  PRIMARY KEY (license_id, module),
  FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  machine_code TEXT NOT NULL,
  activated_at TEXT NOT NULL,
  last_check TEXT,
  program_version TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  UNIQUE (license_id, machine_code),
  FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  release_date TEXT NOT NULL,
  setup_url TEXT,
  update_url TEXT,
  sha256 TEXT,
  required INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_current INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS license_requests (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  contact TEXT,
  machine_code TEXT NOT NULL,
  modules_json TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'Yeni',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_devices_license ON devices(license_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON license_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

INSERT OR IGNORE INTO releases (
  id, version, release_date, setup_url, update_url, sha256, required, notes,
  is_current, created_at, updated_at
) VALUES (
  'release-1-1-1', '1.1.1', '2026-07-16', '', '', '', 0,
  'OptiLine Pro merkezi yayın kaydı.', 1,
  '2026-07-17T00:00:00.000Z', '2026-07-17T00:00:00.000Z'
);
