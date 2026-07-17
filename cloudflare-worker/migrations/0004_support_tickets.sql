CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  license_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Teknik',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Açık' CHECK (status IN ('Açık', 'İşlemde', 'Kapalı')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_support_license ON support_tickets(license_id);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_created ON support_tickets(created_at DESC);
