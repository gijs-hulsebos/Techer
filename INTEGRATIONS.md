# Supabase + JEV — voorbereid, niet geactiveerd

Er is geen Supabase-project aangemaakt, geen migratie uitgevoerd en geen betaalde JEV-aanroep gedaan. De live app bewaart gegevens voorlopig in deze browser. Bewaren staat los van like/dislike en beïnvloedt de aanbevelingen niet.

## Opslag

Pas `supabase/migrations/20260922_techer.sql` toe in een nieuw Supabase-project. Het schema bevat profielen, links/rechts-swipes, een aparte leeslijst en JEV-scores. Events hebben unieke UUIDs en nieuwe swipes bewaren ook een postsnapshot. De score kan daardoor later op de inhoud van de geswipete post worden gebaseerd.

Deze privé-Site heeft al een ingelogde Sites-gebruiker. De server haalt diens ID uit de door Sites geverifieerde header; hij accepteert geen user-ID uit de browser. Supabase is de database, niet een tweede login. Tabellen zijn afgeschermd met RLS en ingetrokken browserrechten. De server-secret heeft verhoogde rechten en mag nooit in clientcode terechtkomen. Elke serverquery moet daarom expliciet op de geverifieerde gebruiker filteren.

Servergeheimen: SUPABASE_URL en SUPABASE_SECRET_KEY. Pas na configuratie en een echte isolatietest TECHER_CLOUD_ENABLED=true instellen. GET/PUT /api/profile en lib/cloud-profile-client.ts zijn voorbereid. De UI is nog bewust niet automatisch naar deze opslag omgeschakeld.

Bij activering: eerst cloud laden voordat swipen wordt toegestaan; eenmalig de lokale historie importeren na controle van de gebruiker; daarna een lokale outbox voor offline wijzigingen en seriële writes met de geretourneerde revision gebruiken. Een 409 betekent conflict: lokale data behouden en expliciet samenvoegen, nooit blind overschrijven. Test met twee gebruikers en twee tabs voordat de lokale opslag alleen nog als cache fungeert. De migratie gebruikt atomaire revisiecontrole en werkt profiel/swipes/leeslijst samen bij.

## JEV

lib/jev-scoring.ts gebruikt de officiële TypeSafe endpoint en een rubric van vijf niveaus (0–4), omgerekend naar 0–100. Confidence wordt apart bewaard; de score is geen gekalibreerde kans dat je liket. Alleen likes/dislikes en gekozen interesses vormen voorkeurssignalen, niet bookmarks. JEV ontvangt maximaal de laatste 50 swipes en kandidaattekst, geen e-mailadres of accountnaam.

Servergeheim: JEV_API_KEY. TECHER_JEV_ENABLED blijft false totdat echte toegang en een kostenlimiet beschikbaar zijn. De functie is voorbereid maar wordt nog niet aangeroepen door de live feed. Voeg bij activering een begrensde serverjob toe: pas na bijvoorbeeld 5 nieuwe swipes, maximaal 5 nieuwe kandidaten per batch. Laad het cloudprofiel, roep scoreWithJev aan, sla de resultaten in techer_scores op met profile_revision en model. Cache per gebruiker/post/revisie. Bij fouten blijven bestaande ranking en swipen beschikbaar; toon nooit een heuristische score als JEV-resultaat.

Voor live activering nog nodig: Supabase-project + server-secret, toegepaste migratie, JEV-toegang + sleutel, cloud UI/outbox aansluiten, geplande scoringsjob met budgetbegrenzing, en live isolatie-/conflicttests.

Officiële documentatie:
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.typesafe.ai/api
- https://docs.typesafe.ai/primitives/score
