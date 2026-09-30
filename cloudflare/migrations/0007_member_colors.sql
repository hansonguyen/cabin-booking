-- Colors belong to email identities, independently of names, stays, or Access approval.
CREATE TABLE member_colors (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  color TEXT NOT NULL CHECK (color IN ('green', 'blue', 'plum', 'gold', 'teal', 'rose', 'indigo', 'olive', 'slate', 'cocoa'))
);
CREATE INDEX member_colors_color ON member_colors (color);

-- Give the existing family distinct colors first, without changing any family records.
WITH emails AS (
  SELECT lower(email) AS email FROM member_profiles
  UNION SELECT lower(owner_email) FROM bookings
  UNION SELECT lower(assignee) FROM tasks WHERE instr(assignee, '@') > 0
  UNION SELECT lower(author) FROM book_pages WHERE instr(author, '@') > 0
  UNION SELECT lower(created_by) FROM gatherings WHERE instr(created_by, '@') > 0
), numbered AS (
  SELECT email, (row_number() OVER (ORDER BY email) - 1) % 10 AS position FROM emails
)
INSERT INTO member_colors (email, color)
SELECT email, CASE position
  WHEN 0 THEN 'green' WHEN 1 THEN 'blue' WHEN 2 THEN 'plum' WHEN 3 THEN 'gold'
  WHEN 4 THEN 'teal' WHEN 5 THEN 'rose' WHEN 6 THEN 'indigo' WHEN 7 THEN 'olive'
  WHEN 8 THEN 'slate' ELSE 'cocoa' END
FROM numbered;
