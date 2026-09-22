# Techer

Mobile-first tech feed sourced from Robert Scoble's published selection via Aligned News RSS. Original X posts, including media and quoted posts, render directly in the feed using the official X widget.

## Current live behavior
- Like and Dislike register RIGHT/LEFT events with UUID, timestamp, dwell time and a post snapshot.
- A separate bookmark control adds/removes records in the reading list. Bookmarks do not affect preference ranking or JEV input.
- Swipe on the surrounding native card; the embedded X iframe handles its own video/link/scroll interactions. Like/dislike buttons and keyboard arrows always remain available.
- No extra Open original button in the normal reading flow. X retains its own links and controls; if the widget fails, a source-link fallback remains available.
- Original feed source, category filters, Blind Spot, undo, Supabase persistence, and saved reading view are retained.
- X may truncate long posts. The embed is controlled by X and cannot guarantee unrestricted long-form content.

## Persistence and scoring
Supabase project Techer (akxsectksxkywgmrwhpo) is provisioned and migrated. The UI synchronizes each authenticated user’s profile, swipes and bookmarks through the server. Category ratings are derived in the database; bookmarks are separate. Browser storage holds a temporary outbox for offline changes. See INTEGRATIONS.md. JEV remains disabled: no key configured or live calls made.

## Development and checks
npm install
npm run dev
npm run build

On this Windows environment, node scripts/run-framework.mjs dev/build avoids npm wrapper path issues.

Checks: node node_modules/typescript/bin/tsc --noEmit; node --experimental-strip-types verify-core.mjs; node --experimental-strip-types verify-x.mjs; node --experimental-strip-types verify-integrations.mjs.

UI verified with live X embeds, separate bookmark behavior, swipe/like/dislike/undo, stored snapshots, and viewport checks at 320×568, 375×667, 390×844 and desktop.
