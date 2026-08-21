-- Hill Country Consultants — onboarding check-in drip flags
-- =============================================================================
-- Records when each new client was sent the day-3 and day-14 onboarding
-- check-in emails, so the daily cron sends each phase exactly once.
-- Only clients created AFTER this ships enter the windows (older clients are
-- already past them), so existing clients are never emailed.
--
-- Idempotent. Run in the Supabase SQL Editor.
-- =============================================================================

alter table clients add column if not exists welcome_d3_at  timestamptz;
alter table clients add column if not exists welcome_d14_at timestamptz;
