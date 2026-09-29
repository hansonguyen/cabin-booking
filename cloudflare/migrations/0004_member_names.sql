-- Display names are independent of Cloudflare's sign-in allowlist.
CREATE TABLE member_profiles (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);
