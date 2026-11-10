-- Where readers came from: new article and story views per day by source
-- (facebook, instagram, x, search, site, other, shared).
CREATE TABLE view_sources (slug TEXT NOT NULL, day TEXT NOT NULL, source TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day, source));

-- Readers who reached the end of an article, per day (each person once a day).
CREATE TABLE reads_done (slug TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day));
