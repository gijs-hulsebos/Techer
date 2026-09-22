# Techer

Mobile-first tech feed sourced from Robert Scoble's published selection via Aligned News RSS. Original X posts, including media and quoted posts, render directly in the feed using the official X widget.

## Current live behavior
- Like and Dislike register RIGHT/LEFT events with UUID, timestamp, dwell time and a post snapshot.
- A separate bookmark control adds/removes records in the reading list. Bookmarks do not affect preference ranking or JEV input.
- Swipe on the grip below the embedded post (or the surrounding native card); the embedded X iframe handles its own video/link/scroll interactions. Like/dislike buttons and keyboard arrows always remain available.
- No extra Open original button in the normal reading flow. X retains its own links and controls; if the widget fails, a source-link fallback remains available.
- Original feed source, category filters, Blind Spot, undo, browser persistence, and saved reading view are retained.
- X may truncate long posts. The embed is controlled by X and cannot guarantee unrestricted long-form content.

## Persistence and scoring
Supabase and JEV are prepared but NOT connected. The UI still uses browser-local state. See INTEGRATIONS.md for the exact activation steps, schema, server-only environment variables, privacy boundaries and remaining integration work. No database was provisioned, no migration applied, and no live JEV calls made.

## Development and checks
npm install
npm run dev
npm run build

On this Windows environment, node scripts/run-framework.mjs dev/build avoids npm wrapper path issues.

Checks: node node_modules/typescript/bin/tsc --noEmit; node --experimental-strip-types verify-core.mjs; node --experimental-strip-types verify-x.mjs; node --experimental-strip-types verify-integrations.mjs.

UI verified with live X embeds, separate bookmark behavior, swipe/like/dislike/undo, stored snapshots, and viewport checks at 320×568, 375×667, 390×844 and desktop.
