-- Total views per article or story, and views per day for the "most popular" list.
CREATE TABLE views (slug TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
CREATE TABLE views_daily (slug TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day));
-- One view per device per page per day (a random device id, or a hash of the address; never the address itself).
CREATE TABLE seen (key TEXT PRIMARY KEY, day TEXT NOT NULL);

-- Poll votes: one vote per poll per device.
CREATE TABLE poll_votes (poll TEXT NOT NULL, voter TEXT NOT NULL, option INTEGER NOT NULL, PRIMARY KEY (poll, voter));

-- Story episode ratings: one rating per episode per device, which can be changed.
CREATE TABLE ratings (story TEXT NOT NULL, episode INTEGER NOT NULL, voter TEXT NOT NULL, value INTEGER NOT NULL, PRIMARY KEY (story, episode, voter));

-- Likes and dislikes on comments: one per comment per device.
CREATE TABLE comment_votes (comment TEXT NOT NULL, voter TEXT NOT NULL, value INTEGER NOT NULL, PRIMARY KEY (comment, voter));

-- Simple flood protection: requests per reader per action per hour.
CREATE TABLE hits (key TEXT PRIMARY KEY, n INTEGER NOT NULL);
