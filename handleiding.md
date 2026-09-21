<style>
  body { font-family: 'Arial', sans-serif; color: #222; margin: 0; padding: 0; }
  h1 { color: #000; font-size: 28px; margin-bottom: 4px; }
  h2 { color: #000; font-size: 18px; border-bottom: 3px solid #86BC25; padding-bottom: 6px; margin-top: 36px; }
  h3 { color: #333; font-size: 14px; margin-bottom: 8px; }
  .cover { background: #000; color: #fff; padding: 48px 40px 36px; margin: -20px -20px 32px; }
  .cover h1 { color: #fff; font-size: 34px; margin: 0 0 8px; }
  .cover .sub { color: #86BC25; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .cover .desc { color: #aaa; font-size: 13px; }
  .green-bar { background: #86BC25; height: 4px; margin: 12px 0 0; }
  .step-badge { display: inline-block; background: #86BC25; color: #000; font-weight: 900; font-size: 13px; padding: 4px 12px; margin-bottom: 10px; }
  .callout { background: #f5f5f5; border-left: 4px solid #86BC25; padding: 14px 18px; margin: 16px 0; font-size: 13px; }
  .callout.dark { background: #111; color: #fff; border-color: #86BC25; }
  .tip { background: #f0f7e6; border-left: 4px solid #86BC25; padding: 10px 16px; margin: 12px 0; font-size: 13px; }
  .warn { background: #fff3e0; border-left: 4px solid #ff8800; padding: 10px 16px; margin: 12px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
  th { background: #000; color: #fff; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #e5e5e5; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .score-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .score-label { width: 180px; font-size: 12px; font-weight: 700; }
  .score-bar-bg { flex: 1; height: 8px; background: #e5e5e5; }
  .score-bar-fill { height: 100%; }
  .score-pct { width: 38px; font-size: 12px; font-weight: 800; text-align: right; }
  .legend-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .two-col { display: flex; gap: 24px; }
  .two-col > div { flex: 1; }
  .login-box { background: #000; color: #fff; padding: 20px 24px; display: inline-block; min-width: 320px; }
  .login-field { margin-bottom: 12px; }
  .login-field label { display: block; font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
  .login-field .val { border-bottom: 1px solid #444; padding: 4px 0; font-size: 14px; color: #fff; }
  .btn-green { background: #86BC25; color: #000; font-weight: 900; padding: 8px 20px; font-size: 13px; display: inline-block; margin-top: 8px; }
  .question-card { border: 1px solid #ddd; padding: 20px; margin: 16px 0; background: #fff; }
  .question-cluster { font-size: 10px; text-transform: uppercase; color: #86BC25; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px; }
  .question-text { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .question-toelichting { font-size: 12px; color: #666; margin-bottom: 16px; }
  .slider-track { position: relative; height: 6px; background: #e5e5e5; margin: 8px 0 4px; }
  .slider-fill { height: 100%; background: #86BC25; width: 30%; }
  .slider-thumb { position: absolute; top: -7px; left: 30%; width: 20px; height: 20px; background: #86BC25; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
  .slider-labels { display: flex; justify-content: space-between; font-size: 10px; color: #999; margin-top: 2px; }
  .slider-answer { font-size: 11px; font-weight: 700; color: #86BC25; text-align: center; margin-top: 6px; }
  .live-scores { background: #000; color: #fff; padding: 14px; margin-top: 14px; }
  .live-scores h4 { color: #86BC25; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; }
  .ko-tag { background: #ff4444; color: #fff; font-size: 9px; padding: 1px 5px; font-weight: 700; }
  .page-break-before { page-break-before: always; break-before: page; }
  .footer { font-size: 10px; color: #aaa; border-top: 1px solid #e5e5e5; padding-top: 10px; margin-top: 40px; display: flex; justify-content: space-between; }
</style>

<div class="cover">
  <div class="sub">Gebruikershandleiding</div>
  <h1>SovScan</h1>
  <div class="desc">Deloitte Digital Sovereignty Platform · Assessment & Audit Tool</div>
  <div class="green-bar"></div>
</div>

## Inhoudsopgave

1. Inloggen
2. Dashboard — overzicht en navigatie
3. Tool 1: Sovereignty Assessment
4. Assessment resultaten interpreteren
5. Tool 2: Sovereignty Audit
6. Auditresultaten & spinnenweb
7. Uitnodigingen versturen
8. Tips & veelgestelde vragen

---

## 1. Inloggen

Open de tool via uw browser. Er is geen installatie nodig.

**URL:** `https://sovscan-frontend-1473.azurewebsites.net`

<div class="two-col" style="align-items:flex-start; gap:32px;">
<div>

<div class="login-box">
  <div style="font-size:11px;color:#86BC25;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">SovScan · Inloggen</div>
  <div class="login-field">
    <label>Gebruikersnaam</label>
    <div class="val">admin</div>
  </div>
  <div class="login-field">
    <label>Wachtwoord</label>
    <div class="val">••••••••</div>
  </div>
  <div class="btn-green">Inloggen →</div>
</div>

</div>
<div>

**Standaard inloggegevens**

| Rol | Gebruikersnaam | Wachtwoord |
|-----|----------------|------------|
| Consultant | `admin` | `admin123` |
| Beheerder | `sovadmin` | `sovadmin123` |

<div class="tip">💡 Wordt u beheerder? Gebruik het Admin Panel om nieuwe gebruikers aan te maken en rechten te beheren.</div>

</div>
</div>

---

## 2. Dashboard

Na het inloggen ziet u uw persoonlijk dashboard. Hier vindt u:

- **Uw assessments** — alle eerder ingevulde scenario-analyses
- **Uw audits** — alle eerder uitgevoerde soevereiniteitsaudits
- **Uitnodigingen beheren** — deelbare links voor klanten of collega's

Klik op **Nieuw Assessment** of **Nieuwe Audit** om direct te starten.

---

## 3. Tool 1: Sovereignty Assessment

Het Assessment helpt u in minder dan 10 minuten bepalen welk cloud-scenario het beste past bij uw project of organisatie. U beantwoordt 23 vragen met een **schuifknop** (slider). Elke vraag weegt mee in de soevereiniteitsscore van vier scenario's.

### Hoe werkt de slider?

<div class="question-card">
  <div class="question-cluster">Cluster: Harde eisen · Dimensie: Data-soevereiniteit</div>
  <div class="question-text">Bevat de oplossing data met classificatie BBi of hoger (Rijksoverheid rubricering)?</div>
  <div class="question-toelichting">Departementaal Vertrouwelijk / BBi+ mag niet op commerciële cloud.</div>

  <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#999; margin-bottom:6px;">
    <span>Nee (sterk)</span>
    <span style="font-weight:700; color:#222; font-size:13px;">← Beweeg de slider →</span>
    <span>Ja (sterk)</span>
  </div>
  <div class="slider-track">
    <div class="slider-fill"></div>
    <div class="slider-thumb"></div>
  </div>
  <div class="slider-labels">
    <span>0</span><span>25</span><span>50 (Neutraal)</span><span>75</span><span>100</span>
  </div>
  <div class="slider-answer">Huidige stand: Nee (licht) — 30/100</div>

  <div class="live-scores">
    <h4>Live score-preview</h4>
    <div class="score-row">
      <div class="score-label">On-Premise</div>
      <div class="score-bar-bg"><div class="score-bar-fill" style="width:88%;background:#86BC25;"></div></div>
      <div class="score-pct" style="color:#86BC25;">88%</div>
    </div>
    <div class="score-row">
      <div class="score-label">On-Premise Partner</div>
      <div class="score-bar-bg"><div class="score-bar-fill" style="width:74%;background:#86BC25;"></div></div>
      <div class="score-pct" style="color:#86BC25;">74%</div>
    </div>
    <div class="score-row">
      <div class="score-label">EU Cloud</div>
      <div class="score-bar-bg"><div class="score-bar-fill" style="width:100%;background:#ff4444;"></div></div>
      <div class="score-pct"><span class="ko-tag">KO</span></div>
    </div>
    <div class="score-row">
      <div class="score-label">Hyperscaler</div>
      <div class="score-bar-bg"><div class="score-bar-fill" style="width:100%;background:#ff4444;"></div></div>
      <div class="score-pct"><span class="ko-tag">KO</span></div>
    </div>
    <div style="font-size:10px;color:#888;margin-top:8px;">⚠ KO-reden: Commerciële cloud is uitgesloten voor BBi+ data. EU Cloud en Hyperscaler voldoen niet aan rubriceringseisen.</div>
  </div>
</div>

<div class="callout">
<strong>Knock-Out (KO)</strong> — Zodra een antwoord een juridische of fysieke onmogelijkheid blootlegt (bijv. BBi-data op commercial cloud), valt het betreffende scenario direct af. Dit wordt rood weergegeven met een toelichting waarom én wat het alternatief is.
</div>

### Scoreschaal

| Slider-positie | Betekenis |
|----------------|-----------|
| 0 – 25 | Nee (sterk tot licht) |
| 25 – 50 | Neutraal / licht nee |
| 50 – 75 | Neutraal / licht ja |
| 75 – 100 | Ja (licht tot sterk) |

<div class="tip">💡 Twijfelt u? Kies dan de neutrale stand (50). Neutrale antwoorden wegen lichter mee dan uitgesproken keuzes — de tool herkent onzekerheid.</div>

---

<h2 class="page-break-before">4. Assessment resultaten interpreteren</h2>

Na het beantwoorden van alle vragen ziet u een overzichtspagina met scores per scenario.

<div class="callout dark">
  <div style="font-size:10px;color:#86BC25;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Voorbeeld Assessment Resultaat</div>
  <table style="color:#fff;font-size:13px;">
    <tr><td style="padding:6px 0;border-bottom:1px solid #333;color:#ccc;">On-Premise</td><td style="text-align:right;font-weight:bold;color:#86BC25;padding:6px 0;">69%</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #333;color:#ccc;">On-Premise Partner</td><td style="text-align:right;font-weight:bold;color:#86BC25;padding:6px 0;">74% ✓ Hoogste score</td></tr>
    <tr><td style="padding:6px 0;border-bottom:1px solid #333;color:#ccc;">EU Cloud</td><td style="text-align:right;font-weight:bold;color:#ff4444;padding:6px 0;">N/A — KO</td></tr>
    <tr><td style="padding:6px 0;color:#ccc;">Hyperscaler</td><td style="text-align:right;font-weight:bold;color:#ff4444;padding:6px 0;">N/A — KO</td></tr>
  </table>
  <div style="font-size:11px;color:#888;margin-top:10px;">Voorbeeld: overheidsproject met BBi-classificatie en air-gap vereiste.</div>
</div>

Het scenario met de **hoogste score zonder KO** is de aanbevolen richting. U kunt het resultaat opslaan en delen via de knop **Rapport exporteren**.

---

## 5. Tool 2: Sovereignty Audit

De Sovereignty Audit geeft een diepgaand beeld van uw **huidige soevereiniteitsniveau** langs acht dimensies. In plaats van scenario's te vergelijken, scoort u hier de werkelijkheid van vandaag.

Per dimensie geeft u een score van 1 t/m 5:

| Score | Label |
|-------|-------|
| 1 | Niet soeverein |
| 2 | Beperkt soeverein |
| 3 | Gedeeltelijk soeverein |
| 4 | Grotendeels soeverein |
| 5 | Volledig soeverein |

Na invullen kunt u uw profiel vergelijken met een **sectorale benchmark**: Overheid, Financiële sector, Zorg of Commercieel.

---

## 6. Auditresultaten & spinnenweb

De resultaten worden gevisualiseerd in een **radargrafiek (spinnenweb)**. De groene vlak toont uw score; de blauwe stippellijn toont het sectorgemiddelde.

<div style="text-align:center; margin: 24px 0;">

<svg width="560" height="490" viewBox="0 0 600 520" style="display:block;margin:0 auto;">
  <!-- Grid rings -->
  <path d="M 300 140 L 384.9 175.1 L 420 260 L 384.9 344.9 L 300 380 L 215.1 344.9 L 180 260 L 215.1 175.1 Z" fill="none" stroke="#e0e0e0" stroke-width="1.5"/>
  <path d="M 300 180 L 356.6 203.4 L 380 260 L 356.6 316.6 L 300 340 L 243.4 316.6 L 220 260 L 243.4 203.4 Z" fill="none" stroke="#e0e0e0" stroke-width="1"/>
  <path d="M 300 220 L 328.3 231.7 L 340 260 L 328.3 288.3 L 300 300 L 271.7 288.3 L 260 260 L 271.7 231.7 Z" fill="none" stroke="#e0e0e0" stroke-width="1"/>
  <!-- Outer ring -->
  <path d="M 300 100 L 413.1 146.9 L 460 260 L 413.1 373.1 L 300 420 L 186.9 373.1 L 140 260 L 186.9 146.9 Z" fill="none" stroke="#e0e0e0" stroke-width="1.5"/>
  <!-- Spoke lines -->
  <line x1="300" y1="260" x2="300" y2="100" stroke="#e0e0e0" stroke-width="1"/>
  <line x1="300" y1="260" x2="413.1" y2="146.9" stroke="#e0e0e0" stroke-width="1"/>
  <line x1="300" y1="260" x2="460" y2="260" stroke="#e0e0e0" stroke-width="1"/>
  <line x1="300" y1="260" x2="413.1" y2="373.1" stroke="#e0e0e0" stroke-width="1"/>
  <line x1="300" y1="260" x2="300" y2="420" stroke="#e0e0e0" stroke-width="1"/>
  <line x1="300" y1="260" x2="186.9" y2="373.1" stroke="#e0e0e0" stroke-width="1"/>
  <line x1="300" y1="260" x2="140" y2="260" stroke="#e0e0e0" stroke-width="1"/>
  <line x1="300" y1="260" x2="186.9" y2="146.9" stroke="#e0e0e0" stroke-width="1"/>
  <!-- Benchmark (overheid) dashed blue -->
  <path d="M 300 116 L 396.2 163.8 L 420 260 L 367.9 327.9 L 300 404 L 215.1 344.9 L 212 260 L 232.1 192.1 Z" fill="none" stroke="#0066cc" stroke-width="2" stroke-dasharray="6,4" opacity="0.8"/>
  <circle cx="300" cy="116" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <circle cx="396.2" cy="163.8" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <circle cx="420" cy="260" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <circle cx="367.9" cy="327.9" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <circle cx="300" cy="404" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <circle cx="215.1" cy="344.9" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <circle cx="212" cy="260" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <circle cx="232.1" cy="192.1" r="4" fill="#fff" stroke="#0066cc" stroke-width="1.5"/>
  <!-- Data polygon (jouw score) -->
  <path d="M 300 144.8 L 396.2 163.8 L 396 260 L 362.2 322.2 L 300 384.8 L 223.1 336.9 L 228 260 L 229.9 189.9 Z" fill="rgba(134,188,37,0.22)" stroke="#86BC25" stroke-width="2.5"/>
  <!-- Data dots -->
  <circle cx="300" cy="144.8" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <circle cx="396.2" cy="163.8" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <circle cx="396" cy="260" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <circle cx="362.2" cy="322.2" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <circle cx="300" cy="384.8" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <circle cx="223.1" cy="336.9" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <circle cx="228" cy="260" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <circle cx="229.9" cy="189.9" r="5" fill="#86BC25" stroke="#fff" stroke-width="2"/>
  <!-- Ring % labels -->
  <text x="424" y="263" font-size="9" fill="#bbb">100%</text>
  <text x="384" y="263" font-size="9" fill="#bbb">75%</text>
  <text x="344" y="263" font-size="9" fill="#bbb">50%</text>
  <text x="304" y="263" font-size="9" fill="#bbb">25%</text>
  <!-- Axis labels -->
  <!-- i=0 top: Data-soevereiniteit -->
  <text x="300" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#222">Data-soevereiniteit</text>
  <text x="300" y="67" text-anchor="middle" font-size="10" fill="#86BC25">72%</text>
  <!-- i=1 top-right: Security -->
  <text x="448" y="108" text-anchor="start" font-size="11" font-weight="700" fill="#222">Security</text>
  <text x="448" y="122" text-anchor="start" font-size="10" fill="#86BC25">85%</text>
  <!-- i=2 right: Vendor Lock-in -->
  <text x="468" y="255" text-anchor="start" font-size="11" font-weight="700" fill="#222">Vendor Lock-in</text>
  <text x="468" y="269" text-anchor="start" font-size="10" fill="#f5c400">60%</text>
  <!-- i=3 bottom-right: Flexibiliteit -->
  <text x="424" y="382" text-anchor="start" font-size="11" font-weight="700" fill="#222">Flexibiliteit /</text>
  <text x="424" y="395" text-anchor="start" font-size="11" font-weight="700" fill="#222">maatwerk</text>
  <text x="424" y="409" text-anchor="start" font-size="10" fill="#f5c400">55%</text>
  <!-- i=4 bottom: Auditability -->
  <text x="300" y="450" text-anchor="middle" font-size="11" font-weight="700" fill="#222">Auditability &amp;</text>
  <text x="300" y="464" text-anchor="middle" font-size="11" font-weight="700" fill="#222">Compliance</text>
  <text x="300" y="478" text-anchor="middle" font-size="10" fill="#86BC25">78%</text>
  <!-- i=5 bottom-left: Operationele controle -->
  <text x="130" y="382" text-anchor="end" font-size="11" font-weight="700" fill="#222">Operationele</text>
  <text x="130" y="395" text-anchor="end" font-size="11" font-weight="700" fill="#222">controle</text>
  <text x="130" y="409" text-anchor="end" font-size="10" fill="#f5c400">68%</text>
  <!-- i=6 left: Innovatie -->
  <text x="128" y="251" text-anchor="end" font-size="11" font-weight="700" fill="#222">Innovatie &amp;</text>
  <text x="128" y="264" text-anchor="end" font-size="11" font-weight="700" fill="#222">schaalbaarheid</text>
  <text x="128" y="278" text-anchor="end" font-size="10" fill="#ff8800">45%</text>
  <!-- i=7 top-left: Prijs / TCO -->
  <text x="148" y="108" text-anchor="end" font-size="11" font-weight="700" fill="#222">Prijs / TCO</text>
  <text x="148" y="122" text-anchor="end" font-size="10" fill="#f5c400">62%</text>
</svg>

<div style="display:flex;justify-content:center;gap:28px;font-size:12px;margin-top:8px;">
  <span><span class="legend-dot" style="background:#86BC25;"></span>Uw score (voorbeeld)</span>
  <span><span class="legend-dot" style="background:#0066cc;border-radius:0;width:18px;height:3px;margin-top:5px;display:inline-block;"></span>Benchmark: Publieke sector</span>
</div>

</div>

**Scorebetekenis per kleur:**

<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;margin-bottom:12px;">
  <span style="background:#2e7d00;color:#fff;padding:3px 10px;">≥ 80% Volledig soeverein</span>
  <span style="background:#86BC25;color:#fff;padding:3px 10px;">60–79% Grotendeels</span>
  <span style="background:#f5c400;color:#000;padding:3px 10px;">40–59% Gedeeltelijk</span>
  <span style="background:#ff8800;color:#fff;padding:3px 10px;">20–39% Beperkt</span>
  <span style="background:#ff4444;color:#fff;padding:3px 10px;">&lt; 20% Niet soeverein</span>
</div>

In het voorbeeld scoort **Innovatie & schaalbaarheid** het laagst (45%). Dit is een typisch aandachtspunt voor organisaties die kiezen voor maximale controle: eigen infra biedt soevereiniteit, maar vraagt eigen innovatie-inspanning.

---

<h2 class="page-break-before">7. Uitnodigingen versturen</h2>

U kunt klanten of collega's uitnodigen om een assessment of audit in te vullen — **zonder dat zij een account nodig hebben**.

**Stap 1** — Klik op **Uitnodigingen** in het dashboard.

**Stap 2** — Vul een projectnaam in, kies het type (Assessment of Audit) en stel een vervaldatum in.

**Stap 3** — Kopieer de gegenereerde link en stuur deze op via e-mail of Teams.

**Stap 4** — Zodra de ontvanger de tool heeft ingevuld, verschijnt het resultaat automatisch in uw dashboard.

<div class="callout">
<strong>Let op:</strong> De uitnodigingslink is geldig tot de door u ingestelde vervaldatum. Daarna is de link niet meer bruikbaar. U kunt meerdere uitnodigingen tegelijk beheren.
</div>

---

## 8. Tips & veelgestelde vragen

**Hoe sla ik een resultaat op?**
Resultaten worden automatisch opgeslagen na het afronden van een assessment of audit. U vindt ze terug in uw dashboard.

**Kan ik een assessment opnieuw invullen?**
Ja. Start een nieuw assessment via het dashboard. Eerder ingevulde assessments blijven bewaard.

**Wat als ik een vraag niet weet?**
Zet de slider op 50 (neutraal). De tool weet dan dat u onzeker bent en weegt dit antwoord minder zwaar mee.

**Wat zijn KO-criteria precies?**
KO (Knock-Out) criteria zijn harde juridische of technische eisen die een scenario onmogelijk maken — bijv. BBi-data mag wettelijk niet op commercial cloud. Zodra zo'n grens wordt geraakt, valt het scenario af en krijgt u een uitleg en mitigatieadvies.

**Hoe interpreteer ik het verschil met de benchmark?**
Dimensies waarbij uw score significant onder de benchmark ligt, zijn prioriteitsgebieden. Gebruik deze inzichten als input voor een roadmap-gesprek met uw Deloitte-adviseur.

<div class="tip">💡 Gebruik SovScan als gespreksopener in een klantgesprek: vul samen de vragen in en bespreek live de scores en KO-criteria. Dit maakt abstracte compliance-discussies direct concreet.</div>

---

<div class="footer">
  <span>SovScan Gebruikershandleiding · Deloitte Consulting Netherlands</span>
  <span>© 2026 Deloitte Netherlands · Versie juni 2026</span>
</div>
