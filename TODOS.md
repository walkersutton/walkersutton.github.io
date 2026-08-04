# TODOs

## Timezone leaks in trip date/time formatting

**Problem:** Report entry timestamps are stored correctly (server-side `new Date().toISOString()`
in `publishReportEntry`, so an absolute UTC instant regardless of the device that published it),
and most rendering pins `timeZone: SITE_CONFIG.timeZone` (`America/Los_Angeles`). Two spots don't:

- `app/trips/live/page.tsx:8` — `fmtDateLabel` omits `timeZone`. Server component, so it formats
  in the server's zone (UTC on Vercel). Report-preview date chips on `/trips/live` can show a day
  ahead of `/trips/live/report` for the same entry (anything posted after 5pm PDT).
- `app/trips/mapshare.ts:129` — `formatUpdated` omits `timeZone`, and both callers
  (`app/trips/TripMap.tsx:78`, `app/components/HomeTripsHero.tsx:38`) are client components, so
  "Updated …" renders in the *viewer's* device timezone. A reader in London sees a different time
  than one in Seattle for the same ping.

**Solution:** Pass `timeZone: SITE_CONFIG.timeZone` in both `Intl.DateTimeFormat` calls so all
trip times render in Pacific, consistent with the rest of the site.
