-- Arrival dates are inclusive; departure dates are exclusive.
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 12),
  guest_names TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  open_to_company INTEGER NOT NULL DEFAULT 0 CHECK (open_to_company IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (start_date < end_date)
);
CREATE INDEX bookings_start_date ON bookings (start_date);
CREATE INDEX bookings_owner_email ON bookings (owner_email);
-- A unique row per occupied night prevents concurrent overlapping reservations.
CREATE TABLE booking_nights (
  night TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE
);
