-- Voice training recordings (private: only the CMS administrator can reach them).
CREATE TABLE voice_clips (key TEXT PRIMARY KEY, text TEXT NOT NULL, seconds REAL NOT NULL, bytes INTEGER NOT NULL, at INTEGER NOT NULL);
-- The sound itself, in pieces (database rows have a size limit).
CREATE TABLE voice_parts (key TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (key, part));
