-- Hill Country Consultants — seed the first three preferred vendors
-- =============================================================================
-- Adds Redd Ladys Chronicles Publishing & Production, TSD Events, and
-- Carnetta Dansby (Financial Analyst). Descriptions are starter copy — edit
-- them, add a website/contact, and upload a logo from the Preferred vendors tab.
-- Safe to re-run: each insert only fires if a vendor with that name isn't present.
-- Run after preferred-vendors.sql and preferred-vendors-2.sql.
-- =============================================================================

insert into preferred_vendors (name, category, services, blurb, is_public, active)
select 'Redd Ladys Chronicles Publishing & Production',
       'Publishing & Production',
       array['Publishing & Production','Photography & Media'],
       'Our publishing and production partner — manuscript development, book production, and launch and media support for authors and brands.',
       true, true
where not exists (select 1 from preferred_vendors where name = 'Redd Ladys Chronicles Publishing & Production');

insert into preferred_vendors (name, category, services, blurb, is_public, active)
select 'TSD Events',
       'Events',
       array['Events'],
       'Full-service event planning and coordination — from concept and logistics to on-site management.',
       true, true
where not exists (select 1 from preferred_vendors where name = 'TSD Events');

insert into preferred_vendors (name, category, services, blurb, is_public, active)
select 'Carnetta Dansby — Financial Analyst',
       'Financial & Accounting',
       array['Financial & Accounting'],
       'Financial analysis and advisory — modeling, planning, and reporting support to keep your numbers clear and decision-ready.',
       true, true
where not exists (select 1 from preferred_vendors where name = 'Carnetta Dansby — Financial Analyst');
