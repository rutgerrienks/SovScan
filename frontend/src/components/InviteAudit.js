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

// ── Radar / Spider chart — pure SVG ─────────────────────────────────────────
const RadarChart = ({ dimensionScores, size = 420 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.34;
  const labelR = size * 0.455;
  const n = dimensionScores.length;
  if (n < 3) return null;

  const angle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const ptOnAxis = (i, frac) => ({
    x: cx + r * frac * Math.cos(angle(i)),
    y: cy + r * frac * Math.sin(angle(i)),
  });

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const ringPath = (frac) =>
    dimensionScores.map((_, i) => {
      const p = ptOnAxis(i, frac);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }).join(' ') + ' Z';

  const dataPath = dimensionScores.map(({ score }, i) => {
    const p = ptOnAxis(i, score / 100);
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ') + ' Z';

  const labelAnchor = (i) => {
    const cos = Math.cos(angle(i));
    if (cos > 0.2) return 'start';
    if (cos < -0.2) return 'end';
    return 'middle';
  };
  const labelDy = (i) => {
    const sin = Math.sin(angle(i));
    if (sin > 0.3) return '1em';
    if (sin < -0.3) return '-0.3em';
    return '0.35em';
  };
  const splitLabel = (text) => {
    if (text.length <= 18) return [text];
    const mid = text.indexOf(' ', text.length / 2 - 4);
    if (mid === -1) return [text];
    return [text.slice(0, mid), text.slice(mid + 1)];
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {gridRings.map((frac) => (
        <path key={frac} d={ringPath(frac)} fill="none" stroke="#e0e0e0" strokeWidth={frac === 1 ? 1.5 : 1} />
      ))}
      {dimensionScores.map((_, i) => {
        const outer = ptOnAxis(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e0e0e0" strokeWidth={1} />;
      })}
      <path d={dataPath} fill="rgba(134,188,37,0.25)" stroke="#86BC25" strokeWidth={2.5} />
      {dimensionScores.map(({ score }, i) => {
        const p = ptOnAxis(i, score / 100);
        return <circle key={i} cx={p.x} cy={p.y} r={5} fill="#86BC25" stroke="#fff" strokeWidth={2} />;
      })}
      {gridRings.map((frac) => (
        <text key={frac} x={cx + r * frac + 4} y={cy + 2} fontSize="9" fill="#aaa" dominantBaseline="middle">
          {Math.round(frac * 100)}%
        </text>
      ))}
      {dimensionScores.map(({ dimensie }, i) => {
        const lp = { x: cx + labelR * Math.cos(angle(i)), y: cy + labelR * Math.sin(angle(i)) };
        const lines = splitLabel(dimensie);
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor={labelAnchor(i)} dominantBaseline="middle"
            fontSize="11" fontWeight="700" fill="#222">
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
      <div style={{ height: '100%', width: `${score}%`, background: getScoreColor(score), transition: 'width 0.5s ease' }} />
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const InviteAudit = ({ token }) => {
  const [step, setStep] = useState('loading'); // loading, intro, wizard, result, error
  const [invite, setInvite] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [scores, setScores] = useState({});
  const [dimensionIndex, setDimensionIndex] = useState(0);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredScores, setHoveredScores] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const [invRes, qRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/invites/${token}`),
          axios.get(`${API_BASE_URL}/audit-questions`)
        ]);
        setInvite(invRes.data);
        setQuestions(qRes.data);
        setStep('intro');
      } catch (err) {
        setErrorMsg(err.response?.data?.error || 'Deze uitnodiging is ongeldig of verlopen.');
        setStep('error');
      }
    };
    init();
  }, [token]);

  const dimensions = [...new Set(questions.map(q => q.dimensie))];
  const currentDimensie = dimensions[dimensionIndex];
  const currentDimensionQuestions = questions.filter(q => q.dimensie === currentDimensie);

  const handleScoreChange = (qId, value) => {
    setScores(prev => ({ ...prev, [qId]: parseInt(value) }));
  };

  const startAudit = (e) => {
    e.preventDefault();
    setStep('wizard');
    setDimensionIndex(0);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    const answerArray = questions.map(q => ({
      questionId: q.id,
      score: scores[q.id] || 3
    }));

    try {
      const res = await axios.post(`${API_BASE_URL}/invites/${token}/submit-audit`, {
        respondentName,
        respondentEmail,
        systemName: invite.projectName,
        answers: answerArray
      });

      // Fetch full detail
      const detailRes = await axios.get(`${API_BASE_URL}/audits/${res.data.id}`);
      setCurrentResult(detailRes.data);
      setStep('result');
    } catch (err) {
      alert(err.response?.data?.error || 'Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6' }}>
        <p className="text-muted">Uitnodiging laden...</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6' }}>
        <div className="card shadow-sm p-5 text-center" style={{ maxWidth: '500px' }}>
          <h2 className="mb-3">Uitnodiging niet geldig</h2>
          <p className="text-muted">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="App">
        <header className="nav-header shadow-sm">
          <div className="deloitte-logo">Deloitte<span>.</span></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>
            Soevereiniteitsaudit
          </span>
        </header>
        <div className="main-container" style={{ maxWidth: '700px' }}>
          <h1 className="mb-2">Soevereiniteitsaudit</h1>
          <p className="text-muted mb-4" style={{ fontSize: '20px' }}>
            Project: <strong>{invite.projectName}</strong>
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.7, marginBottom: '32px' }}>
            U bent uitgenodigd om een soevereiniteitsaudit in te vullen. Beoordeel het systeem op 7 dimensies
            door per stelling de optie te kiezen die het best past bij de huidige situatie.
          </p>
          <div className="card shadow-sm bg-light">
            <form onSubmit={startAudit}>
              <div className="form-group mb-4">
                <label className="form-label">Uw naam</label>
                <input type="text" className="form-control" value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Optioneel" />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Uw e-mailadres</label>
                <input type="email" className="form-control" value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="Optioneel" />
              </div>
              <button type="submit" className="btn btn-primary px-5 py-3">Start Audit</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'wizard') {
    if (!currentDimensie || currentDimensionQuestions.length === 0) return null;
    const progress = ((dimensionIndex + 1) / dimensions.length) * 100;

    return (
      <div className="App">
        <header className="nav-header shadow-sm no-print">
          <div className="deloitte-logo">Deloitte<span>.</span></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>
            Soevereiniteitsaudit — {invite.projectName}
          </span>
        </header>
        <div className="main-container" style={{ maxWidth: '860px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-3">
              <button className="btn btn-outline-dark btn-sm py-1 px-3"
                onClick={() => setDimensionIndex(prev => Math.max(0, prev - 1))}
                disabled={dimensionIndex === 0} style={{ fontSize: '10px' }}
              >&larr; VORIGE</button>
              <button className="btn btn-outline-dark btn-sm py-1 px-3"
                onClick={() => setDimensionIndex(prev => Math.min(dimensions.length - 1, prev + 1))}
                disabled={dimensionIndex === dimensions.length - 1}
                style={{ fontSize: '10px' }}
              >VOLGENDE &rarr;</button>
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
            <p className="text-muted mb-5" style={{ fontSize: '16px' }}>
              Beoordeel onderstaande stellingen voor <strong>{invite.projectName}</strong>.
            </p>

            {dimensionIndex === dimensions.length - 1 && (
              <div className="mb-4">
                <button className="btn btn-success px-5 py-3" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Berekenen...' : 'Bereken Soevereiniteitsscore'}
                </button>
              </div>
            )}

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
                        style={currentScore === s ? { background: SCORE_COLORS[s], color: '#fff', borderColor: SCORE_COLORS[s] } : {}}
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

          {dimensionIndex === dimensions.length - 1 && (
            <div className="text-center mt-5 pt-4">
              <button className="btn btn-success px-5 py-3" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Berekenen...' : 'Bereken Soevereiniteitsscore'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'result' && currentResult) {
    const { dimensionScores = [], overallScore = 0 } = currentResult;

    return (
      <div className="App">
        <header className="nav-header shadow-sm no-print">
          <div className="deloitte-logo">Deloitte<span>.</span></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>
            Auditresultaat — {invite.projectName}
          </span>
        </header>
        <div className="main-container">
          <h1 className="mb-2">Audit Resultaat</h1>
          <p className="text-muted mb-5" style={{ fontSize: '20px' }}>
            Project: <strong>{invite.projectName}</strong>
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
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#ccc', marginBottom: 0 }}>
                {overallScore >= 80 && 'Het systeem is sterk soeverein ingericht. De organisatie heeft grotendeels controle over data, technologie en operaties.'}
                {overallScore >= 60 && overallScore < 80 && 'Het systeem toont een goede mate van soevereiniteit, maar er zijn verbeterpunten op specifieke dimensies.'}
                {overallScore >= 40 && overallScore < 60 && 'Het systeem heeft een gemiddelde soevereiniteitsscore. Er zijn significante afhankelijkheden van externe partijen.'}
                {overallScore < 40 && 'Het systeem heeft een lage soevereiniteitsscore. Er zijn kritieke afhankelijkheden die de digitale autonomie beperken.'}
              </p>
            </div>
          </div>

          {/* Spider chart + bars */}
          <div className="card shadow-sm p-4 mb-5">
            <h3 className="mb-4">Score per Dimensie</h3>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 auto' }}>
                <RadarChart dimensionScores={dimensionScores} size={420} />
              </div>
              <div style={{ flex: '1 1 260px', minWidth: '220px', paddingTop: '12px' }}>
                {dimensionScores.map(({ dimensie, score }) => (
                  <DimensionBar key={dimensie} dimensie={dimensie} score={score} />
                ))}
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
          </div>

          <div className="mt-5 pt-5 text-muted small border-top">
            <p><strong>DISCLAIMER</strong></p>
            <p>Dit rapport is gegenereerd door de Deloitte Sovereignty Assessment Tool op {new Date(currentResult.created_at).toLocaleDateString('nl-NL')}. De resultaten zijn indicatief en aan dit rapport kunnen geen rechten worden ontleend.</p>
            <p>&copy; {new Date().getFullYear()} Deloitte Netherlands</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteAudit;
