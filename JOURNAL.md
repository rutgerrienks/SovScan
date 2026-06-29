# JOURNAL

## 2026-06-29 16:09 — Benchmark-vergelijking eerlijk maken
- **Context:** Vraag over hoe "Vergelijk met:" in het auditresultaat werkt en of de benchmark onderbouwd is.
- **Bevinding:** De `BENCHMARKS`-profielen in `frontend/src/components/SovereigntyAudit.js` zijn hardcoded, handmatige expert-inschattingen (8 dimensiescores per sectorprofiel). De bijgevoegde "Bronnen" (NIS2, AVG, DORA, NEN 7510, ISO 27001) zijn thematische kaders, geen herleiding van de exacte percentages. De UI suggereerde daardoor meer hardheid dan er feitelijk is.
- **Keuze (met gebruiker):** Scope = alleen eerlijk maken (geen nep-dataset, geen volledige rationale).
- **Wijziging:** In het benchmark-beschrijvingsblok ([SovereigntyAudit.js:785-805](frontend/src/components/SovereigntyAudit.js#L785-L805)):
  - Disclaimer-badge toegevoegd: "Indicatief referentieprofiel — expert-inschatting, geen gemeten benchmark."
  - Label "Bronnen:" → "Relevante kaders:" (cijfers volgen niet uit deze bronnen; het zijn contextkaders).
- **Verificatie:** Surgical edit, alleen het beschrijvingsblok geraakt. Nog te doen: visuele check in de draaiende app.

## 2026-06-29 16:40 — Indicatieve SEAL-inschatting bij auditresultaat
- **Context:** Vraag waar de SEAL-levels te zien zijn. Bevinding: "SEAL" stond alleen in de docs-scripts, niet in de app. Literatuur (`literature/Cloud Sovereignty Framework - Implementation guidance.pdf` + `Annex - Sovereignty assessment calculator.xlsx`) legt SEAL uit: EU Cloud Sovereignty Framework, 5 niveaus (SEAL-0..4), per Sovereignty Objective bepaald, overall = laagste niveau (zwakste schakel).
- **Analyse:** Framework-conform (optie A) vereist nieuw meerkeuze-antwoordtype + 8 SOV-objectives + min-aggregatie — een tweede instrument. Gebruiker koos **optie B (SEAL-light)**: indicatieve afleiding uit de bestaande totaalscore, expliciet als niet-conform gelabeld.
- **Wijziging (frontend-only, geen backend/vraagwijziging):** In [SovereigntyAudit.js](frontend/src/components/SovereigntyAudit.js):
  - `SEAL_LEVELS` + `getSealEstimate(overallScore, dimensionScores)` toegevoegd (na `getScoreNarrative`). 5 gelijke banden over 0-100% → SEAL-0..4. Niveaudefinities (NL+EN) overgenomen uit de PDF.
  - SEAL-kaart toegevoegd onder het score-blok: code-badge, niveau-naam, "Wat dit betekent", "Waarom dit niveau" (dynamisch, noemt zwakste dimensie), disclaimer-badge "indicatief, geen framework-conforme meting".
  - Externe link bewust weggelaten (URL niet verifieerbaar); vervangen door brontekst-verwijzing.
- **Verificatie:** `eslint` → 0 errors (3 warnings zijn pre-existing, niet uit deze wijziging). Nog te doen: visuele check in de draaiende app.

## 2026-06-29 17:05 — SEAL-inschatting omgezet naar gated ladder (zwakste schakel)
- **Aanleiding (gebruiker):** De gemiddelde→band-aanpak was misleidend: 30% totaal kon SEAL-1 opleveren terwijl jurisdictionele soevereiniteit 0% is. Verzoek: dimensies koppelen aan SEAL-lagen (jurisdictioneel → SEAL-1, data → SEAL-2, etc.) en het niveau daarop baseren.
- **Aanpak:** Cumulatieve ladder conform het kader-principe "overall SEAL = laagste niveau (zwakste schakel)". Per laag het gemiddelde van de gekoppelde dimensies; een niveau wordt pas bereikt als álle onderliggende lagen ≥ drempel (60%) scoren. Frontend-only — `GET /audits/:id` levert dimensiescores, geen backend/vraagwijziging nodig.
- **Dimensie→laag-mapping (`SEAL_TIERS`, eigen invulling):**
  - SEAL-1 Jurisdictioneel ← Auditability & Compliance
  - SEAL-2 Data ← Data-soevereiniteit
  - SEAL-3 Technologisch ← Vendor Lock-in, Security, Flexibiliteit / maatwerk
  - SEAL-4 Volledig ← Operationele controle, Innovatie & schaalbaarheid
  - Prijs / TCO valt buiten de ladder.
- **Wijziging:** `getSealEstimate` herschreven (laag-scores, pass/fail, hoogste aaneengesloten geslaagde laag, dynamische "waarom" die de blokkerende laag benoemt). SEAL-kaart uitgebreid met een ladder-overzicht (per laag: score + ✓ geborgd / ✗ onvoldoende / — niet aangetoond). Disclaimer aangepast naar "dimensies gekoppeld aan SEAL-lagen, drempel 60%".
- **Openstaand / ter bevestiging:** mapping en drempel (60%) zijn keuzes — gebruiker mag bijsturen. `eslint` → 0 errors. Nog te doen: visuele check in de draaiende app.

## 2026-06-29 20:55 — Greenfield deploy op Azure (subscription 0001478)
- **Opdracht:** container herbouwen en deployen op subscription NL-TT-AZU-SBX-0001478 (was leeg → greenfield). DB-keuze gebruiker: managed PostgreSQL Flexible B1ms.
- **Gebouwd in `rg-sovscan`:** ACR `acrsovscan1478`, images `sovscan-backend`/`sovscan-frontend` (tag `20260629202617` via `az acr build`), PostgreSQL `pg-sovscan-1478` (db `dsh_data`), storage `stsovscan1478`.
- **Schema:** lokaal psql onmogelijk (Deloitte-netwerk blokkeert uitgaand 5432) → init.sql geladen via een Azure Container Instance met file-share. **Bugfix in `backend/init.sql`:** twee seed-regels gebruikten `\'` (MySQL-stijl), wat op PostgreSQL (standard_conforming_strings) faalt; gecorrigeerd naar `''`. Daarna laadde de volledige seed (30 audit_questions over 8 dimensies).
- **Obstakels onderweg:** (1) westeurope AKS-capaciteit vol → Container Apps env in northeurope; (2) Docker Hub pull-fout → postgres-image via `az acr import`; (3) **kapotte tenant-policy** (`e0a6233b-…`, type-mismatch) blokkeert élke `Microsoft.App/containerApps`-creatie op 0001478, niet te fixen met Contributor-rechten.
- **Pivot (met akkoord gebruiker):** Azure **App Service** (Web App for Containers, plan `asp-sovscan` Linux B1) i.p.v. Container Apps. App Service wordt niet door de policy geraakt. Backend `sovscan-backend-1478` (poort 3001, DB-settings, DB_SSL=true), frontend `sovscan-frontend-1478` (poort 8080, BACKEND_URL → backend).
- **Verificatie (live):** backend `/health` → 200; `/api/audit-questions` → 30 vragen; frontend `/` → 200; frontend-proxy `/api` → 30; SEAL-code (`SEAL-0..4`, "Geschat soevereiniteitsniveau") aanwezig in de gedeployde bundle `main.54a1f22a.js`.
- **Versie:** `frontend/package.json` → 1.1.0. NB: de live frontend-bundle is vóór de versie-bump gebouwd (versie wordt niet in de UI getoond; functioneel is dit 1.1.0 incl. SEAL-ladder). Bij een volgende rebuild draagt de image 1.1.0.
- **Artefacten:** `.deploy_tag` → 20260629202617; `URL.md` aangemaakt (URLs + app-logins admin/admin123, sovadmin/sovadmin123; DB-wachtwoord bewust niet in repo).
