import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const SCORE_LABELS = {
  1: 'Niet soeverein',
  2: 'Beperkt soeverein',
  3: 'Gedeeltelijk soeverein',
  4: 'Grotendeels soeverein',
  5: 'Volledig soeverein',
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

const getSealLevel = (overallScore) => {
  if (overallScore >= 85) return { level: 'SEAL-5', label: 'Zeer hoog soevereiniteitsniveau' };
  if (overallScore >= 70) return { level: 'SEAL-4', label: 'Hoog soevereiniteitsniveau' };
  if (overallScore >= 55) return { level: 'SEAL-3', label: 'Middenniveau soevereiniteit' };
  if (overallScore >= 40) return { level: 'SEAL-2', label: 'Basisniveau soevereiniteit' };
  return { level: 'SEAL-1', label: 'Laag soevereiniteitsniveau' };
};

const getEucsFit = (dimensionScores, overallScore) => {
  const minScore = dimensionScores.length
    ? Math.min(...dimensionScores.map((d) => d.score))
    : 0;

  if (overallScore >= 75 && minScore >= 60) {
    return { level: 'High', note: 'Indicatieve aansluiting op hoog assurance-profiel.' };
  }
  if (overallScore >= 50 && minScore >= 35) {
    return { level: 'Substantial', note: 'Indicatieve aansluiting op substantieel assurance-profiel.' };
  }
  return { level: 'Basic', note: 'Indicatieve aansluiting op basis assurance-profiel.' };
};

const DICTU_DIMENSION_MAP = {
  'Juridisch': ['Data-soevereiniteit', 'Auditability & Compliance'],
  'Data & AI': ['Data-soevereiniteit', 'Security', 'Auditability & Compliance'],
  'Technologie': ['Vendor Lock-in', 'Flexibiliteit / maatwerk', 'Innovatie & schaalbaarheid'],
  'Operationeel': ['Operationele controle', 'Security', 'Prijs / TCO'],
  'Mens': ['Operationele controle', 'Vendor Lock-in'],
};

const getDictuLensScores = (dimensionScores) => {
  const scoreByDimension = Object.fromEntries(dimensionScores.map((d) => [d.dimensie, d.score]));
  return Object.entries(DICTU_DIMENSION_MAP).map(([name, relatedDimensions]) => {
    const mapped = relatedDimensions
      .map((dim) => scoreByDimension[dim])
      .filter((v) => typeof v === 'number');
    if (!mapped.length) return { name, score: null };
    const avg = Math.round(mapped.reduce((sum, v) => sum + v, 0) / mapped.length);
    return { name, score: avg };
  });
};

// Benchmark / referentie-profielen — indicatieve waarden voor vergelijking
// Per dimensie een verwachte soevereiniteits-score (0-100). Niet-vermelde dimensies vallen weg.
const BENCHMARKS = {
  'overheid': {
    label: 'Publieke sector / Rijksoverheid',
    description: 'Verwachte soevereiniteit voor overheidsorganisaties met BBi/NIS2 verplichtingen.',
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
  },
  'finance': {
    label: 'Financiële sector (bank/verzekeraar)',
    description: 'DNB/EBA-richtsnoeren, DORA & operationele weerbaarheid.',
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
  },
  'healthcare': {
    label: 'Zorg & medisch',
    description: 'Patiëntdata onder AVG + NEN 7510; hoge eisen aan data-soevereiniteit.',
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
  },
};

// ── Radar / Spider chart — pure SVG, no dependencies ────────────────────────
const RadarChart = ({ dimensionScores, benchmark, size = 420 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.34;       // radius of the outer ring
  const labelR = size * 0.455;  // radius for label placement
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
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
        Gebruik een score van 1 (niet soeverein) tot 5 (volledig soeverein) per vraag.
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
            return (
              <div key={q.id} className="audit-question-card">
                <div className="audit-q-number">Stelling {qi + 1}</div>
                <p className="audit-q-text">{q.question_text}</p>
                {q.toelichting && <p className="audit-q-hint">{q.toelichting}</p>}

                <div className="audit-score-grid">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleScoreChange(q.id, s)}
                      className={`audit-score-btn ${currentScore === s ? 'active' : ''}`}
                      style={currentScore === s ? { background: '#000', color: '#fff', borderColor: '#000' } : {}}
                    >
                      <span className="score-number">{s}</span>
                      <span className="score-text">{SCORE_LABELS[s]}</span>
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
    const seal = getSealLevel(overallScore);
    const eucs = getEucsFit(dimensionScores, overallScore);
    const dictuLensScores = getDictuLensScores(dimensionScores);

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
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#ccc', marginBottom: 0 }}>
              {overallScore >= 80 && 'Het systeem is sterk soeverein ingericht. Uw organisatie heeft grotendeels controle over data, technologie en operaties.'}
              {overallScore >= 60 && overallScore < 80 && 'Het systeem toont een goede mate van soevereiniteit, maar er zijn verbeterpunten op specifieke dimensies.'}
              {overallScore >= 40 && overallScore < 60 && 'Het systeem heeft een gemiddelde soevereiniteitsscore. Er zijn significante afhankelijkheden van externe partijen.'}
              {overallScore < 40 && 'Het systeem heeft een lage soevereiniteitsscore. Er zijn kritieke afhankelijkheden die de digitale autonomie beperken.'}
            </p>
          </div>
        </div>

        <div className="card shadow-sm p-4 mb-5" style={{ borderLeft: '4px solid #86BC25' }}>
          <h3 className="mb-3">EU/DICTU Kaderduiding</h3>
          <div className="row g-4">
            <div className="col-md-4">
              <p className="text-muted mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Indicatieve SEAL
              </p>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{seal.level}</div>
              <p className="text-muted small mb-0">{seal.label}</p>
            </div>
            <div className="col-md-4">
              <p className="text-muted mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                EUCS Assurance Fit
              </p>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{eucs.level}</div>
              <p className="text-muted small mb-0">{eucs.note}</p>
            </div>
            <div className="col-md-4">
              <p className="text-muted mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Bronkaders
              </p>
              <p className="small mb-0" style={{ lineHeight: 1.5 }}>
                DICTU Toetsingsinstrument (v1.0.1, 2026) en EUCS-kader (Basic/Substantial/High).
              </p>
            </div>
          </div>
          <hr />
          <p className="mb-2" style={{ fontWeight: 700 }}>DICTU-dimensielens (afgeleid)</p>
          {dictuLensScores.map((item) => (
            <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '6px 0' }}>
              <span>{item.name}</span>
              <span style={{ fontWeight: 700, color: item.score === null ? '#999' : getScoreColor(item.score || 0) }}>
                {item.score === null ? 'n.v.t.' : `${item.score}%`}
              </span>
            </div>
          ))}
          <p className="text-muted small mb-0 mt-3">
            Deze duiding is indicatief en geen formele certificering of juridisch oordeel.
          </p>
        </div>

        {/* Per dimension scores — spider chart + bars */}
        <div className="card shadow-sm p-4 mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h3 className="mb-0">Score per Dimensie</h3>
            <div className="d-flex align-items-center gap-2 no-print">
              <label htmlFor="benchmark-select" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', fontWeight: '700', marginBottom: 0 }}>
                Vergelijk met:
              </label>
              <select id="benchmark-select" className="form-select form-select-sm" style={{ width: 'auto' }}
                value={selectedBenchmark} onChange={e => setSelectedBenchmark(e.target.value)}>
                <option value="">— Geen referentie —</option>
                {Object.entries(BENCHMARKS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          {selectedBenchmark && BENCHMARKS[selectedBenchmark] && (
            <p className="text-muted small mb-3" style={{ fontSize: '13px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '2px', background: '#0066cc', verticalAlign: 'middle', marginRight: '8px', borderTop: '2px dashed #0066cc' }}></span>
              {BENCHMARKS[selectedBenchmark].description}
            </p>
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
