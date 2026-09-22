# Techer database via de CLI

CLI 2.117.0 is gecontroleerd en `supabase init` is uitgevoerd. De migratie is nog niet op een database toegepast. De CLI is nog niet ingelogd. Docker is aanwezig maar de Docker-engine draait niet.

Voer vanuit de Techer-map uit:

```powershell
npx --yes supabase@2.117.0 login
npx --yes supabase@2.117.0 projects list
npx --yes supabase@2.117.0 link --project-ref <project-ref>
npx --yes supabase@2.117.0 migration list
npx --yes supabase@2.117.0 db push --dry-run
npx --yes supabase@2.117.0 db push
npx --yes supabase@2.117.0 migration list
```

Log in via de eigen terminal; plaats tokens en databasewachtwoorden niet in chat of Git. Kies het Techer-project expliciet. Als er nog geen project bestaat, maak dit eerst aan in de gewenste Supabase-organisatie. Controleer vóór `db push` de projectkoppeling en de dry-run. Gebruik geen `db reset --linked`.

De migratie maakt profielen, swipes, bookmarks en scores aan, met RLS, serverrechten en een atomaire profiel-write met revisiecontrole. De database is pas ingericht wanneer `db push` slaagt. Test daarna de functies, gebruikersisolatie en revisieconflicten op de echte database.

Dit schakelt de live app nog niet over op cloudopslag. Zie ../INTEGRATIONS.md voor serverconfiguratie en de nog aan te sluiten synchronisatie.
