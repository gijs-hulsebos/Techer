# Techer on Vercel

Production: https://techer-three.vercel.app
The production build and TypeScript checks passed. Anonymous profile and ratings requests return 401, including requests with forged legacy identity headers. `TECHER_SITE_URL` is configured for the next deployment; redeploy after completing Google setup.

Hosting uses Vercel with Next.js. Deploy with `npx vercel deploy --prod` from this directory. The old `.openai` configuration is retained only as migration history; do not publish through Sites.

Production environment variables:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` (server only).
- `TECHER_CLOUD_ENABLED=true`.
- `TECHER_SITE_URL`: the stable Vercel production origin.
- `TECHER_GOOGLE_AUTH_ENABLED`: keep false until the Google provider and redirect URLs are configured.
- `TECHER_JEV_ENABLED`: currently false on Vercel. Enabling requires the OpenRouter server secret and completed account migration.

Google's authorized redirect URI is `https://akxsectksxkywgmrwhpo.supabase.co/auth/v1/callback`. Supabase's allowed application redirect is `<TECHER_SITE_URL>/auth/finish`.

The server validates Supabase sessions with `auth.getUser()`. Client-supplied identity headers are not accepted. Existing Sites profiles remain unchanged: their legacy IDs must be securely associated with the authenticated Supabase account before migrating ratings and analyses. Do not infer ownership from an unverified browser ID.

Google login and existing-profile migration remain pending. Until then, the Vercel landing page displays a setup notice. The old deployment can remain available during this transition.
