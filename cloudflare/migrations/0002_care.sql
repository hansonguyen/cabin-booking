CREATE TABLE cabin_care (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
INSERT INTO cabin_care (id, revision, data)
VALUES (1, 0, '{"version":1,"tasks":[],"articles":[]}');
