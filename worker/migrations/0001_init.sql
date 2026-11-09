-- Habits and daily check-ins, owned by a WorkOS user ID.
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE INDEX habits_by_owner ON habits (owner_id, created_at);

CREATE TABLE checkins (
  habit_id TEXT NOT NULL REFERENCES habits (id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  date TEXT NOT NULL,
  PRIMARY KEY (habit_id, date)
) STRICT, WITHOUT ROWID;

CREATE INDEX checkins_by_owner ON checkins (owner_id, habit_id, date);
