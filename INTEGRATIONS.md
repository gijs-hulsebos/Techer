# Supabase aangesloten; JEV voorbereid

Supabase-project Techer (akxsectksxkywgmrwhpo) staat in de persoonlijke organisatie gijs-hulsebos, regio eu-central-1. De migraties zijn via CLI toegepast. Geen betaalde JEV-aanroep gedaan. Bewaren staat los van like/dislike en beïnvloedt de aanbevelingen niet.

## Opslag

De migraties in `supabase/migrations/` zijn toegepast. Het schema bevat profielen, links/rechts-swipes, een aparte leeslijst en JEV-scores. Events hebben unieke UUIDs en nieuwe swipes bewaren ook een postsnapshot. De score kan daardoor later op de inhoud van de geswipete post worden gebaseerd.

Deze privé-Site heeft al een ingelogde Sites-gebruiker. De server haalt diens ID uit de door Sites geverifieerde header; hij accepteert geen user-ID uit de browser. Supabase is de database, niet een tweede login. Tabellen zijn afgeschermd met RLS en ingetrokken browserrechten. De server-secret heeft verhoogde rechten en mag nooit in clientcode terechtkomen. Elke serverquery moet daarom expliciet op de geverifieerde gebruiker filteren.

Serverconfiguratie: SUPABASE_URL, SUPABASE_SECRET_KEY en TECHER_CLOUD_ENABLED=true zijn ingesteld in Sites. De sleutel blijft server-side. GET/PUT /api/profile zijn aangesloten op de UI. GET /api/ratings geeft uitsluitend categorieratings van de ingelogde gebruiker. De cloudserver leest runtime bindings via cloudflare:workers.

De UI laadt eerst het cloudprofiel. Bestaande browserhistorie wordt eenmaal geïmporteerd voor de eerste ingelogde eigenaar. Wijzigingen krijgen een unieke lokale outbox-entry en worden met revisiecontrole verwerkt. Bij conflicten worden alleen de lokale veranderingen toegepast op het nieuwste cloudprofiel. Offline wijzigingen blijven in de outbox; herstel volgt bij herladen, focus, online gaan of na 15 seconden. Bookmarks en undo worden meegenomen.

techer_categories bevat de zeven categorieën. techer_category_ratings is een actuele databaseview met likes, dislikes, aantal beoordelingen, gemiddelde leestijd, laatste beoordeling en preference_score. De score gebruikt een neutrale Beta(2,2)-prior: 100 × (likes + 2) / (likes + dislikes + 4). Dit is geobserveerde voorkeur, geen JEV-score. techer_scores bewaart toekomstige JEV-scores per gebruiker, post, profielrevisie, categorie en algoritmeversie.

## JEV

lib/jev-scoring.ts gebruikt de officiële TypeSafe endpoint en een rubric van vijf niveaus (0–4), omgerekend naar 0–100. Confidence wordt apart bewaard; de score is geen gekalibreerde kans dat je liket. Alleen likes/dislikes en gekozen interesses vormen voorkeurssignalen, niet bookmarks. JEV ontvangt maximaal de laatste 50 swipes en kandidaattekst, geen e-mailadres of accountnaam.

Servergeheim: JEV_API_KEY. TECHER_JEV_ENABLED blijft false totdat echte toegang en een kostenlimiet beschikbaar zijn. De functie is voorbereid maar wordt nog niet aangeroepen door de live feed. Voeg bij activering een begrensde serverjob toe: pas na bijvoorbeeld 5 nieuwe swipes, maximaal 5 nieuwe kandidaten per batch. Laad het cloudprofiel, roep scoreWithJev aan, sla de resultaten in techer_scores op met profile_revision en model. Cache per gebruiker/post/revisie. Bij fouten blijven bestaande ranking en swipen beschikbaar; toon nooit een heuristische score als JEV-resultaat.

Voor JEV-activering nog nodig: JEV-toegang + sleutel, een scoringsjob met budgetbegrenzing, scoreopslag en evaluatie van de ranking. De bestaande categorie-ranking gebruikt nu de gesynchroniseerde voorkeuren.

Officiële documentatie:
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.typesafe.ai/api
- https://docs.typesafe.ai/primitives/score


## Activering JEV via OpenRouter — 22 september 2026
De actieve integratie gebruikt lib/jev-analysis.ts met typesafe/jev-1.13 via https://openrouter.ai/api/alpha/decisions. OPENROUTER_API_KEY is als servergeheim in Sites ingesteld. De oorspronkelijke directe TypeSafe-postscorefunctie is niet actief. Er is een echte analyse uitgevoerd op vier swipes en opgeslagen in techer_analyses. Analytics leest deze resultaten en biedt expliciet opnieuw analyseren aan. Er zijn geen automatische betaalde achtergrondaanroepen.

Per analyse maximaal 50 recente likes/dislikes en maximaal 1000 tekens per posttitel en tekst. Geen user-ID, e-mail of bookmarks naar de modelprovider. Zeven voorkeursscores, met modelnaam, tijdstip, confidence en aantal swipes. Database-reservering begrenst op één aanvraag per 10 minuten en 12 per UTC-dag. Mislukte aanvragen tellen mee. De bestaande feedranking blijft gebaseerd op waargenomen swipes; JEV-resultaten zijn voorlopig analyse en worden nog niet als gevalideerd rankingmodel gebruikt.
