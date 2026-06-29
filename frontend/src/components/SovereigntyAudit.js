import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const DEFAULT_MID_LABELS = {
  2: 'Meer afhankelijk van leverancier',
  3: 'Gedeelde regie',
  4: 'Meer regie in eigen organisatie',
};

const SOVEREIGNTY_EXPLANATIONS = {
  1: 'Lage soevereiniteit: sterke externe afhankelijkheid en beperkte eigen controle.',
  2: 'Beperkte soevereiniteit: enkele waarborgen, maar regie ligt vooral extern.',
  3: 'Gemengd beeld: basismaatregelen aanwezig, met gedeelde regie en resterende afhankelijkheden.',
  4: 'Hoge soevereiniteit: regie ligt grotendeels intern met aantoonbare borging.',
  5: 'Zeer hoge soevereiniteit: maximale eigen regie, met sterke juridische en technische borging.',
};

const getExampleContext = (dimensie, score) => {
  const level = score <= 2 ? 'low' : score === 3 ? 'mid' : 'high';
  const contexts = {
    'Data-soevereiniteit': {
      low: 'Voorbeelden: wetgeving buiten EU (bijv. CLOUD Act), tooling zoals standaard hyperscaler-opslag, implementatie met vrije datadoorgifte buiten EU.',
      mid: 'Voorbeelden: AVG met SCC/TIA, tooling met EU-regio en basis sleutelbeheer, implementatie met gedeelde controle op datalokatie.',
      high: 'Voorbeelden: AVG + BIO/NIS2-conforme borging, tooling zoals HYOK/KMS onder eigen beheer, implementatie met datalokalisatie in NL/EU en streng doorgiftebeleid.',
    },
    'Security': {
      low: 'Voorbeelden: beperkte harde eisen uit BIO/ISO, tooling vooral vendor-default security, implementatie zonder aantoonbare hardening/segmentatie.',
      mid: 'Voorbeelden: baseline op BIO/ISO 27001, tooling zoals SIEM/EDR + basis IAM, implementatie met gedeelde monitoring en periodieke scans.',
      high: 'Voorbeelden: BIO/NIS2 plus aantoonbare controls, tooling zoals confidential computing, PAM en centrale SIEM/SOAR, implementatie met least-privilege en continue control testing.',
    },
    'Vendor Lock-in': {
      low: 'Voorbeelden: contractueel beperkte exit, tooling met proprietary API\'s, implementatie met hoge migratiekosten/egress-dependentie.',
      mid: 'Voorbeelden: gedeeltelijke exit-clausules, tooling mix open + proprietary, implementatie met migratie mogelijk maar complex.',
      high: 'Voorbeelden: expliciete exit- en portabiliteitsafspraken, tooling op open standaarden (bijv. Kubernetes/Terraform), implementatie met periodiek geteste exit-oefeningen.',
    },
    'Flexibiliteit / maatwerk': {
      low: 'Voorbeelden: leverancierkaders dominant, tooling vooral managed black-box diensten, implementatie met weinig architectuurruimte.',
      mid: 'Voorbeelden: deels maatwerk toegestaan, tooling met PaaS + eigen componenten, implementatie met compromis tussen snelheid en autonomie.',
      high: 'Voorbeelden: veel architectuurvrijheid, tooling met IaC en platform onder eigen regie, implementatie met modulair ontwerp en vervangbare componenten.',
    },
    'Auditability & Compliance': {
      low: 'Voorbeelden: vooral vendor-attestaties, tooling met beperkte logging/audittrail, implementatie met lage forensische reproduceerbaarheid.',
      mid: 'Voorbeelden: AVG/sectornormen deels aantoonbaar, tooling met centrale logging + periodieke rapportages, implementatie met gedeelde auditverantwoordelijkheid.',
      high: 'Voorbeelden: sterke aantoonbaarheid tegen AVG/BIO/NIS2, tooling met immutabele logs en volledige traceability, implementatie met zelfstandige audit- en forensische capaciteit.',
    },
    'Operationele controle': {
      low: 'Voorbeelden: operationele afhankelijkheid van leverancier, tooling vooral extern beheerd, implementatie met beperkte eigen runbooks/kennisborging.',
      mid: 'Voorbeelden: gedeelde operatie, tooling met gezamenlijke beheerprocessen, implementatie met deels intern incident/change management.',
      high: 'Voorbeelden: interne regie op SRE/operations, tooling zoals eigen monitoring en deployment pipelines, implementatie met geborgde continuiteit en duidelijke escalatiepaden.',
    },
    'Innovatie & schaalbaarheid': {
      low: 'Voorbeelden: innovatie gebonden aan vendor-roadmap, tooling beperkt aanpasbaar, implementatie met trage iteratie.',
      mid: 'Voorbeelden: innovatie deels zelfstandig, tooling met standaard platformdiensten + extensies, implementatie met periodieke releasecycli.',
      high: 'Voorbeelden: hoge innovatiesnelheid onder eigen regie, tooling met CI/CD en reproduceerbare omgevingen, implementatie met snelle experimentatie en gecontroleerde opschaling.',
    },
    'Prijs / TCO': {
      low: 'Voorbeelden: beperkte kostentransparantie, tooling zonder gedetailleerde cost observability, implementatie met onvoorspelbare egress/support-kosten.',
      mid: 'Voorbeelden: basis FinOps en budgetguardrails, tooling met standaard cost dashboards, implementatie met gedeeltelijk voorspelbare maandlasten.',
      high: 'Voorbeelden: contractueel voorspelbare kosten en governance, tooling met geavanceerde FinOps/showback, implementatie met structureel beheersbare TCO en periodieke optimalisatie.',
    },
  };

  const byDimension = contexts[dimensie] || {
    low: 'Voorbeelden: beperkte juridische en technische borging, tooling vooral vendor-gedreven, implementatie met hoge externe afhankelijkheid.',
    mid: 'Voorbeelden: basis borging aanwezig, tooling en regie gedeeld, implementatie met gemengd soevereiniteitsprofiel.',
    high: 'Voorbeelden: sterke juridische/technische borging, tooling onder eigen regie, implementatie met aantoonbare autonomie.',
  };

  return byDimension[level];
};

const getMidLabelsByDimension = (dimensie) => {
  if (dimensie === 'Data-soevereiniteit') {
    return {
      2: 'EU-regio deels mogelijk, maar leverancier bepaalt locatie en doorgifte',
      3: 'Data vooral in EU, met gedeelde controle op locatie en verwerking',
      4: 'Data primair in NL/EU met strikte, aantoonbare doorgiftebeheersing',
    };
  }
  if (dimensie === 'Security') {
    return {
      2: 'Basale security door leverancier, beperkt zelfstandig aantoonbaar',
      3: 'Standaard controls met gedeelde verantwoordelijkheid',
      4: 'Versterkte controls met grotendeels eigen toetsing en regie',
    };
  }
  if (dimensie === 'Vendor Lock-in') {
    return {
      2: 'Sterke afhankelijkheid van proprietary diensten en tooling',
      3: 'Migratie is mogelijk, maar met merkbare inspanning en kosten',
      4: 'Portabiliteit grotendeels geborgd met open standaarden en exit-afspraken',
    };
  }
  if (dimensie === 'Flexibiliteit / maatwerk' || dimensie === 'Innovatie & schaalbaarheid') {
    return {
      2: 'Aanpassingen vooral binnen vendor-kaders',
      3: 'Maatwerk mogelijk, maar met functionele beperkingen',
      4: 'Ruime aanpasbaarheid onder eigen architectuurkeuzes',
    };
  }
  if (dimensie === 'Auditability & Compliance') {
    return {
      2: 'Compliance steunt vooral op leverancierverklaringen',
      3: 'Periodieke rapportages aanwezig, met beperkte eigen auditdiepgang',
      4: 'Uitgebreide auditrechten en grotendeels zelfstandige aantoonbaarheid',
    };
  }
  if (dimensie === 'Operationele controle') {
    return {
      2: 'Operationeel beheer ligt grotendeels buiten de eigen organisatie',
      3: 'Operationele regie is gedeeld met duidelijke rolverdeling',
      4: 'Kernoperaties onder eigen regie, leverancier aanvullend',
    };
  }
  if (dimensie === 'Prijs / TCO') {
    return {
      2: 'Kosten beperkt voorspelbaar, met duidelijke externe afhankelijkheden',
      3: 'Redelijk inzicht, maar nog variabiliteit in totale kosten',
      4: 'Hoog kostentransparant met grotendeels beheersbare variatie',
    };
  }
  return DEFAULT_MID_LABELS;
};

const getScoreLabelsForQuestion = (question) => {
  const text = question?.question_text || '';
  const midLabels = getMidLabelsByDimension(question?.dimensie);
  if (text === 'Waar worden de data en AI-modellen van dit systeem opgeslagen?') {
    return {
      1: 'Op hyperscaler-infra buiten de EU',
      2: 'In EU-regio bij hyperscaler, maar onder niet-EU moederbedrijf en standaardvoorwaarden',
      3: 'In EU-cloud/private cloud met gedeelde regie op data en modellen',
      4: 'In NL/EU-omgeving met contractueel afgeschermde toegang en primair eigen beheer',
      5: 'On-premise onder eigen regie, met lokaal getrainde en beheerde modellen',
    };
  }

  const toelichting = question?.toelichting || '';
  const match = toelichting.match(/Score\s*1\s*:\s*(.*?)\s*[\-–]\s*Score\s*5\s*:\s*(.*)$/i);
  if (match) {
    return {
      1: match[1].trim(),
      2: midLabels[2],
      3: midLabels[3],
      4: midLabels[4],
      5: match[2].trim(),
    };
  }

  return {
    1: 'Sterk leverancier-afhankelijk',
    2: midLabels[2],
    3: midLabels[3],
    4: midLabels[4],
    5: 'Sterk onder eigen regie',
  };
};

const SCORE_COLORS = {
  1: '#ff4444',
  2: '#ff8800',
  3: '#f5c400',
  4: '#86BC25',
  5: '#2e7d00',
};

const getScoreColor = (score) => {
  if (score >= 80) return '#2e7d00';
  if (score >= 60) return '#86BC25';
  if (score >= 40) return '#f5c400';
  if (score >= 20) return '#ff8800';
  return '#ff4444';
};

const getScoreNarrative = (overallScore, dimensionScores = []) => {
  if (!Array.isArray(dimensionScores) || dimensionScores.length === 0) {
    return [
      'De totaalscore geeft een indicatie van de huidige digitale soevereiniteit. Gebruik de dimensiescores om verbeterprioriteiten te bepalen.',
    ];
  }

  const sorted = [...dimensionScores].sort((a, b) => b.score - a.score);
  const strongest = sorted.slice(0, 2).map(d => `${d.dimensie} (${d.score}%)`);
  const weakest = [...sorted].reverse().slice(0, 2).map(d => `${d.dimensie} (${d.score}%)`);

  const maturityLine =
    overallScore >= 80
      ? 'U zit in een hoge volwassenheidszone: governance, control en operationele uitvoer liggen grotendeels onder eigen regie.'
      : overallScore >= 60
      ? 'U zit in een werkbare midden-hoge zone: de basis is sterk, maar er zijn nog concrete afhankelijkheden die risico geven bij incidenten of exits.'
      : overallScore >= 40
      ? 'U zit in een kwetsbare middenzone: de soevereiniteit is niet stabiel genoeg voor hoge afhankelijkheid van externe partijen.'
      : 'U zit in een lage volwassenheidszone: de huidige inrichting maakt de organisatie gevoelig voor regie-, continuiteits- en compliance-risico.';

  return [
    maturityLine,
    `Sterkste dimensies: ${strongest.join(', ')}. Zwakste dimensies: ${weakest.join(', ')}.`,
    'Aanpakadvies: borg eerst minimale regie op data, auditability en operationele controle; versnel daarna lock-in reductie en structurele TCO-sturing.',
  ];
};

// ── SEAL-inschatting ────────────────────────────────────────────────────────
// Indicatieve afleiding van het Sovereignty Effectiveness Assurance Level
// (EU Cloud Sovereignty Framework, okt 2025). We volgen het zwakste-schakel-
// principe van het kader: de SEAL-niveaus vormen een cumulatieve ladder. Elke
// auditdimensie is gekoppeld aan een SEAL-laag (zie SEAL_TIERS); je bereikt een
// niveau alleen als álle onderliggende lagen voldoende geborgd zijn. Zo telt
// "niets doen aan jurisdictionele soevereiniteit" door, ook bij een redelijk
// gemiddelde. LET OP: de koppeling dimensie→laag en de drempel zijn een eigen
// invulling — duiding, geen framework-conforme SEAL-meting.
const SEAL_LEVELS = [
  { code: 'SEAL-0', name: 'No Sovereignty', nameNl: 'Geen soevereiniteit', color: '#c0392b',
    meaning: 'Dienst, technologie of operatie staat volledig onder controle van niet-EU partijen en valt volledig onder niet-EU jurisdictie.' },
  { code: 'SEAL-1', name: 'Jurisdictional Sovereignty', nameNl: 'Jurisdictionele soevereiniteit', color: '#e67e22',
    meaning: 'EU-recht is formeel van toepassing maar beperkt afdwingbaar; dienst, technologie of operatie staat nog onder exclusieve controle van niet-EU partijen.' },
  { code: 'SEAL-2', name: 'Data Sovereignty', nameNl: 'Datasoevereiniteit', color: '#f1c40f',
    meaning: 'EU-jurisdictie is van toepassing, maar er blijven materiële afhankelijkheden; dienst, technologie of operatie staat onder indirecte controle van niet-EU partijen.' },
  { code: 'SEAL-3', name: 'Technological Sovereignty', nameNl: 'Technologische soevereiniteit', color: '#7cb342',
    meaning: 'EU-jurisdictie van toepassing en EU-actoren hebben betekenisvolle maar niet volledige invloed; slechts marginale controle door niet-EU partijen.' },
  { code: 'SEAL-4', name: 'Full Digital Sovereignty', nameNl: 'Volledige digitale soevereiniteit', color: '#2e7d32',
    meaning: 'Technologie en operatie staan volledig onder EU-controle, uitsluitend onder EU-jurisdictie, zonder kritieke niet-EU afhankelijkheden.' },
];

// Drempel waarop een thema-laag als 'geborgd' geldt (op de 0-100% dimensieschaal).
const SEAL_THRESHOLD = 60;

// Koppeling auditdimensie → SEAL-laag (cumulatieve ladder, laag 1 = fundament).
// Prijs / TCO valt bewust buiten de soevereiniteitsladder (kostendimensie).
const SEAL_TIERS = [
  { level: 1, dims: ['Auditability & Compliance'] },                              // Jurisdictioneel: EU-recht & afdwingbaarheid
  { level: 2, dims: ['Data-soevereiniteit'] },                                    // Data: locatie, toegang, keten
  { level: 3, dims: ['Vendor Lock-in', 'Security', 'Flexibiliteit / maatwerk'] }, // Technologisch: onafhankelijkheid & isolatie
  { level: 4, dims: ['Operationele controle', 'Innovatie & schaalbaarheid'] },    // Volledig: eigen operatie
];

const getSealEstimate = (overallScore, dimensionScores = []) => {
  const byDim = Object.fromEntries(dimensionScores.map(d => [d.dimensie, d.score]));

  // Per laag: gemiddelde van de aanwezige (beantwoorde) dimensies.
  const tiers = SEAL_TIERS.map(t => {
    const present = t.dims.filter(dm => byDim[dm] !== undefined);
    const score = present.length
      ? Math.round(present.reduce((a, dm) => a + byDim[dm], 0) / present.length)
      : null;
    return {
      level: t.level,
      dims: t.dims,
      score,
      hasData: present.length > 0,
      passed: score !== null && score >= SEAL_THRESHOLD,
    };
  });

  // Hoogste aaneengesloten laag die slaagt, vanaf laag 1 (zwakste schakel telt).
  let achieved = 0;
  for (const t of tiers) { if (t.passed) achieved = t.level; else break; }

  const level = SEAL_LEVELS[achieved];
  const blocking = tiers.find(t => !t.passed); // eerste laag die het niveau begrenst

  let why;
  if (!blocking) {
    why = `Alle thema-lagen tot en met ${level.code} zijn voldoende geborgd (drempel ${SEAL_THRESHOLD}%).`;
  } else if (!blocking.hasData) {
    why = `${SEAL_LEVELS[blocking.level].code} — ${SEAL_LEVELS[blocking.level].nameNl} — is niet aangetoond: er zijn geen beantwoorde stellingen voor deze laag, dus een hoger niveau wordt niet toegekend. In het EU-kader bepaalt de zwakste schakel het niveau.`;
  } else {
    why = `${SEAL_LEVELS[blocking.level].code} — ${SEAL_LEVELS[blocking.level].nameNl} — scoort ${blocking.score}% en blijft onder de drempel van ${SEAL_THRESHOLD}%. Daardoor wordt een hoger niveau niet gehaald: het kader telt de zwakste schakel, niet het gemiddelde (${overallScore}%).`;
  }

  return { ...level, index: achieved, why, tiers };
};

// Benchmark / referentie-profielen — indicatieve waarden voor vergelijking
// Per dimensie een verwachte soevereiniteits-score (0-100). Niet-vermelde dimensies vallen weg.
const BENCHMARKS = {
  'overheid': {
    label: 'Publieke sector / Rijksoverheid',
    description: 'Indicatieve referentie voor overheidsorganisaties met hoge eisen op governance, compliance en continuiteit.',
    profile: {
      'Data-soevereiniteit':       90,
      'Security':                  85,
      'Vendor Lock-in':            75,
      'Flexibiliteit / maatwerk':  60,
      'Auditability & Compliance': 90,
      'Operationele controle':     75,
      'Innovatie & schaalbaarheid':55,
      'Prijs / TCO':               60,
    },
    sources: [
      { title: 'NIS2-richtlijn (EU 2022/2555)', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555' },
      { title: 'AVG/GDPR (EU 2016/679)', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
    ],
  },
  'finance': {
    label: 'Financiële sector (bank/verzekeraar)',
    description: 'Indicatieve referentie voor financiële instellingen met nadruk op digitale operationele weerbaarheid.',
    profile: {
      'Data-soevereiniteit':       80,
      'Security':                  90,
      'Vendor Lock-in':            70,
      'Flexibiliteit / maatwerk':  65,
      'Auditability & Compliance': 90,
      'Operationele controle':     80,
      'Innovatie & schaalbaarheid':70,
      'Prijs / TCO':               65,
    },
    sources: [
      { title: 'DORA-verordening (EU 2022/2554)', url: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj' },
      { title: 'NIS2-richtlijn (EU 2022/2555)', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555' },
    ],
  },
  'healthcare': {
    label: 'Zorg & medisch',
    description: 'Indicatieve referentie voor zorgomgevingen met patiëntdata en strenge informatiebeveiligingseisen.',
    profile: {
      'Data-soevereiniteit':       85,
      'Security':                  85,
      'Vendor Lock-in':            65,
      'Flexibiliteit / maatwerk':  60,
      'Auditability & Compliance': 80,
      'Operationele controle':     70,
      'Innovatie & schaalbaarheid':60,
      'Prijs / TCO':               55,
    },
    sources: [
      { title: 'AVG/GDPR (EU 2016/679)', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
      { title: 'NEN 7510 (informatiebeveiliging in de zorg)', url: 'https://www.nen.nl/nen-7510' },
    ],
  },
  'commercial': {
    label: 'Commerciële sector / SaaS-gericht',
    description: 'Innovatie- en kostenfocus; hyperscaler-cloud doorgaans acceptabel.',
    profile: {
      'Data-soevereiniteit':       50,
      'Security':                  70,
      'Vendor Lock-in':            45,
      'Flexibiliteit / maatwerk':  70,
      'Auditability & Compliance': 60,
      'Operationele controle':     55,
      'Innovatie & schaalbaarheid':80,
      'Prijs / TCO':               75,
    },
    sources: [
      { title: 'ISO/IEC 27001:2022 (ISMS)', url: 'https://www.iso.org/standard/27001' },
      { title: 'AVG/GDPR (EU 2016/679)', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
    ],
  },
  'dictu': {
    label: 'DICTU-kader (indicatief)',
    description: 'Indicatieve referentie op basis van DICTU Toetsingsinstrument Soevereiniteit Clouddiensten (Juridisch, Data & AI, Technologie, Operationeel, Mens).',
    profile: {
      'Data-soevereiniteit':       85,
      'Security':                  80,
      'Vendor Lock-in':            75,
      'Flexibiliteit / maatwerk':  70,
      'Auditability & Compliance': 85,
      'Operationele controle':     80,
      'Innovatie & schaalbaarheid':65,
      'Prijs / TCO':               60,
    },
    sources: [
      { title: 'NIS2-richtlijn (EU 2022/2555)', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555' },
      { title: 'AVG/GDPR (EU 2016/679)', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
      { title: 'ISO/IEC 27001:2022 (ISMS)', url: 'https://www.iso.org/standard/27001' },
    ],
  },
};

// ── Radar / Spider chart — pure SVG, no dependencies ────────────────────────
const RadarChart = ({ dimensionScores, benchmark, size = 420 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.34;       // radius of the outer ring
  const labelR = size * 0.43;   // radius for label placement
  // Extra marge in de viewBox zodat lange aslabels (bijv. "Vendor Lock-in")
  // binnen de SVG blijven en niet in de naastgelegen balkgrafiek lopen.
  const padX = 78;
  const padY = 26;
  const vbW = size + padX * 2;
  const vbH = size + padY * 2;
  const n = dimensionScores.length;
  if (n < 3) return null;

  // Angle for axis i, starting from top (–π/2), clockwise
  const angle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const ptOnAxis = (i, frac) => ({
    x: cx + r * frac * Math.cos(angle(i)),
    y: cy + r * frac * Math.sin(angle(i)),
  });

  // Grid rings at 25 / 50 / 75 / 100 %
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const ringPath = (frac) =>
    dimensionScores
      .map((_, i) => {
        const p = ptOnAxis(i, frac);
        return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      })
      .join(' ') + ' Z';

  // Data polygon
  const dataPath = dimensionScores
    .map(({ score }, i) => {
      const p = ptOnAxis(i, score / 100);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(' ') + ' Z';

  // Label position — nudge outward; wrap long names
  const labelAnchor = (i) => {
    const a = angle(i);
    const cos = Math.cos(a);
    if (cos > 0.2) return 'start';
    if (cos < -0.2) return 'end';
    return 'middle';
  };
  const labelDy = (i) => {
    const a = angle(i);
    const sin = Math.sin(a);
    if (sin > 0.3) return '1em';
    if (sin < -0.3) return '-0.3em';
    return '0.35em';
  };

  // Split label into two lines if longer than ~20 chars
  const splitLabel = (text) => {
    if (text.length <= 18) return [text];
    const mid = text.indexOf(' ', text.length / 2 - 4);
    if (mid === -1) return [text];
    return [text.slice(0, mid), text.slice(mid + 1)];
  };

  return (
    <svg
      width={vbW}
      height={vbH}
      viewBox={`${-padX} ${-padY} ${vbW} ${vbH}`}
      style={{ display: 'block', margin: '0 auto', width: '100%', maxWidth: `${vbW}px`, height: 'auto', overflow: 'hidden' }}
    >
      {/* Grid rings */}
      {gridRings.map((frac) => (
        <path key={frac} d={ringPath(frac)}
          fill="none" stroke="#e0e0e0" strokeWidth={frac === 1 ? 1.5 : 1} />
      ))}
      {/* Spoke lines */}
      {dimensionScores.map((_, i) => {
        const outer = ptOnAxis(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e0e0e0" strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <path d={dataPath} fill="rgba(134,188,37,0.25)" stroke="#86BC25" strokeWidth={2.5} />
      {/* Benchmark overlay (optioneel) */}
      {benchmark && (() => {
        const benchPath = dimensionScores
          .map(({ dimensie }, i) => {
            const v = benchmark.profile[dimensie];
            if (v === undefined) return null;
            const p = ptOnAxis(i, v / 100);
            return { x: p.x, y: p.y };
          });
        // Als referentie-profiel niet alle dimensies dekt: skip
        if (benchPath.some(p => p === null)) return null;
        const path = benchPath
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(' ') + ' Z';
        return (
          <>
            <path d={path} fill="none" stroke="#0066cc" strokeWidth={2} strokeDasharray="6,4" opacity="0.85" />
            {benchPath.map((p, i) => (
              <circle key={`b${i}`} cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="#0066cc" strokeWidth={1.5} />
            ))}
          </>
        );
      })()}
      {/* Data dots */}
      {dimensionScores.map(({ score }, i) => {
        const p = ptOnAxis(i, score / 100);
        return <circle key={i} cx={p.x} cy={p.y} r={5} fill="#86BC25" stroke="#fff" strokeWidth={2} />;
      })}
      {/* Percentage labels on rings (right side) */}
      {gridRings.map((frac) => (
        <text key={frac}
          x={cx + r * frac + 4} y={cy + 2}
          fontSize="9" fill="#aaa" dominantBaseline="middle"
        >{Math.round(frac * 100)}%</text>
      ))}
      {/* Axis labels */}
      {dimensionScores.map(({ dimensie }, i) => {
        const lp = { x: cx + labelR * Math.cos(angle(i)), y: cy + labelR * Math.sin(angle(i)) };
        const lines = splitLabel(dimensie);
        return (
          <text key={i} x={lp.x} y={lp.y}
            textAnchor={labelAnchor(i)} dominantBaseline="middle"
            fontSize="11" fontWeight="700" fill="#222"
          >
            {lines.length === 1
              ? <tspan dy={labelDy(i)}>{lines[0]}</tspan>
              : lines.map((line, li) => (
                  <tspan key={li} x={lp.x} dy={li === 0 ? (parseFloat(labelDy(i)) - 0.55) + 'em' : '1.1em'}>{line}</tspan>
                ))
            }
            <tspan x={lp.x} dy={lines.length > 1 ? '1.15em' : '1.2em'}
              fontSize="10" fontWeight="400"
              fill={getScoreColor(dimensionScores[i].score)}
            >{dimensionScores[i].score}%</tspan>
          </text>
        );
      })}
    </svg>
  );
};

const DimensionBar = ({ dimensie, score }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontWeight: '700', fontSize: '14px' }}>{dimensie}</span>
      <span style={{ fontWeight: '800', fontSize: '16px', color: getScoreColor(score) }}>{score}%</span>
    </div>
    <div style={{ height: '10px', background: '#e5e5e5' }}>
      <div style={{
        height: '100%', width: `${score}%`,
        background: getScoreColor(score),
        transition: 'width 0.5s ease'
      }} />
    </div>
  </div>
);

const SovereigntyAudit = ({ user, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [scores, setScores] = useState({});
  const [systemName, setSystemName] = useState('');
  const [step, setStep] = useState('list'); // 'list', 'new', 'wizard', 'result'
  const [dimensionIndex, setDimensionIndex] = useState(0);
  const [audits, setAudits] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState('');
  const [hoveredScores, setHoveredScores] = useState({});

  useEffect(() => {
    fetchQuestions();
    fetchAudits();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/audit-questions`);
      setQuestions(res.data);
    } catch (err) {
      console.error('Error fetching audit questions', err);
    }
  };

  const fetchAudits = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/audits?userId=${user.id}`);
      setAudits(res.data);
    } catch (err) {
      console.error('Error fetching audits', err);
    }
  };

  // Group questions by dimensie
  const dimensions = [...new Set(questions.map(q => q.dimensie))];
  const currentDimensie = dimensions[dimensionIndex];
  const currentDimensionQuestions = questions.filter(q => q.dimensie === currentDimensie);

  const handleScoreChange = (qId, value) => {
    setScores(prev => ({ ...prev, [qId]: parseInt(value) }));
  };

  const startAudit = (e) => {
    e.preventDefault();
    if (!systemName.trim()) return;
    setStep('wizard');
    setDimensionIndex(0);
  };

  const handleSubmit = async () => {
    if (loading) return;
    const unanswered = questions.filter(q => scores[q.id] === undefined);
    if (unanswered.length > 0) {
      const byDim = unanswered.reduce((acc, q) => {
        acc[q.dimensie] = (acc[q.dimensie] || 0) + 1;
        return acc;
      }, {});
      const summary = Object.entries(byDim).map(([d, n]) => `• ${d}: ${n}`).join('\n');
      const proceed = window.confirm(
        `Er ${unanswered.length === 1 ? 'is 1 stelling' : `zijn ${unanswered.length} stellingen`} nog niet beantwoord:\n\n${summary}\n\nNiet-beantwoorde stellingen worden niet meegenomen in de scoring. Toch doorgaan?`
      );
      if (!proceed) {
        // Spring naar de eerste dimensie met onbeantwoorde stellingen
        const firstUnansweredDim = unanswered[0].dimensie;
        const idx = dimensions.indexOf(firstUnansweredDim);
        if (idx >= 0) setDimensionIndex(idx);
        return;
      }
    }
    setLoading(true);
    const answerArray = questions
      .filter(q => scores[q.id] !== undefined)
      .map(q => ({
        questionId: q.id,
        score: scores[q.id]
      }));

    try {
      const res = await axios.post(`${API_BASE_URL}/audits`, {
        userId: user.id,
        systemName,
        answers: answerArray
      });
      const detailRes = await axios.get(`${API_BASE_URL}/audits/${res.data.id}`);
      setCurrentResult(detailRes.data);
      setStep('result');
      fetchAudits();
    } catch (err) {
      console.error('Error submitting audit', err);
      alert('Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  const openAudit = async (a) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/audits/${a.id}`);
      setCurrentResult(res.data);
      setStep('result');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderList = () => (
    <div className="main-container">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="mb-1">Soevereiniteitsaudit</h1>
          <p className="text-muted mb-0" style={{ fontSize: '16px' }}>Beoordeel de huidige soevereiniteit van een bestaand systeem</p>
        </div>
        <button className="btn btn-success" onClick={() => { setSystemName(''); setScores({}); setStep('new'); }}>
          Nieuwe Audit
        </button>
      </div>

      <div className="card shadow-sm p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Systeem</th>
              <th>Soevereiniteitsscore</th>
              <th className="text-end">Acties</th>
            </tr>
          </thead>
          <tbody>
            {audits.map(a => (
              <tr key={a.id}>
                <td className="align-middle text-muted" style={{ fontSize: '14px' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="align-middle fw-bold" style={{ fontSize: '18px' }}>{a.system_name}</td>
                <td className="align-middle text-muted small">—</td>
                <td className="text-end align-middle">
                  <button className="btn btn-outline-dark btn-sm py-2" onClick={() => openAudit(a)}>Openen</button>
                </td>
              </tr>
            ))}
            {audits.length === 0 && (
              <tr><td colSpan="4" className="text-center py-5 text-muted">Nog geen audits uitgevoerd.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNew = () => (
    <div className="main-container">
      <h1 className="mb-2">Nieuwe Soevereiniteitsaudit</h1>
      <p className="text-muted mb-5" style={{ fontSize: '20px' }}>
        Beoordeel een bestaand AI-systeem of digitale oplossing op de mate van soevereiniteit per dimensie. 
        Kies per stelling de optie die het beste aansluit op de huidige situatie van het systeem.
      </p>
      <div className="card shadow-sm bg-light">
        <form onSubmit={startAudit}>
          <div className="form-group mb-5">
            <label className="form-label">Naam van het te beoordelen systeem</label>
            <input
              type="text" className="form-control form-control-lg"
              value={systemName} onChange={(e) => setSystemName(e.target.value)}
              placeholder="Bijv. AI Chatbot Klantenservice v2.1" required
            />
          </div>
          <button type="submit" className="btn btn-primary px-5 py-3">Start Audit</button>
        </form>
      </div>
    </div>
  );

  const renderWizard = () => {
    if (!currentDimensie || currentDimensionQuestions.length === 0) return null;
    const progress = ((dimensionIndex + 1) / dimensions.length) * 100;
    const answeredInDim = currentDimensionQuestions.filter(q => scores[q.id] !== undefined).length;
    const totalAnswered = questions.filter(q => scores[q.id] !== undefined).length;
    const totalUnanswered = questions.length - totalAnswered;
    const isLastDim = dimensionIndex === dimensions.length - 1;

    return (
      <div className="main-container" style={{ maxWidth: '860px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex gap-3">
            <button className="btn btn-outline-dark btn-sm py-1 px-3"
              onClick={() => setDimensionIndex(prev => Math.max(0, prev - 1))}
              disabled={dimensionIndex === 0} style={{ fontSize: '10px' }}
            >&larr; VORIGE</button>
            {isLastDim && (
              <button className="btn btn-success btn-sm py-1 px-3" onClick={handleSubmit} disabled={loading} style={{ fontSize: '10px' }}>
                {loading ? 'Berekenen...' : 'BEREKEN SCORE'}
              </button>
            )}
            {!isLastDim && (
              <button className="btn btn-outline-dark btn-sm py-1 px-3"
                onClick={() => setDimensionIndex(prev => Math.min(dimensions.length - 1, prev + 1))}
                style={{ fontSize: '10px' }}
              >VOLGENDE &rarr;</button>
            )}
          </div>
          <span className="text-muted small fw-bold">
            DIMENSIE {dimensionIndex + 1} VAN {dimensions.length} ({Math.round(progress)}%)
          </span>
        </div>

        <div className="progress-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="mt-5">
          <span className="badge bg-deloitte-green" style={{ fontSize: '13px', padding: '6px 14px' }}>{currentDimensie}</span>
          <h1 style={{ fontSize: '36px', lineHeight: '1.2', marginTop: '16px' }}>
            {currentDimensie}
          </h1>
          <p className="text-muted mb-3" style={{ fontSize: '16px' }}>
            Beoordeel onderstaande stellingen voor het systeem <strong>{systemName}</strong>.
          </p>
          <div style={{
            display: 'inline-block', padding: '4px 12px', marginBottom: '32px',
            fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
            background: answeredInDim === currentDimensionQuestions.length ? 'var(--d-green)' : '#f5c400',
            color: '#fff'
          }}>
            {answeredInDim} / {currentDimensionQuestions.length} stellingen beantwoord in deze dimensie
          </div>

          {currentDimensionQuestions.map((q, qi) => {
            const currentScore = scores[q.id] || 0;
            const scoreLabels = getScoreLabelsForQuestion(q);
            const hoverScore = hoveredScores[q.id];
            const activeHintScore = hoverScore || currentScore || null;
            const hintText = activeHintScore
              ? `Waarom dit niveau: ${SOVEREIGNTY_EXPLANATIONS[activeHintScore]} ${getExampleContext(q.dimensie, activeHintScore)}`
              : 'Beweeg over een antwoordoptie om te zien waarom dit meer of minder soeverein is.';
            return (
              <div key={q.id} className="audit-question-card">
                <div className="audit-q-number">Stelling {qi + 1}</div>
                <p className="audit-q-text">{q.question_text}</p>
                <p className="audit-q-hint">{hintText}</p>

                <div className="audit-score-grid">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleScoreChange(q.id, s)}
                      onMouseEnter={() => setHoveredScores(prev => ({ ...prev, [q.id]: s }))}
                      onMouseLeave={() => setHoveredScores(prev => ({ ...prev, [q.id]: undefined }))}
                      onFocus={() => setHoveredScores(prev => ({ ...prev, [q.id]: s }))}
                      onBlur={() => setHoveredScores(prev => ({ ...prev, [q.id]: undefined }))}
                      className={`audit-score-btn ${currentScore === s ? 'active' : ''}`}
                      style={currentScore === s ? { background: '#000', color: '#fff', borderColor: '#000' } : {}}
                    >
                      <span className="score-number">{s}</span>
                      <span className="score-text">{scoreLabels[s]}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isLastDim && (
          <div className="text-center mt-5 pt-4">
            {totalUnanswered > 0 && (
              <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                <strong style={{ color: '#f5c400' }}>⚠ {totalUnanswered}</strong> van {questions.length} stellingen zijn nog niet beantwoord.
              </p>
            )}
            <button className="btn btn-success px-5 py-3" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Berekenen...' : 'Bereken Soevereiniteitsscore'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    if (!currentResult) return null;
    const { dimensionScores = [], overallScore = 0 } = currentResult;
    const narrativeLines = getScoreNarrative(overallScore, dimensionScores);
    const seal = getSealEstimate(overallScore, dimensionScores);

    return (
      <div className="main-container">
        <h1 className="mb-2">Audit Resultaat</h1>
        <p className="text-muted mb-5" style={{ fontSize: '20px' }}>
          Systeem: <strong>{currentResult.system_name}</strong>
        </p>

        {/* Overall score */}
        <div style={{ background: '#000', color: '#fff', padding: '40px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--d-green)', marginBottom: '8px', fontWeight: '700' }}>
              Totale Soevereiniteitsscore
            </p>
            <div style={{ fontSize: '80px', fontWeight: '800', lineHeight: 1, color: getScoreColor(overallScore) }}>
              {overallScore}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {narrativeLines.map((line, idx) => (
              <p key={idx} style={{ fontSize: '16px', lineHeight: 1.55, color: idx === 0 ? '#f2f2f2' : '#cfcfcf', marginBottom: idx === narrativeLines.length - 1 ? 0 : '8px' }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Indicatieve SEAL-inschatting (afgeleid uit de totaalscore) */}
        <div className="card shadow-sm mb-5" style={{ padding: 0, overflow: 'hidden', borderTop: `5px solid ${seal.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', padding: '18px 24px', background: '#f8f9fb', borderBottom: '1px solid #eef0f3' }}>
            <span style={{ color: seal.color, fontWeight: 900, fontSize: '30px', letterSpacing: '0.5px', lineHeight: 1 }}>
              {seal.code}
            </span>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', fontWeight: 700 }}>
                Geschat soevereiniteitsniveau
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>
                {seal.nameNl} <span style={{ color: '#888', fontWeight: 600, fontSize: '15px' }}>({seal.name})</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '15px', lineHeight: 1.55, marginBottom: '10px' }}>
            <strong>Wat dit betekent:</strong> {seal.meaning}
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.55, marginBottom: '12px', color: '#444' }}>
            <strong>Waarom dit niveau:</strong> {seal.why}
          </p>

          {/* Ladder-overzicht: per laag de geborgde status (zwakste schakel zichtbaar) */}
          <div style={{ border: '1px solid #e3e6ea', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
            {seal.tiers.map((t, i) => {
              const lvl = SEAL_LEVELS[t.level];
              const status = t.passed ? '✓ geborgd' : t.hasData ? '✗ onvoldoende' : '— niet aangetoond';
              const statusColor = t.passed ? '#2e7d32' : t.hasData ? '#c0392b' : '#999';
              return (
                <div key={t.level} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px',
                  borderTop: i === 0 ? 'none' : '1px solid #eef0f3', background: t.level <= seal.index ? '#f3f8f3' : '#fff' }}>
                  <span style={{ width: '64px', fontWeight: 800, color: lvl.color }}>{lvl.code}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#444' }}>{lvl.nameNl}</span>
                  <span style={{ width: '52px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#333' }}>
                    {t.score === null ? 'n.v.t.' : `${t.score}%`}
                  </span>
                  <span style={{ width: '120px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: statusColor }}>{status}</span>
                </div>
              );
            })}
          </div>

          <p className="mb-0">
            <span style={{ display: 'inline-block', background: '#fff3cd', color: '#8a6d3b', border: '1px solid #ffe69c', borderRadius: '4px', padding: '2px 8px', fontWeight: 700, fontSize: '12px' }}>
              Indicatief — dimensies gekoppeld aan SEAL-lagen, drempel {SEAL_THRESHOLD}%; geen framework-conforme SEAL-meting.
            </span>
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
              Niveaudefinities: EU Cloud Sovereignty Framework (okt 2025).
            </span>
          </p>
          </div>
        </div>

        {/* Per dimension scores — spider chart + bars */}
        <div className="card shadow-sm p-4 mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h3 className="mb-0">Score per Dimensie</h3>
            <div className="d-flex align-items-center gap-2 no-print" style={{ background: '#f8f9fb', border: '1px solid #e3e6ea', padding: '8px 10px', borderRadius: '8px' }}>
              <label htmlFor="benchmark-select" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', fontWeight: '700', marginBottom: 0 }}>
                Vergelijk met:
              </label>
              <select id="benchmark-select" className="form-select form-select-sm" style={{ width: 'auto', minWidth: '250px', borderColor: '#c7cbd1', fontWeight: '600' }}
                value={selectedBenchmark} onChange={e => setSelectedBenchmark(e.target.value)}>
                <option value="">— Geen referentie —</option>
                {Object.entries(BENCHMARKS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          {selectedBenchmark && BENCHMARKS[selectedBenchmark] && (
            <div className="mb-3" style={{ fontSize: '13px' }}>
              <p className="text-muted small mb-2" style={{ fontSize: '13px' }}>
                <span style={{ display: 'inline-block', width: '20px', height: '2px', background: '#0066cc', verticalAlign: 'middle', marginRight: '8px', borderTop: '2px dashed #0066cc' }}></span>
                {BENCHMARKS[selectedBenchmark].description}
              </p>
              <p className="mb-2" style={{ fontSize: '12px' }}>
                <span style={{ display: 'inline-block', background: '#fff3cd', color: '#8a6d3b', border: '1px solid #ffe69c', borderRadius: '4px', padding: '2px 8px', fontWeight: 700 }}>
                  Indicatief referentieprofiel — expert-inschatting, geen gemeten benchmark.
                </span>
              </p>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Relevante kaders: {BENCHMARKS[selectedBenchmark].sources.map((source, idx) => (
                  <span key={source.url}>
                    {idx > 0 && ' | '}
                    <a href={source.url} target="_blank" rel="noreferrer" style={{ color: '#0057a3', textDecoration: 'none', fontWeight: 600 }}>
                      {source.title}
                    </a>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Radar chart */}
            <div style={{ flex: '0 0 auto' }}>
              <RadarChart dimensionScores={dimensionScores}
                benchmark={selectedBenchmark ? BENCHMARKS[selectedBenchmark] : null}
                size={420} />
            </div>
            {/* Bar chart */}
            <div style={{ flex: '1 1 260px', minWidth: '220px', paddingTop: '12px' }}>
              {dimensionScores.map(({ dimensie, score }) => {
                const benchVal = selectedBenchmark && BENCHMARKS[selectedBenchmark]
                  ? BENCHMARKS[selectedBenchmark].profile[dimensie]
                  : undefined;
                return (
                  <div key={dimensie} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{dimensie}</span>
                      <span style={{ fontWeight: '800', fontSize: '16px', color: getScoreColor(score) }}>
                        {score}%
                        {benchVal !== undefined && (
                          <span style={{ fontSize: '11px', color: '#0066cc', fontWeight: '700', marginLeft: '8px' }}>
                            (ref. {benchVal}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ height: '10px', background: '#e5e5e5', position: 'relative' }}>
                      <div style={{
                        height: '100%', width: `${score}%`,
                        background: getScoreColor(score),
                        transition: 'width 0.5s ease'
                      }} />
                      {benchVal !== undefined && (
                        <div style={{
                          position: 'absolute', left: `${benchVal}%`, top: '-3px',
                          width: '2px', height: '16px', background: '#0066cc'
                        }} title={`Referentie: ${benchVal}%`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail table */}
        <div className="card shadow-sm p-4 mb-5">
          <h3 className="mb-4">Gegeven Beoordelingen</h3>
          {dimensions.map(dim => {
            const dimQuestions = (currentResult.details || []).filter(d => d.dimensie === dim);
            if (dimQuestions.length === 0) return null;
            return (
              <div key={dim} style={{ marginBottom: '30px' }}>
                <h5 style={{ fontWeight: '700', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>{dim}</h5>
                {dimQuestions.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: '14px', flex: 1 }}>{d.question_text}</span>
                    <span style={{ fontWeight: '800', fontSize: '16px', minWidth: '40px', textAlign: 'right', color: SCORE_COLORS[d.score] }}>
                      {d.score}/5
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="d-flex gap-3 no-print">
          <button className="btn btn-outline-dark" onClick={() => window.print()}>Print / PDF</button>
          <button className="btn btn-primary" onClick={() => setStep('list')}>Overzicht</button>
        </div>

        <div className="mt-5 pt-5 text-muted small border-top">
          <p><strong>DISCLAIMER</strong></p>
          <p>Dit rapport is gegenereerd door de Deloitte Sovereignty Assessment Tool op {new Date(currentResult.created_at).toLocaleDateString('nl-NL')}. De resultaten zijn indicatief en aan dit rapport kunnen geen rechten worden ontleend.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="nav-header shadow-sm no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div className="deloitte-logo" style={{ cursor: 'pointer' }} onClick={onBack}>Deloitte<span>.</span></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>Soevereiniteitsaudit</span>
        </div>
        <div className="d-flex align-items-center gap-4">
          <button className="btn btn-outline-dark py-2" style={{ fontSize: '12px', padding: '8px 20px' }} onClick={onBack}>
            ← Home
          </button>
          <span className="text-muted fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{user.username}</span>
        </div>
      </header>
      {step === 'list'   && renderList()}
      {step === 'new'    && renderNew()}
      {step === 'wizard' && renderWizard()}
      {step === 'result' && renderResult()}
    </div>
  );
};

export default SovereigntyAudit;
