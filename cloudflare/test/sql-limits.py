"""Run the actual directory SQL with D1's stricter compound-SELECT limit."""
import re
import sqlite3
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DirectorySqlLimits(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.row_factory = sqlite3.Row
        self.db.setlimit(sqlite3.SQLITE_LIMIT_COMPOUND_SELECT, 5)
        for migration in sorted((ROOT / "migrations").glob("*.sql")):
            self.db.executescript(migration.read_text())

    def tearDown(self):
        self.db.close()

    def test_limit_reproduces_the_production_failure(self):
        with self.assertRaisesRegex(sqlite3.OperationalError, "too many terms"):
            self.db.execute(" UNION ".join(f"SELECT {i}" for i in range(7)))

    def test_directory_preserves_names_colors_and_current_identity_under_limit(self):
        self.db.execute(
            "INSERT INTO member_profiles (email, display_name, updated_at, updated_by) VALUES (?, ?, ?, ?)",
            ("named@example.com", "Jane Smith", "2026-09-29T00:00:00Z", "admin@example.com"),
        )
        self.db.executemany(
            "INSERT INTO member_colors (email, color) VALUES (?, ?)",
            [("named@example.com", "green"), ("color-only@example.com", "blue")],
        )
        # Read the static SQL literal actually prepared by the GET route, not a test copy.
        source = (ROOT / "src/routes/members.ts").read_text()
        match = re.search(r"const rows = await env\.DB\.prepare\(`(.*?)`\)", source, re.S)
        self.assertIsNotNone(match, "The GET directory query must be available for the limit check")
        query = match.group(1)
        self.assertNotIn("${", query, "Interpolated SQL needs a runtime query capture")
        changes = self.db.total_changes
        rows = [dict(row) for row in self.db.execute(query, ("current@example.com",))]
        by_email = {row["email"]: row for row in rows}
        self.assertEqual(set(by_email), {"named@example.com", "color-only@example.com", "current@example.com"})
        self.assertEqual(by_email["named@example.com"]["displayName"], "Jane Smith")
        self.assertEqual(by_email["named@example.com"]["color"], "green")
        self.assertEqual(by_email["color-only@example.com"]["color"], "blue")
        self.assertEqual(by_email["current@example.com"]["version"], 0)
        self.assertEqual(self.db.total_changes, changes)


if __name__ == "__main__":
    unittest.main()
