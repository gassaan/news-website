-- Article and story views per hour of the day (Maldives time), for "best time to publish".
CREATE TABLE views_hourly (day TEXT NOT NULL, hour INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, hour));

-- Who is reading right now: each device's latest article or story, and when it was opened.
-- Kept for an hour at most (a random device id or a hash of the address, as in "seen").
CREATE TABLE live (device TEXT PRIMARY KEY, slug TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX live_at ON live (at);

-- Adverts: how many people saw and tapped each advert, per day (each person once a day).
CREATE TABLE ad_stats (ad TEXT NOT NULL, day TEXT NOT NULL, seen INTEGER NOT NULL DEFAULT 0, taps INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (ad, day));
