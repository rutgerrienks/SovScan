// Vernieuwde vragenset voor de Scenario Assessment.
// Wordt door server.js gedetecteerd en (eenmalig) ingeladen wanneer de oude
// set nog in de database staat. Voor nieuwe installs gebruikt init.sql dezelfde
// definities (zie ook backend/init.sql).
//
// Schaal voor scores: 0 (niet passend) – 10 (zeer passend). _ja = score bij
// slider=100 (Ja), _nee = score bij slider=0 (Nee).

module.exports = [
  // ─────────────────── HARDE EISEN (display_order 1-9) ──────────────────────
  // Worden eerst gevraagd: KO-vragen of vragen met grote impact.
  {
    display_order: 1,
    cluster: 'Harde eisen',
    dimensie: 'Data-soevereiniteit',
    question_text: 'Bevat de oplossing data met classificatie BBi of hoger (Rijksoverheid rubricering)?',
    toelichting: 'Departementaal Vertrouwelijk / BBi+ mag niet op commerciële cloud',
    answer_type: 'binary',
    base_factor: 1, dimensie_gewicht: 1.5,
    op_ja: 10, op_nee: 10, opp_ja: 8, opp_nee: 10, euc_ja: 0, euc_nee: 10, hyp_ja: 0, hyp_nee: 10,
    ko_on_ja: 'EUC,HYP',
    ko_reason: 'Commerciële cloud is uitgesloten voor BBi+; EUC en HYP voldoen niet aan rubriceringseisen.',
    ko_mitigation: 'Plaats BBi+ data uitsluitend op rijks-private infra (OP) of een gecertificeerde overheidspartner (OPP).',
    info_text: `Vraagt of er data is met classificatie BBi (Bedrijfsvertrouwelijk) of hoger volgens de Rijksrubricering.
Antwoord Ja → EUC en HYP worden knock-out: commerciële cloud is voor BBi+ niet toegestaan. OP is sterkste keuze, OPP via een rijks-gecertificeerde partner is mogelijk.
Antwoord Nee → reguliere data, geen rijks-cloudbeperking; alle scenario's blijven open.`
  },
  {
    display_order: 2,
    cluster: 'Harde eisen',
    dimensie: 'Netwerk & bereikbaarheid',
    question_text: 'Dient het systeem te functioneren in een air-gapped of netwerk-geïsoleerde omgeving?',
    toelichting: 'SCIF / air-gap maakt cloud-scenario\'s onmogelijk',
    answer_type: 'binary',
    base_factor: 1, dimensie_gewicht: 1.1,
    op_ja: 10, op_nee: 10, opp_ja: 6, opp_nee: 10, euc_ja: 0, euc_nee: 10, hyp_ja: 0, hyp_nee: 10,
    ko_on_ja: 'EUC,HYP',
    ko_reason: 'Cloud-scenario\'s vereisen connectiviteit; air-gap sluit ze uit.',
    ko_mitigation: 'Overweeg gescheiden netsegmenten met data-diodes als de eis "isolatie" eigenlijk "geen uitgaand verkeer" is.',
    info_text: `Werking moet ook in een volledig geïsoleerd of air-gapped netwerk gegarandeerd zijn (defensie/SCIF).
Antwoord Ja → EUC en HYP worden knock-out (vereisen connectiviteit). OP is dan logisch, OPP haalbaar onder strikte voorwaarden.
Antwoord Nee → connectiviteit is beschikbaar; alle scenario's blijven open.`
  },
  {
    display_order: 3,
    cluster: 'Harde eisen',
    dimensie: 'Hosting LLM',
    question_text: 'Moet de LLM lokaal/zelf-gehost draaien zodat prompts en responses uw netwerk niet verlaten?',
    toelichting: 'Lokaal hosten sluit managed cloud LLM-endpoints uit',
    answer_type: 'binary',
    base_factor: 1, dimensie_gewicht: 1.5,
    op_ja: 10, op_nee: 10, opp_ja: 8, opp_nee: 10, euc_ja: 0, euc_nee: 10, hyp_ja: 0, hyp_nee: 10,
    ko_on_ja: 'EUC,HYP',
    ko_reason: 'Managed LLM-endpoints (Azure OpenAI, Bedrock, Vertex) sturen prompts naar de leverancier.',
    ko_mitigation: 'Open-weight modellen (Llama, Mistral) op eigen GPU\'s of bij EU-partner kunnen alsnog haalbaar zijn.',
    info_text: `Eis dat de prompts/responses het eigen netwerk niet verlaten (data-exfiltratie-risico, IE-bescherming).
Antwoord Ja → EUC en HYP worden knock-out: hun managed model-endpoints lezen alle prompts. OP scoort het hoogst, OPP volgt.
Antwoord Nee → managed model-endpoints zijn acceptabel; HYP en EUC blijven sterke kandidaten.`
  },
  {
    display_order: 4,
    cluster: 'Harde eisen',
    dimensie: 'Vendor-lock-in',
    question_text: 'Moet de leverancier juridisch buiten de invloedssfeer van de US CLOUD Act / OFAC-sancties vallen?',
    toelichting: 'Geopolitieke onafhankelijkheid (EU-soevereiniteit als hoeksteen)',
    answer_type: 'binary',
    base_factor: 1, dimensie_gewicht: 1.5,
    op_ja: 10, op_nee: 10, opp_ja: 10, opp_nee: 10, euc_ja: 10, euc_nee: 10, hyp_ja: 0, hyp_nee: 10,
    ko_on_ja: 'HYP',
    ko_reason: 'AWS, Azure, GCP en OpenAI vallen onder de US CLOUD Act; data kan in theorie worden gevorderd.',
    ko_mitigation: 'EU-only sovereign cloud (EUC) of EU-partner met confidentialiteitsclausules.',
    info_text: `Eis dat de leverancier juridisch buiten de Amerikaanse rechtsmacht valt (CLOUD Act, OFAC).
Antwoord Ja → HYP wordt knock-out (AWS/Azure/GCP/OpenAI vallen onder US-jurisdictie). OP, OPP en EUC voldoen.
Antwoord Nee → US-jurisdictie is geen blokkade; alle scenario's blijven open.`
  },
  {
    display_order: 5,
    cluster: 'Harde eisen',
    dimensie: 'Data-soevereiniteit',
    question_text: 'Mag persoonsdata de grenzen van de EER niet verlaten (AVG art. 44–49)?',
    toelichting: 'Schrems II / DPF-risico voor doorgifte naar VS',
    base_factor: 1, dimensie_gewicht: 1.5,
    op_ja: 10, op_nee: 10, opp_ja: 10, opp_nee: 10, euc_ja: 10, euc_nee: 10, hyp_ja: 2, hyp_nee: 10,
    ko_mitigation: 'Gebruik HYP-EU-regio met SCC + Data Privacy Framework, of kies EUC voor maximale juridische zekerheid.',
    info_text: `Persoonsgegevens mogen de EER niet verlaten (AVG art. 44–49, Schrems II-context).
Antwoord Ja → HYP scoort zwaar onvoldoende vanwege CLOUD Act-risico, ook in EU-regio's. OP/OPP/EUC voldoen volledig.
Antwoord Nee → er is een geldige doorgiftegrondslag (DPF/SCC); alle scenario's blijven open.`
  },
  {
    display_order: 6,
    cluster: 'Harde eisen',
    dimensie: 'Prijs / TCO',
    question_text: 'Is er ruimte voor een CAPEX-investering in eigen hardware/licenties?',
    toelichting: 'Zonder CAPEX-budget is on-prem niet realistisch',
    answer_type: 'binary',
    base_factor: 1, dimensie_gewicht: 0.7,
    op_ja: 10, op_nee: 0, opp_ja: 8, opp_nee: 8, euc_ja: 10, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    ko_on_nee: 'OP',
    ko_reason: 'OP vereist hardware-aankoop; zonder CAPEX is dat niet uitvoerbaar.',
    ko_mitigation: 'OPP biedt eigen hardware via een partner met opex-model.',
    info_text: `Beschikbaarheid van investeringsbudget voor hardware en licenties.
Antwoord Ja → OP wordt aantrekkelijk (terugverdienmodel); alle andere scenario's blijven open.
Antwoord Nee → OP wordt knock-out (geen hardware-investering mogelijk); OPP, EUC en HYP zijn opex-gestuurd en blijven beschikbaar.`
  },
  {
    display_order: 7,
    cluster: 'Harde eisen',
    dimensie: 'Operationele controle',
    question_text: 'Heeft de organisatie een intern platform-/AI-team dat 24×7 beheer kan voeren?',
    toelichting: 'Zonder eigen team is OP onhoudbaar',
    answer_type: 'binary',
    base_factor: 1, dimensie_gewicht: 1.0,
    op_ja: 10, op_nee: 0, opp_ja: 8, opp_nee: 8, euc_ja: 8, euc_nee: 8, hyp_ja: 6, hyp_nee: 10,
    ko_on_nee: 'OP',
    ko_reason: 'On-prem AI vereist 24×7 expertise voor incidenten, patches en GPU-beheer.',
    ko_mitigation: 'OPP plaatst beheer bij de partner; managed services (EUC/HYP) ontzorgen volledig.',
    info_text: `Aanwezigheid van een eigen team voor 24×7 platform- en AI-beheer.
Antwoord Ja → OP is realistisch; OPP, EUC en HYP blijven ook open.
Antwoord Nee → OP wordt knock-out; managed scenario's (EUC/HYP) of partner-beheer (OPP) zijn dan logisch.`
  },

  // ─────────────────── DATA & JURIDISCH (display_order 10-19) ──────────────
  {
    display_order: 10,
    cluster: 'Data & Juridisch',
    dimensie: 'Security',
    question_text: 'Moeten encryptiesleutels onder volledige eigen controle blijven (BYOK of HYOK)?',
    toelichting: 'Hold-Your-Own-Key sluit gedeelde KMS-omgevingen uit',
    base_factor: 1, dimensie_gewicht: 1.5,
    op_ja: 10, op_nee: 8, opp_ja: 8, opp_nee: 8, euc_ja: 6, euc_nee: 10, hyp_ja: 4, hyp_nee: 10,
    ko_mitigation: 'Confidential Computing (Azure/AWS Nitro) en EU sovereign cloud bieden HYOK-varianten.',
    info_text: `Eis op volledige eigen controle over encryptiesleutels: Bring-Your-Own-Key (BYOK) of Hold-Your-Own-Key (HYOK).
Antwoord Ja → OP en OPP scoren hoog (volledige controle); EUC redelijk (sovereign HYOK-opties); HYP zwakker omdat CLOUD Act-risico ook met BYOK speelt.
Antwoord Nee → standaard provider-managed encryptie volstaat; alle scenario's gelijkwaardig.`
  },
  {
    display_order: 11,
    cluster: 'Data & Juridisch',
    dimensie: 'Auditability & Compliance',
    question_text: 'Valt de oplossing onder NIS2, DORA, NEN-7510, BIO of een andere sectorspecifieke compliance-eis?',
    toelichting: 'Sectorspecifieke regelgeving dwingt extra audit- en locatie-eisen af',
    base_factor: 1, dimensie_gewicht: 1.3,
    op_ja: 10, op_nee: 8, opp_ja: 8, opp_nee: 8, euc_ja: 8, euc_nee: 8, hyp_ja: 4, hyp_nee: 8,
    ko_mitigation: 'Kies een leverancier met aantoonbare certificering voor uw sector.',
    info_text: `Sectorspecifieke regelgeving: NIS2 (essentiële diensten), DORA (financieel), NEN-7510 (zorg), BIO (overheid), PCI-DSS, etc.
Antwoord Ja → strengere audit- en locatie-eisen; OP/OPP/EUC scoren hoog vanwege directe controle; HYP scoort lager (verantwoordingsketen langer).
Antwoord Nee → reguliere AVG/ISO-eisen volstaan.`
  },
  {
    display_order: 12,
    cluster: 'Data & Juridisch',
    dimensie: 'Auditability & Compliance',
    question_text: 'Is de oplossing geclassificeerd als high-risk AI-systeem onder de EU AI Act?',
    toelichting: 'High-risk AI vereist explainability, logging en human-oversight (art. 13/14)',
    base_factor: 1, dimensie_gewicht: 1.3,
    op_ja: 10, op_nee: 8, opp_ja: 8, opp_nee: 8, euc_ja: 8, euc_nee: 10, hyp_ja: 4, hyp_nee: 10,
    ko_mitigation: 'EU AI Act-conforme leveranciers documenteren modelkaarten en bias-tests; eis dit contractueel.',
    info_text: `Classificatie als high-risk AI-systeem onder de EU AI Act (art. 6 + Annex III: o.a. HR, kritieke infra, rechtshandhaving).
Antwoord Ja → strenge eisen aan logging, explainability en human oversight. OP/OPP/EUC scoren hoog (directe controle); HYP zwakker omdat black-box modellen lastiger te verklaren zijn.
Antwoord Nee → reguliere AI-eisen volstaan.`
  },

  // ─────────────────── SECURITY (display_order 20-29) ──────────────────────
  {
    display_order: 20,
    cluster: 'Security',
    dimensie: 'Security',
    question_text: 'Zijn out-of-the-box security-diensten (WAF, DDoS-protectie, IAM, KMS) een vereiste?',
    toelichting: 'Voorkeur voor kant-en-klare security boven zelf bouwen',
    base_factor: 1, dimensie_gewicht: 1.5,
    op_ja: 2, op_nee: 10, opp_ja: 6, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Voorkeur voor kant-en-klare security-diensten in plaats van zelf bouwen.
Antwoord Ja → HYP biedt het rijkste portfolio; EUC volgt; OPP afhankelijk van partner; OP scoort laag (zelf inrichten).
Antwoord Nee → eigen security-team bouwt het zelf; OP en OPP blijven aantrekkelijk.`
  },

  // ─────────────────── AUDITABILITY (display_order 30-39) ──────────────────
  {
    display_order: 30,
    cluster: 'Auditability',
    dimensie: 'Auditability & Compliance',
    question_text: 'Moet er een gecertificeerd audit-rapport (SOC2 / ISO 27001) beschikbaar zijn vóór go-live?',
    toelichting: 'Snelle audit-rapporten pleiten voor cloud-leveranciers',
    base_factor: 1, dimensie_gewicht: 1.3,
    op_ja: 2, op_nee: 10, opp_ja: 4, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Behoefte aan een gecertificeerd auditrapport vóór go-live (SOC2, ISO 27001).
Antwoord Ja → HYP en EUC leveren bestaande certificeringen; OP/OPP vereisen een nieuw, kostbaar audittraject.
Antwoord Nee → audit kan in eigen tempo; alle scenario's blijven open.`
  },
  {
    display_order: 31,
    cluster: 'Auditability',
    dimensie: 'Auditability & Compliance',
    question_text: 'Moeten logging, metrics en gebruikerstatistieken out-of-the-box beschikbaar zijn?',
    toelichting: 'Volwaardige observability-stack inbegrepen',
    base_factor: 1, dimensie_gewicht: 1.3,
    op_ja: 2, op_nee: 10, opp_ja: 6, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Eis op kant-en-klare observability-stack (logging, metrics, gebruikersinzicht).
Antwoord Ja → HYP en EUC bieden een volwaardige stack; OP/OPP vragen eigen tooling (Prometheus, Grafana, ELK).
Antwoord Nee → eigen monitoring volstaat; alle scenario's blijven haalbaar.`
  },

  // ─────────────────── CONTINUITEIT (display_order 40-49) ──────────────────
  {
    display_order: 40,
    cluster: 'Continuïteit',
    dimensie: 'Uptime / Weerbaarheid',
    question_text: 'Moet het product een uptime van 99,9% of hoger halen (≤ ~9 uur downtime/jaar)?',
    toelichting: 'Hoge uptime is moeilijk haalbaar zonder redundante locaties',
    base_factor: 1, dimensie_gewicht: 1.1,
    op_ja: 2, op_nee: 10, opp_ja: 8, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    ko_mitigation: 'OP haalt 99,9% alleen met dual-site DR; dat verdubbelt CAPEX.',
    info_text: `SLA-eis van 99,9% uptime of hoger (max ~9 uur downtime per jaar).
Antwoord Ja → HYP scoort hoog (multi-AZ standaard); EUC volgt; OPP haalbaar via partner; OP scoort laag zonder dual-site DR.
Antwoord Nee → ~99,5% (ca. 43u/jaar) is on-prem prima haalbaar; alle scenario's open.`
  },
  {
    display_order: 41,
    cluster: 'Continuïteit',
    dimensie: 'Uptime / Weerbaarheid',
    question_text: 'Is een Recovery Time Objective (RTO) van minder dan 4 uur een harde eis?',
    toelichting: 'Korte RTO vereist auto-failover-infrastructuur',
    base_factor: 1, dimensie_gewicht: 1.1,
    op_ja: 4, op_nee: 10, opp_ja: 6, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Hersteltijd na incident moet onder vier uur blijven.
Antwoord Ja → HYP en EUC bieden auto-failover; OPP haalbaar met goede partner-SLA; OP vereist forse dual-site investering.
Antwoord Nee → langere RTO acceptabel; OP blijft prima haalbaar.`
  },
  {
    display_order: 42,
    cluster: 'Continuïteit',
    dimensie: 'Netwerk & bereikbaarheid',
    question_text: 'Heeft de oplossing een latency-budget van minder dan 50 ms (realtime/edge)?',
    toelichting: 'Lage latency pleit voor on-prem of edge-deployment',
    base_factor: 1, dimensie_gewicht: 1.1,
    op_ja: 10, op_nee: 8, opp_ja: 8, opp_nee: 8, euc_ja: 6, euc_nee: 10, hyp_ja: 4, hyp_nee: 10,
    info_text: `Realtime-toepassing met hard latency-budget (<50 ms eind-tot-eind).
Antwoord Ja → OP scoort hoog (lokale draai); OPP volgt; EUC/HYP zwakker door netwerklatency en gedeelde infra.
Antwoord Nee → seconden-latency acceptabel; alle scenario's gelijkwaardig.`
  },

  // ─────────────────── VENDOR LOCK-IN (display_order 50-59) ────────────────
  {
    display_order: 50,
    cluster: 'Vendor lock-in',
    dimensie: 'Vendor-lock-in',
    question_text: 'Moet u binnen 12 maanden van leverancier kunnen wisselen, inclusief data en fine-tuned modellen?',
    toelichting: 'Migreerbaarheid + portabiliteit van modelgewichten en data',
    base_factor: 1, dimensie_gewicht: 1.2,
    op_ja: 10, op_nee: 10, opp_ja: 6, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 2, hyp_nee: 10,
    ko_mitigation: 'Eis open formaten (ONNX, GGUF) en exit-clausules in het contract.',
    info_text: `Strategische exitruimte: binnen 12 maanden naar een andere leverancier, mét data en fine-tuned modellen.
Antwoord Ja → OP scoort hoogst; EUC redelijk; OPP afhankelijk van partner-contract; HYP zwak (closed-source modellen niet portabel).
Antwoord Nee → geen exit-druk; alle scenario's blijven open.`
  },
  {
    display_order: 51,
    cluster: 'Vendor lock-in',
    dimensie: 'Vendor-lock-in',
    question_text: 'Moet uitsluitend gebruik worden gemaakt van open-weight of open-source LLM-modellen?',
    toelichting: 'Open weights voorkomen lock-in op de modellaag',
    base_factor: 1, dimensie_gewicht: 1.2,
    op_ja: 10, op_nee: 10, opp_ja: 10, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 2, hyp_nee: 10,
    info_text: `Eis dat alleen LLM's met open weights/code worden ingezet (Llama, Mistral, etc.).
Antwoord Ja → OP/OPP scoren hoog; EUC redelijk; HYP zwak omdat de meest gebruikte modellen daar gesloten zijn.
Antwoord Nee → ook proprietary modellen toegestaan; HYP en EUC worden sterker.`
  },

  // ─────────────────── OPERATIONEEL (display_order 60-69) ──────────────────
  {
    display_order: 60,
    cluster: 'Operationeel',
    dimensie: 'Community / vaardigheden',
    question_text: 'Is volwaardige enterprise-support (24×7 SLA, named TAM) een vereiste?',
    toelichting: 'Eis op gegarandeerde respons en escalatiepad',
    base_factor: 1, dimensie_gewicht: 1.0,
    op_ja: 2, op_nee: 10, opp_ja: 8, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Eis op enterprise-support: 24×7 SLA, named Technical Account Manager.
Antwoord Ja → HYP scoort hoog, EUC volgt, OPP afhankelijk van partner; OP scoort laag (zelf doen of community).
Antwoord Nee → community/best-effort support volstaat; OP en OPP blijven open.`
  },
  {
    display_order: 61,
    cluster: 'Operationeel',
    dimensie: 'Community / vaardigheden',
    question_text: 'Is een omvangrijke community / marketplace voor integraties belangrijk?',
    toelichting: 'Grote ecosystemen versnellen ontwikkeling',
    base_factor: 1, dimensie_gewicht: 1.0,
    op_ja: 2, op_nee: 10, opp_ja: 4, opp_nee: 10, euc_ja: 6, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Beschikbaarheid van een actieve community en marketplace voor integraties/extensies.
Antwoord Ja → HYP en EUC profiteren van het grootste ecosysteem; OP/OPP minder.
Antwoord Nee → niche-oplossing acceptabel; alle scenario's gelijkwaardig.`
  },
  {
    display_order: 62,
    cluster: 'Operationeel',
    dimensie: 'Integratie-complexiteit',
    question_text: 'Wilt u uitsluitend kant-en-klare managed services (zonder eigen platform-engineering)?',
    toelichting: 'Managed-only sluit zelfbeheerde infra uit',
    base_factor: 1, dimensie_gewicht: 1.0,
    op_ja: 0, op_nee: 10, opp_ja: 4, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    ko_on_ja: 'OP',
    ko_reason: 'OP vereist altijd eigen platform-engineering en is daarom onverenigbaar met managed-only.',
    ko_mitigation: 'OPP biedt managed on-prem als compromis.',
    info_text: `Voorkeur voor uitsluitend managed/SaaS-componenten — geen eigen platform-engineering.
Antwoord Ja → OP wordt knock-out; HYP scoort hoog, EUC volgt, OPP haalbaar via partner.
Antwoord Nee → ruimte voor zelfbeheer; OP en OPP blijven aantrekkelijk.`
  },

  // ─────────────────── AGILITY (display_order 70-79) ───────────────────────
  {
    display_order: 70,
    cluster: 'Agility',
    dimensie: 'Flexibiliteit / maatwerk',
    question_text: 'Vereist de oplossing veel maatwerk op infrastructuur- of platformniveau?',
    toelichting: 'Maatwerk pleit voor scenario\'s met meer regie',
    base_factor: 1, dimensie_gewicht: 0.8,
    op_ja: 10, op_nee: 10, opp_ja: 10, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 4, hyp_nee: 10,
    info_text: `Mate waarin infra en platform aanpasbaar moeten zijn (geen standaard-SaaS).
Antwoord Ja → OP/OPP scoren hoog (volledige controle); EUC redelijk; HYP scoort laag (standaard-services).
Antwoord Nee → standaard volstaat; HYP en EUC worden sterker en goedkoper.`
  },
  {
    display_order: 71,
    cluster: 'Agility',
    dimensie: 'Ontwikkelsnelheid',
    question_text: 'Moet een werkend MVP binnen 3 maanden live zijn?',
    toelichting: 'Korte time-to-market begunstigt managed cloud',
    base_factor: 1, dimensie_gewicht: 0.8,
    op_ja: 0, op_nee: 10, opp_ja: 4, opp_nee: 10, euc_ja: 6, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Tijdsdruk om binnen 3 maanden live te gaan met een MVP.
Antwoord Ja → HYP wint duidelijk; EUC volgt; OP en OPP zijn niet realistisch (hardware-lead time, opbouw stack).
Antwoord Nee → ruimte voor een grondiger OP/OPP-traject met meer regie.`
  },
  {
    display_order: 72,
    cluster: 'Agility',
    dimensie: 'Innovatie & schaalbaarheid',
    question_text: 'Is directe toegang tot de allernieuwste foundation-models (GPT-4o, Claude, Gemini) vereist?',
    toelichting: 'Hyperscalers krijgen nieuwe modellen het snelst',
    base_factor: 1, dimensie_gewicht: 0.8,
    op_ja: 2, op_nee: 10, opp_ja: 4, opp_nee: 10, euc_ja: 6, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Behoefte aan de meest recente proprietary modellen (GPT-4o, Claude, Gemini).
Antwoord Ja → HYP wint (krijgt eerst); EUC volgt op afstand; OP/OPP lopen typisch maanden tot jaren achter (alleen open-source modellen).
Antwoord Nee → open-source/zelf-gehoste modellen volstaan; OP en OPP blijven sterk in beeld.`
  },
  {
    display_order: 73,
    cluster: 'Agility',
    dimensie: 'Innovatie & schaalbaarheid',
    question_text: 'Is automatische op- en afschaling bij onverwachte verkeerspieken gewenst?',
    toelichting: 'Auto-scaling is sterker bij cloud-scenario\'s',
    base_factor: 1, dimensie_gewicht: 0.8,
    op_ja: 2, op_nee: 10, opp_ja: 6, opp_nee: 10, euc_ja: 8, euc_nee: 10, hyp_ja: 10, hyp_nee: 10,
    info_text: `Behoefte aan elastische op- en afschaling bij wisselende belasting.
Antwoord Ja → HYP en EUC bieden auto-scaling out-of-the-box; OP/OPP vergen overcapaciteit of handmatige uitbreiding.
Antwoord Nee → vaste capaciteit volstaat; OP en OPP blijven prima haalbaar.`
  },

  // ─────────────────── COMPUTE & KOSTEN (display_order 80-89) ──────────────
  {
    display_order: 80,
    cluster: 'Compute & Kosten',
    dimensie: 'Prijs / TCO',
    question_text: 'Is de inference-/trainingsbelasting hoog en continu (24×7 zware GPU-load)?',
    toelichting: 'Bij continu hoge load wordt eigen hardware (CAPEX) goedkoper dan pay-per-GPU-uur',
    base_factor: 1, dimensie_gewicht: 0.7,
    op_ja: 10, op_nee: 8, opp_ja: 8, opp_nee: 8, euc_ja: 4, euc_nee: 10, hyp_ja: 2, hyp_nee: 10,
    ko_mitigation: 'Reserved instances of dedicated GPU-pools verlagen cloud-TCO bij hoge utilisatie.',
    info_text: `Continu hoge inference- of trainingsbelasting (24×7 GPU's vol).
Antwoord Ja → eigen hardware verdient zich snel terug: OP en OPP scoren hoog; cloud-pay-per-GPU-uur (EUC/HYP) wordt onbetaalbaar.
Antwoord Nee → wisselende of lichte load; HYP/EUC blijven kostenefficiënt door pay-per-use.`
  },
  {
    display_order: 81,
    cluster: 'Compute & Kosten',
    dimensie: 'Prijs / TCO',
    question_text: 'Verwerkt de oplossing grote datavolumes met veel uitgaand verkeer (egress) buiten het cloudplatform?',
    toelichting: 'Egress-fees maken HYP duur bij dataverplaatsing',
    base_factor: 1, dimensie_gewicht: 0.7,
    op_ja: 10, op_nee: 8, opp_ja: 8, opp_nee: 10, euc_ja: 6, euc_nee: 10, hyp_ja: 2, hyp_nee: 10,
    info_text: `Hoge dataverwerking met veel uitgaand verkeer (egress) richting on-prem of andere clouds.
Antwoord Ja → HYP wordt fors duurder door egress-fees; OP en OPP scoren hoog (geen egress-kosten); EUC redelijk (vaak lagere tarieven).
Antwoord Nee → data blijft binnen het platform; alle scenario's gelijkwaardig op kosten.`
  },
  {
    display_order: 82,
    cluster: 'Compute & Kosten',
    dimensie: 'Prijs / TCO',
    question_text: 'Is een voorspelbare maandprijs (max ~10% variatie) een vereiste?',
    toelichting: 'Vaste licentie/CAPEX-afschrijving vs pay-per-use',
    base_factor: 1, dimensie_gewicht: 0.7,
    op_ja: 10, op_nee: 10, opp_ja: 10, opp_nee: 10, euc_ja: 4, euc_nee: 10, hyp_ja: 2, hyp_nee: 10,
    info_text: `Behoefte aan voorspelbare maandlasten (max ~10% variatie).
Antwoord Ja → OP en OPP bieden vaste licentie/afschrijvingskosten en scoren hoog; EUC en HYP scoren laag door pay-per-use.
Antwoord Nee → variabele kosten zijn acceptabel; alle scenario's blijven open.`
  }
];
