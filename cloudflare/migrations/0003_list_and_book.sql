-- Split the legacy document without discarding it; retain it as a migration snapshot.
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Chores', 'Repairs & renovations', 'Bring up', 'Running low')),
  notes TEXT NOT NULL DEFAULT '',
  assignee TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('To do', 'In progress', 'Done')),
  priority TEXT NOT NULL CHECK (priority IN ('Normal', 'High')),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT '',
  completed_at TEXT,
  completed_by TEXT
);
CREATE INDEX tasks_status_category ON tasks(status, category);
CREATE TABLE book_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL CHECK (topic IN ('General', 'Arrival & departure', 'Kitchen & supplies', 'Maintenance', 'Outdoors')),
  problem TEXT NOT NULL DEFAULT '',
  solution TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX book_pages_topic ON book_pages(topic);
INSERT INTO tasks (id, title, category, notes, assignee, status, priority, updated_at)
SELECT json_extract(j.value, '$.id'), json_extract(j.value, '$.title'),
  json_extract(j.value, '$.category'), json_extract(j.value, '$.notes'),
  json_extract(j.value, '$.assignee'), json_extract(j.value, '$.status'),
  json_extract(j.value, '$.priority'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM cabin_care, json_each(cabin_care.data, '$.tasks') j WHERE cabin_care.id = 1;
INSERT INTO book_pages (id, title, topic, problem, solution, tags, author, updated_at, verified)
SELECT json_extract(j.value, '$.id'), json_extract(j.value, '$.title'),
  json_extract(j.value, '$.topic'), json_extract(j.value, '$.problem'),
  json_extract(j.value, '$.solution'), json_extract(j.value, '$.tags'),
  json_extract(j.value, '$.author'), json_extract(j.value, '$.updatedAt'),
  json_extract(j.value, '$.verified')
FROM cabin_care, json_each(cabin_care.data, '$.articles') j WHERE cabin_care.id = 1;
-- Existing completed tasks keep unknown completion dates rather than invented dates.
-- Prevent the previous Worker from accepting writes into the archived document
-- between migration and deployment, or after an accidental code-only rollback.
CREATE TRIGGER cabin_care_read_only BEFORE UPDATE OF data ON cabin_care
BEGIN
  SELECT RAISE(ABORT, 'Cabin data was migrated. Reload the updated app before saving.');
END;
