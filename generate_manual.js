const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');

const markdown = `
# Gebruikershandleiding SovScan
## Sovereignty Assessment Tool

---

## 1. Introductie
Welkom bij de SovScan Sovereignty Assessment Tool. Deze applicatie is ontworpen om organisaties te helpen bij het maken van gefundeerde keuzes tussen verschillende hosting-scenario's op basis van soevereiniteitseisen.

De tool vergelijkt vier scenario's:
- **On-Premise (OP)**
- **On-Premise Partner (OPP)**
- **EU Cloud (EUC)**
- **Hyperscaler (HYP)**

---

## 2. Gebruikershandleiding

### 2.1 Inloggen
Gebruik uw toegewezen inloggegevens om toegang te krijgen tot de tool.
- Standaard gebruiker: \`admin\` / \`admin123\`

### 2.2 Een nieuwe assessment starten
1. Klik op de knop **"Nieuwe Assessment"**.
2. Voer een duidelijke **Project Naam** in.
3. Start de vragenlijst.

### 2.3 De vragenlijst doorlopen
De vragenlijst werkt als een wizard:
- Beantwoord elke vraag met **Ja** of **Nee**.
- Geef per vraag aan hoe belangrijk dit criterium is voor uw project (**Minder**, **Normaal**, of **Extra** belangrijk).
- Gebruik de knoppen **Vorige** en **Volgende** om door uw antwoorden te bladeren.

### 2.4 Resultaten en Rapportage
Na de laatste vraag wordt de score berekend. 
- Scores worden getoond in percentages per scenario.
- Indien een scenario een **Knock-out (KO)** heeft opgelopen, wordt dit aangegeven met "N/A".
- U kunt het rapport direct **printen als PDF** of **versturen via e-mail** naar een adres naar keuze.

---

## 3. Beheerdershandleiding (sovadmin)

### 3.1 Toegang tot het Beheerpaneel
Log in met het admin account:
- Gebruikersnaam: \`sovadmin\`
- Wachtwoord: \`sovadmin123\`

### 3.2 Vragen beheren
In het beheerpaneel kunt u:
- **Nieuwe vragen toevoegen**: Klik op "+ Nieuwe Vraag".
- **Vragen wijzigen**: Klik op "Edit" naast een vraag om de tekst, wegingsfactor of scores aan te passen.
- **Vragen verwijderen**: Klik op "X" om een vraag permanent te verwijderen.

### 3.3 Wegingsfactoren en KO-regels instellen
Bij het bewerken van een vraag kunt u de volgende details aanpassen:
- **Basis Wegingsfactor**: De standaard impact van de vraag op de totaalscore.
- **Scores per scenario**: Hoeveel punten (0-10) een scenario krijgt bij een "Ja" of "Nee" antwoord.
- **Knock-out regels**: Vul de afkortingen (OP, OPP, EUC, HYP) in bij de KO-velden om scenario's direct uit te sluiten bij een specifiek antwoord.

---

## 4. Cloud Toegang en Onderhoud

De tool is geployed in de cloud en bereikbaar via:
- Toegang: **https://sovns62ced3c2h3vk3g9j-sovscan-frontend.functions.fnc.nl-ams.scw.cloud**

Voor lokale ontwikkeling:
- Start de tool: \`./run_local.ps1\`
- Toegang: **http://localhost:8080**
- Stoppen: \`docker-compose down\`

---
*© 2026 SovScan Team - Deloitte Style Implementation*
`;

(async () => {
    try {
        const pdf = await mdToPdf({ content: markdown }, { 
            dest: 'handleiding.pdf',
            pdf_options: {
                format: 'A4',
                margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
                displayHeaderFooter: true,
                headerTemplate: '<span style="font-size: 10px; margin-left: 20px;">SovScan Handleiding</span>',
                footerTemplate: '<span style="font-size: 10px; margin-left: 20px;">Pagina <span class="pageNumber"></span> van <span class="totalPages"></span></span>'
            }
        });
        
        if (pdf) {
            console.log('Handleiding succesvol gegenereerd: handleiding.pdf');
        }
    } catch (err) {
        console.error('Fout bij het genereren van de PDF:', err);
    }
})();
