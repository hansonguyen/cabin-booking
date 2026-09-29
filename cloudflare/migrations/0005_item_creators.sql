-- Last editor and assignee do not establish original ownership. Leave legacy
-- creators unknown; only the administrator can delete those existing records.
ALTER TABLE tasks ADD COLUMN created_by TEXT;
ALTER TABLE book_pages ADD COLUMN created_by TEXT;

CREATE TRIGGER tasks_creator_immutable BEFORE UPDATE OF created_by ON tasks
WHEN NEW.created_by IS NOT OLD.created_by
BEGIN
  SELECT RAISE(ABORT, 'Item creator cannot be changed.');
END;
CREATE TRIGGER book_pages_creator_immutable BEFORE UPDATE OF created_by ON book_pages
WHEN NEW.created_by IS NOT OLD.created_by
BEGIN
  SELECT RAISE(ABORT, 'Item creator cannot be changed.');
END;
