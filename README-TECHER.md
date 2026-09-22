# Techer

Working demo of a personal technology radar. Built with React, TypeScript, Tailwind and the Next.js-compatible Vinext runtime used by Sites. Swipe animations use CSS and pointer events; no Framer Motion dependency is required.

## Included
- 14 explicitly labelled editorial demo notes, all loaded in memory.
- Mouse/touch swipes, left/right arrow keys, undo, save, saved library, category filters, interest selection, reading dialog and external related-reading links.
- Device-local persistence of interests, interactions and saved IDs. OPEN has weak positive weight, SAVE strong positive weight. Undo restores the state before the last swipe.
- Deterministic ranking using declared category interests and behavior. Blind Spot requires a meaningful bridge to a positive interest and a relatively unexplored category; it never simply selects random rejected posts.
- Strict normalized-post and classification schemas, generic adapter contracts, an HN adapter, URL deduplication, classification-on-ingestion and embedding validation.
- PostgreSQL/pgvector migration scaffold with RLS enabled. This does not provision a database.

## Run
Install with npm install, then npm run dev. npm run build produces the Sites Worker build.

## Connect live services
The current UI intentionally uses lib/radar.ts fixtures and localStorage. It does not claim live X news, JEV classification or real semantic embeddings.

1. Provision PostgreSQL with pgvector. Select an embedding model and adjust both vector dimensions in db/schema.sql before applying it. Connect through a server-only HTTP-compatible database client for Workers. Never put credentials in NEXT_PUBLIC variables.
2. Implement PostRepository with a transactional upsert on the canonical URL hash. Use a dedicated ingestion role and authenticated per-user API endpoints; RLS currently denies ordinary client access by default.
3. Bind a verified JEV/Typesafe AI client to jevProvider(classify, embed). Classify output must match classificationSchema. No undocumented endpoint has been assumed.
4. Bind X list/account, RSS and website clients through sourceAdapter; supply only administrator-configured source locators. The exported hackerNewsAdapter can be used directly. For Scoble lists, obtain the actual list IDs and authorized X API access.
5. Run ingest in a single scheduled server-side worker (or acquire a per-source database lock). It deduplicates before calling AI. The repository must also enforce insertOnce atomically for concurrency.
6. Add authenticated feed/interaction/profile endpoints, switch the UI from fixtures to those endpoints, and compute embedding similarity and topic/entity/content-type affinities on the server. The current /api/feed endpoint identifies itself as demo.

API keys, authentication, a live ingestion scheduler, deployed database and JEV account are not included. The demo’s sample links are related reading, not original sources. The WebMCP category tool is feature-detected; unsupported browsers skip it.
