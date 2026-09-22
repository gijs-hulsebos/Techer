# Techer

Mobile-first swipe reader for Robert Scoble's selection, via the public Aligned News RSS feed: https://alignednews.com/feed.xml.

## Current behavior
- A single card fills the available screen, with touch swipes as the primary action. Supports pointer dragging, velocity/distance thresholds, swipe feedback, undo and keyboard arrows.
- Black/gray/white interface with a restrained orange accent. No green theme, promotional panels, generated diagrams, sample articles or generated summaries.
- GET /api/feed fetches the actual Aligned News RSS server-side. Source response is normalized, URL-deduplicated, and cached for five minutes. The client retains the last successful feed for temporary outages, labelled as earlier content.
- Original titles and short feed descriptions. Repeated titles and two known generic boilerplate sentences are removed. The original link opens X or the source website. No original tweet body is fabricated.
- X-linked records get a small ranking preference. Category interests, positive/negative swipes, saves and opens affect ordering. Categories are based on the publisher's sections, with simple keyword bridges for Blind Spot; this is not JEV classification.
- Preferences and saved post snapshots are device-local. Saved records survive feed refreshes. Undo removes only the last swipe event and preserves later saves.
- Fits tested mobile viewports from 320×568 to 430×932 and desktop, with actions inside the viewport and safe-area support.

## Source limitations
Aligned News says it draws from 63 Robert Scoble X lists and additional sources. This app reads their publicly syndicated selection; it does not have the underlying 63 list IDs or direct access to every tweet. Direct X ingestion still needs the exact list IDs and authorized X API access. This distinction is visible in the source dialog.

## Development
npm install
npm run dev
npm run build

On Windows when the npm wrapper misresolves paths, call node scripts/run-framework.mjs dev or build directly.

Core checks: node --experimental-strip-types verify-core.mjs
Type check: node node_modules/typescript/bin/tsc --noEmit

The server-side ingestion interfaces and PostgreSQL schema remain available for future JEV/database integration; they are not connected to this RSS reader. The feature-detected WebMCP category tool is optional; native WebMCP was unavailable in the test browser.
