-- The calendar now says who is going, not who holds the cabin: stays may overlap.
DROP TABLE booking_nights;

-- One row per occurrence. Yearly gatherings share a series_id; the next year's row is
-- created once the current one ends. year is the occurrence's season and never changes.
CREATE TABLE gatherings (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 80),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  repeats INTEGER NOT NULL DEFAULT 0 CHECK (repeats IN (0, 1)),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  CHECK (start_date < end_date),
  UNIQUE (series_id, year)
);
CREATE INDEX gatherings_start_date ON gatherings (start_date);

-- Rebuild bookings to raise the guest cap and link a stay to a gathering. Removing a
-- gathering keeps the plans people added as ordinary stays.
CREATE TABLE bookings_next (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 30),
  guest_names TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  open_to_company INTEGER NOT NULL DEFAULT 0 CHECK (open_to_company IN (0, 1)),
  gathering_id TEXT REFERENCES gatherings (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (start_date < end_date)
);
INSERT INTO bookings_next (id, owner_email, title, start_date, end_date, guests, guest_names, notes, open_to_company, created_at, updated_at)
SELECT id, owner_email, title, start_date, end_date, guests, guest_names, notes, open_to_company, created_at, updated_at FROM bookings;
DROP TABLE bookings;
ALTER TABLE bookings_next RENAME TO bookings;
CREATE INDEX bookings_start_date ON bookings (start_date);
CREATE INDEX bookings_owner_email ON bookings (owner_email);
-- One set of plans per person per gathering.
CREATE UNIQUE INDEX bookings_gathering_owner ON bookings (gathering_id, owner_email) WHERE gathering_id IS NOT NULL;
