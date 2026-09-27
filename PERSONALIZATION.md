# Personal ranking model

Techer trains a regularized logistic regression for each account; it does not fine-tune JEV. Version 1 uses category indicators and a normalized 64-bin hash of post titles, text and tags. There are no paid AI calls during training. JEV remains the separate preference-analysis service. JEV-generated per-post semantic features are not part of this version.

The daily Vercel cron `/api/cron/train` runs around 03:00 UTC (Hobby scheduling has hour-level precision), authenticated using the server-only `CRON_SECRET`. It processes at most 50 accounts per invocation, oldest checked first, with ten-minute leases. This is suitable for the current small deployment; larger deployments need a durable worker queue. Failures leave the previous active model intact and expire their lease. Identical successful requests within 23 hours do not train twice.

Training requires 100 unique rated posts including at least 15 likes and 15 dislikes; missing post snapshots cannot train. At most the latest 2,000 unique posts train the small model. Recent choices receive exponential weights with a 90-day time constant, floored at 0.15. Saves, opens, absent impressions and dwell time do not label the model. Duplicate posts count once. Undoing or editing a training example invalidates the model until the next evaluation.

The newest 20% (20–100 examples) are held out chronologically. When an incumbent exists, evaluation uses only examples newer than its entire training window. Equal timestamps are excluded from the fitting side of the boundary. The candidate must improve log loss by at least 2% against a constant smoothed training-like-rate baseline and against the incumbent. A winner is then refitted on all available training examples. Rejected candidates wait for 20 genuinely newer labels before another evaluation. Stored test metrics describe the pre-refit candidate, not an independent test of the refit production model. This evaluation is small-sample evidence, not a guarantee or randomized online trial.

The personalized feed preserves seen-post exclusion and category filters. Blind Spot retains the existing bridging logic. Every seventh decision slot uses a deterministic daily shuffle for exploration. This changes ranking only; it does not invent source posts. Client-side model validation falls back to the usual ranking on edits or missing history. Models and training runs are account-scoped through authenticated server routes, with no direct anon/authenticated database access.

Verification: TypeScript; `verify-personal-model.mjs` (can be run after TypeScript transpilation or with a TypeScript-capable loader); database RLS/grant checks; cron authorization and a live scheduled-run smoke test. Model versions and test results appear in Analytics. All candidate versions are kept in `techer_training_runs`; the current model is in `techer_personal_models`.

## Three-level ratings and accumulating news

`techer_swipes.user_rating` is a generated smallint derived from the backward-compatible action: LEFT=0, RIGHT=1, SUPER=2. Old likes/dislikes retain their meaning. Profile JSON may carry the same value; the API rejects mismatches. JEV receives the numeric rating and a distinct superlike decision. Category score uses the mean 0–2 rating with a neutral prior. Longitudinal positive-rate charts include likes and superlikes; the superlike count remains separately available.

Personal model feature version 2 invalidates v1 models and learns ordinal targets (dislike 0, like .65, superlike 1). Evaluation loss now measures the ordinal target rather than a calibrated binary like probability. Training and test boundaries remain unchanged.

The feed ingests Aligned News's public `/api/stories?limit=500`, `/api/news-feed` (all returned sections), and RSS feed, deduplicated by source URL. The first source currently returns fewer than 500 stories; this is not a claim to retrieve every historical X-list post. No X API is used. Published stories may have multiple primary links, each represented once.

`techer_news_archive` retains unique posts instead of replacing the previous batch. A daily 02:00 UTC cron ingests even without an active browser; opening the app also checks at most once every five minutes globally. Source failure preserves the archive. The authenticated feed returns 100 unseen posts per cursor page; the app merges pages and fetches more as the stack runs low. Seen exclusion is per account. New users receive the available archive. Inventory is finite and grows only when sources publish genuinely new links.

Checked: user_rating=2 database persistence and category counts, account-specific seen exclusion, undo, parser deduplication, model/JEV payload, mobile button order and 320px fit, local pagination with fixtures. Test-only preview route is removed before deployment.
