-- Analytics enhanced columns
alter table analytics_events
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists browser      text,
  add column if not exists visitor_id   text,       -- persistent across sessions (localStorage)
  add column if not exists duration     int;        -- seconds spent on page

-- Index for new vs returning queries
create index if not exists analytics_events_visitor_id on analytics_events (org_id, visitor_id);
-- Index for time-of-day queries
create index if not exists analytics_events_hour on analytics_events (org_id, created_at);
