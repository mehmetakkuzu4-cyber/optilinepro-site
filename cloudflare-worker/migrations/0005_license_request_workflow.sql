ALTER TABLE license_requests ADD COLUMN company TEXT;
ALTER TABLE license_requests ADD COLUMN email TEXT;
ALTER TABLE license_requests ADD COLUMN phone TEXT;
ALTER TABLE license_requests ADD COLUMN requested_duration_months INTEGER;
ALTER TABLE license_requests ADD COLUMN requested_max_devices INTEGER NOT NULL DEFAULT 1;
ALTER TABLE license_requests ADD COLUMN decision_note TEXT;
ALTER TABLE license_requests ADD COLUMN reviewed_at TEXT;
ALTER TABLE license_requests ADD COLUMN reviewed_by TEXT;
ALTER TABLE license_requests ADD COLUMN license_id TEXT;

CREATE INDEX IF NOT EXISTS idx_requests_created ON license_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_license ON license_requests(license_id);
