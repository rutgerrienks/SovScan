import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Replicate backend scoring in the frontend for live preview
// IMPORTANT: keep in sync with backend scoring in api.js POST /assessments
const calculateLiveScores = (questions, answers, factors) => {
  let totalMaxOP = 0, totalMaxOPP = 0, totalMaxEUC = 0, totalMaxHYP = 0;
  let scoreOP = 0, scoreOPP = 0, scoreEUC = 0, scoreHYP = 0;
  let koOP = false, koOPP = false, koEUC = false, koHYP = false;

  questions.forEach(q => {
    const sliderVal = answers[q.id] !== undefined ? parseFloat(answers[q.id]) : 50;
    const t = sliderVal / 100;
    const userFactor = parseFloat(factors[q.id] || 1);
    const effectiveFactor = (q.base_factor || 1) * userFactor * (parseFloat(q.dimensie_gewicht) || 1.0);

    // Answer confidence: neutral answers weigh half as much as decisive ones
    const answerConfidence = 0.5 + 0.5 * (Math.abs(sliderVal - 50) / 50);
    const weightedFactor = effectiveFactor * answerConfidence;

    totalMaxOP  += Math.max(q.op_ja  || 0, q.op_nee  || 0) * effectiveFactor;
    totalMaxOPP += Math.max(q.opp_ja || 0, q.opp_nee || 0) * effectiveFactor;
    totalMaxEUC += Math.max(q.euc_ja || 0, q.euc_nee || 0) * effectiveFactor;
    totalMaxHYP += Math.max(q.hyp_ja || 0, q.hyp_nee || 0) * effectiveFactor;

    scoreOP  += ((q.op_nee  || 0) + ((q.op_ja  || 0) - (q.op_nee  || 0)) * t) * weightedFactor;
    scoreOPP += ((q.opp_nee || 0) + ((q.opp_ja || 0) - (q.opp_nee || 0)) * t) * weightedFactor;
    scoreEUC += ((q.euc_nee || 0) + ((q.euc_ja || 0) - (q.euc_nee || 0)) * t) * weightedFactor;
    scoreHYP += ((q.hyp_nee || 0) + ((q.hyp_ja || 0) - (q.hyp_nee || 0)) * t) * weightedFactor;

    // KO: >= 75 = decisive Ja, <= 25 = decisive Nee; neutral / licht-eens triggert geen KO
    if (sliderVal >= 75 && q.ko_on_ja) {
      const kos = q.ko_on_ja.split(',').map(s => s.trim());
      if (kos.includes('OP'))  koOP  = true;
      if (kos.includes('OPP')) koOPP = true;
      if (kos.includes('EUC')) koEUC = true;
      if (kos.includes('HYP')) koHYP = true;
    }
    if (sliderVal <= 25 && q.ko_on_nee) {
      const kos = q.ko_on_nee.split(',').map(s => s.trim());
      if (kos.includes('OP'))  koOP  = true;
      if (kos.includes('OPP')) koOPP = true;
      if (kos.includes('EUC')) koEUC = true;
      if (kos.includes('HYP')) koHYP = true;
    }
  });

  return {
    op:  totalMaxOP  > 0 ? (scoreOP  / totalMaxOP)  * 100 : 0,
    opp: totalMaxOPP > 0 ? (scoreOPP / totalMaxOPP) * 100 : 0,
    euc: totalMaxEUC > 0 ? (scoreEUC / totalMaxEUC) * 100 : 0,
    hyp: totalMaxHYP > 0 ? (scoreHYP / totalMaxHYP) * 100 : 0,
    koOP, koOPP, koEUC, koHYP
  };
};

// Helper: slider value → human label
const sliderLabel = (val) => {
  const v = parseFloat(val);
  if (v >= 85) return 'Ja (sterk)';
  if (v >= 60) return 'Ja (licht)';
  if (v >= 40) return 'Neutraal';
  if (v >= 15) return 'Nee (licht)';
  return 'Nee (sterk)';
};

const ScoreBar = ({ label, score, ko, tooltip }) => (
  <div style={{ marginBottom: '10px' }} title={tooltip}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
      <span>{label}</span>
      <span style={{ color: ko ? '#ff4444' : 'inherit' }}>{ko ? 'KO' : Math.round(score) + '%'}</span>
    </div>
    <div style={{ height: '6px', background: '#e5e5e5', borderRadius: '0' }}>
      <div style={{ height: '100%', width: ko ? '100%' : `${score}%`, background: ko ? '#ff4444' : 'var(--d-green)', transition: 'width 0.4s ease' }} />
    </div>
  </div>
);

const LiveScorePanel = ({ questions, answers, factors }) => {
  const scores = calculateLiveScores(questions, answers, factors);
  const answeredCount = Object.keys(answers).length;
  return (
    <div style={{ position: 'sticky', top: '80px', background: '#000', color: '#fff', padding: '24px', minWidth: '220px' }}>
      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--d-green)', marginBottom: '16px', fontWeight: '700' }}>
        Live Scorepreview
      </p>
      <ScoreBar label="On-Premise"    score={scores.op}  ko={scores.koOP}  />
      <ScoreBar label="OP Partner"    score={scores.opp} ko={scores.koOPP} tooltip="On-Premise Partner: lokale infrastructuur, beheerd door een vertrouwde partner o.b.v. SLA" />
      <ScoreBar label="EU Cloud"      score={scores.euc} ko={scores.koEUC} />
      <ScoreBar label="Hyperscaler"   score={scores.hyp} ko={scores.koHYP} />
      <p style={{ fontSize: '10px', color: '#888', marginTop: '16px', marginBottom: 0 }}>
        {answeredCount} / {questions.length} ingevuld
      </p>
    </div>
  );
};

const Assessment = ({ user, onLogout, onHome }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [factors, setFactors] = useState({});
  const [projectName, setProjectName] = useState('');
  const [step, setStep] = useState('list');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessments, setAssessments] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/questions`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Error fetching questions", err);
    }
  };

  const fetchAssessments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/assessments?userId=${user.id}`);
      setAssessments(res.data);
    } catch (err) {
      console.error("Error fetching assessments", err);
    }
  };

  const handleSliderChange = useCallback((qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (factors[qId] === undefined) setFactors(prev => ({ ...prev, [qId]: 1 }));
  }, [factors]);

  const handleFactorChange = useCallback((qId, value) => {
    setFactors(prev => ({ ...prev, [qId]: parseFloat(value) }));
  }, []);

  const startWizard = (e) => {
    if (e) e.preventDefault();
    if (!projectName.trim()) return;
    setStep('wizard');
    setCurrentQuestionIndex(0);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    const answerArray = questions.map(q => ({
      questionId: q.id,
      value: answers[q.id] !== undefined ? answers[q.id] : 50,
      factor: factors[q.id] || 1
    }));

    try {
      const res = await axios.post(`${API_BASE_URL}/assessments`, { userId: user.id, projectName, answers: answerArray });
      const detailRes = await axios.get(`${API_BASE_URL}/assessments/${res.data.id}`);
      setCurrentResult(detailRes.data);
      setStep('result');
      fetchAssessments();
    } catch (err) {
      console.error("Error submitting assessment", err);
      alert("Er is een fout opgetreden.");
    } finally {
      setLoading(false);
    }
  };

  const openAssessment = async (a) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/assessments/${a.id}`);
      setCurrentResult(res.data);
      setStep('result');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setEmailStatus('Verzenden...');
    try {
      await axios.post(`${API_BASE_URL}/assessments/${currentResult.id}/email`, { email: emailInput });
      setEmailStatus('Email succesvol verzonden!');
      setEmailInput('');
    } catch (err) {
      setEmailStatus('Fout bij verzenden.');
    }
  };

  const renderNewAssessment = () => (
    <div className="main-container">
      <h1 className="mb-2">Nieuwe Analyse</h1>
      <p className="text-muted mb-5" style={{fontSize: '20px'}}>
        Welkom bij de SovScan Sovereignty Assessment. Het doel van dit onderzoek is om op basis van uw specifieke projecteisen 
        een objectieve vergelijking te maken tussen verschillende hosting-modellen. Door de vragenlijst in te vullen, 
        krijgt u direct inzicht in de soevereiniteitsscore van uw project voor On-Premise, Partner Cloud, EU Cloud en Hyperscaler scenario's.
      </p>
      <div className="card shadow-sm bg-light">
        <form onSubmit={startWizard}>
          <div className="form-group mb-5">
            <label className="form-label">Naam van uw Project of Use-case</label>
            <input 
              type="text" className="form-control form-control-lg" value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Bijv. Migratie Klantportaal 2026" required
            />
          </div>
          <button type="submit" className="btn btn-primary px-5 py-3">Start Vragenlijst</button>
        </form>
      </div>
    </div>
  );

  const renderWizard = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const sliderVal = answers[currentQuestion.id] !== undefined ? answers[currentQuestion.id] : 50;
    const factorVal = factors[currentQuestion.id] !== undefined ? factors[currentQuestion.id] : 1;
    const isBinary = currentQuestion.answer_type === 'binary';

    // Per-question impact: show which scenarios this question affects
    const hasJaEffect = ['op_ja','opp_ja','euc_ja','hyp_ja'].some(k => (currentQuestion[k] || 0) > 0);
    const scenarioLabels = { op: 'On-Premise', opp: 'OP Partner (managed door partner o.b.v. SLA)', euc: 'EU Cloud', hyp: 'Hyperscaler' };
    const scenarioShort  = { op: 'On-Premise', opp: 'OP Partner', euc: 'EU Cloud', hyp: 'Hyperscaler' };
    // Only show scenarios where ja and nee score differ (so slider actually changes something)
    const impactScenarios = Object.entries(scenarioLabels).filter(([k]) =>
      (currentQuestion[`${k}_ja`] || 0) !== (currentQuestion[`${k}_nee`] || 0)
    );

    // Categorisering: positie van huidige vraag in dimensie
    const dimensieQuestions = questions.filter(q => q.dimensie === currentQuestion.dimensie);
    const dimensieIndex = dimensieQuestions.findIndex(q => q.id === currentQuestion.id) + 1;

    return (
      <div style={{ display: 'flex', gap: '40px', padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Main question area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-3">
              <button className="btn btn-outline-dark btn-sm py-1 px-3"
                onClick={() => { setShowInfo(false); setCurrentQuestionIndex(prev => Math.max(0, prev - 1)); }}
                disabled={currentQuestionIndex === 0} style={{fontSize: '10px'}}
              >&larr; VORIGE</button>
              {currentQuestionIndex < questions.length - 1 && (
                <button className="btn btn-outline-dark btn-sm py-1 px-3"
                  onClick={() => { setShowInfo(false); setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1)); }}
                  style={{fontSize: '10px'}}
                >VOLGENDE &rarr;</button>
              )}
            </div>
            <span className="text-muted small fw-bold">
              <span style={{ color: 'var(--d-green)' }}>{currentQuestion.dimensie}</span>
              {' '}· VRAAG {dimensieIndex}/{dimensieQuestions.length}
              {' '}· STAP {currentQuestionIndex + 1}/{questions.length} ({Math.round(progress)}%)
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="question-step mt-5">
            <div className="mb-4">
              <span className="badge bg-deloitte-black">{currentQuestion.cluster}</span>
              <span className="badge bg-deloitte-green">{currentQuestion.dimensie}</span>
            </div>
            <h1 style={{fontSize: '32px', lineHeight: '1.2'}} className="mb-3">{currentQuestion.question_text}</h1>
            {currentQuestion.toelichting && <p className="text-muted mb-4" style={{fontSize: '17px'}}><i>{currentQuestion.toelichting}</i></p>}

            {/* Toelichting toggle */}
            {currentQuestion.info_text && (
              <div style={{ marginBottom: '24px' }}>
                <button type="button"
                  onClick={() => setShowInfo(s => !s)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--d-green)',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--d-green)',
                    fontWeight: '700'
                  }}
                >
                  {showInfo ? '✕ Sluit toelichting' : 'ℹ Toelichting'}
                </button>
                {showInfo && (
                  <div style={{
                    marginTop: '12px', padding: '16px 20px',
                    background: '#f7f7f7', borderLeft: '3px solid var(--d-green)',
                    fontSize: '14px', lineHeight: '1.6', color: '#333',
                    whiteSpace: 'pre-line'
                  }}>
                    {currentQuestion.info_text}
                  </div>
                )}
              </div>
            )}

            {/* Impact indicators */}
            {impactScenarios.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', marginRight: '4px', lineHeight: '22px' }}>Primair gericht op:</span>
                {impactScenarios.map(([k, label]) => {
                  const jaScore = currentQuestion[`${k}_ja`] || 0;
                  const neeScore = currentQuestion[`${k}_nee`] || 0;
                  const maxScore = Math.max(jaScore, neeScore);
                  // Score at current slider position vs. neutral (50)
                  const t = sliderVal / 100;
                  const currentContrib = neeScore + (jaScore - neeScore) * t;
                  const neutralContrib = neeScore + (jaScore - neeScore) * 0.5;
                  const delta = currentContrib - neutralContrib;
                  // Only show directional arrow when deviation from neutral is meaningful
                  const threshold = maxScore * 0.1;
                  let arrow, bg;
                  if (delta > threshold)       { arrow = '↑'; bg = 'var(--d-green)'; }
                  else if (delta < -threshold) { arrow = '↓'; bg = '#222'; }
                  else                         { arrow = '→'; bg = '#888'; }
                  return (
                    <span key={k} title={label} style={{
                      padding: '2px 10px', fontSize: '11px', fontWeight: '700',
                      background: bg, color: '#fff',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      transition: 'background 0.2s'
                    }}>{scenarioShort[k]} {arrow}</span>
                  );
                })}
                {/* KO badge: only show when slider is in decisive territory (>=75 Ja / <=25 Nee) */}
                {(sliderVal >= 75 && currentQuestion.ko_on_ja) && (
                  <span style={{ padding: '2px 10px', fontSize: '11px', fontWeight: '700', background: '#ff4444', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    KO: {currentQuestion.ko_on_ja}
                  </span>
                )}
                {(sliderVal <= 25 && currentQuestion.ko_on_nee) && (
                  <span style={{ padding: '2px 10px', fontSize: '11px', fontWeight: '700', background: '#ff4444', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    KO: {currentQuestion.ko_on_nee}
                  </span>
                )}
                {/* Soft-KO warning in grey zone */}
                {(sliderVal > 25 && sliderVal < 75 && (currentQuestion.ko_on_ja || currentQuestion.ko_on_nee)) && (
                  <span style={{ padding: '2px 10px', fontSize: '11px', fontWeight: '700', background: '#ff8800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚠ KO mogelijk
                  </span>
                )}
              </div>
            )}

            {/* Answer input — slider voor 'scale', knoppen voor 'binary' */}
            {isBinary ? (
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button"
                  onClick={() => handleSliderChange(currentQuestion.id, 0)}
                  className={`btn ${sliderVal === 0 ? 'btn-dark' : 'btn-outline-dark'} flex-grow-1 py-3`}
                  style={{ fontSize: '16px', fontWeight: '700' }}
                >Nee</button>
                <button type="button"
                  onClick={() => handleSliderChange(currentQuestion.id, 100)}
                  className={`btn ${sliderVal === 100 ? 'btn-dark' : 'btn-outline-dark'} flex-grow-1 py-3`}
                  style={{ fontSize: '16px', fontWeight: '700' }}
                >Ja</button>
              </div>
            ) : (
            <div className="answer-slider-container">
              <div className="slider-labels">
                <span>Nee / Niet van toepassing</span>
                <span style={{ color: sliderVal >= 40 && sliderVal <= 60 ? 'var(--d-green)' : '#888' }}>Neutraal</span>
                <span>Ja / Volledig van toepassing</span>
              </div>
              <input
                type="range" min="0" max="100" step="1"
                value={sliderVal}
                onChange={(e) => handleSliderChange(currentQuestion.id, parseInt(e.target.value))}
                className="answer-slider"
              />
            </div>
            )}

            {/* Priority slider */}
            <div className="mt-5 pt-4 border-top">
              <p className="form-label mb-3 text-uppercase" style={{letterSpacing: '1px', fontSize: '12px'}}>
                Belang van dit criterium voor uw project
              </p>
              <div className="priority-slider-container">
                <div className="slider-labels" style={{ fontSize: '12px' }}>
                  <span>Niet van belang</span>
                  <span>Standaard</span>
                  <span>Zeer belangrijk</span>
                </div>
                <input
                  type="range" min="0" max="20" step="1"
                  value={Math.round(factorVal * 10)}
                  onChange={(e) => handleFactorChange(currentQuestion.id, parseInt(e.target.value) / 10)}
                  className="priority-slider"
                />
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  Wegingsfactor: <strong style={{ color: '#000' }}>{factorVal.toFixed(1)}×</strong>
                  {factorVal === 0 && <span style={{ marginLeft: '8px', color: '#888' }}>(criterium telt niet mee)</span>}
                </div>
              </div>
            </div>
          </div>

          {currentQuestionIndex === questions.length - 1 && (
            <div className="text-center mt-5 pt-4">
              <button className="btn btn-success px-5 py-3" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Berekenen...' : 'Bereken Eindresultaat'}
              </button>
            </div>
          )}
        </div>

        {/* Live score panel */}
        <div style={{ width: '220px', flexShrink: 0 }} className="no-print">
          <LiveScorePanel questions={questions} answers={answers} factors={factors} />
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="main-container">
      <h1 className="mb-2">Analyse Resultaat</h1>
      <p className="text-muted mb-5" style={{fontSize: '20px'}}>Project: <strong>{currentResult.project_name}</strong></p>
      
      <div className="result-grid shadow-sm mb-5">
        {[
          { label: 'On-Premise', score: currentResult.score_op, ko: currentResult.is_ko_op },
          { label: 'OP Partner', score: currentResult.score_opp, ko: currentResult.is_ko_opp },
          { label: 'EU Cloud', score: currentResult.score_euc, ko: currentResult.is_ko_euc },
          { label: 'Hyperscaler', score: currentResult.score_hyp, ko: currentResult.is_ko_hyp }
        ].map(s => {
          const tooltip = s.label === 'OP Partner'
            ? 'On-Premise Partner: lokale infrastructuur die door een vertrouwde partner wordt beheerd op basis van een SLA.'
            : undefined;
          let interpretation = '';
          if (s.ko) interpretation = 'Niet geschikt (Knock-out)';
          else if (s.score >= 80) interpretation = 'Uitstekende match';
          else if (s.score >= 60) interpretation = 'Goede match';
          else if (s.score >= 40) interpretation = 'Matige match';
          else interpretation = 'Zwakke match';

          return (
            <div className="result-item" key={s.label} title={tooltip}>
              <div className="result-label">{s.label}</div>
              <div className="result-value" style={{color: s.ko ? '#ccc' : 'inherit'}}>
                {s.ko ? '--' : Math.round(s.score) + '%'}
              </div>
              <div className="small text-muted mt-2 fw-bold" style={{minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {interpretation}
              </div>
              {s.ko && <div className="ko-badge">Knock-out</div>}
            </div>
          );
        })}
      </div>

      <div className="card shadow-sm p-4 mt-5 bg-light border-0">
        <h3 className="mb-3">Duiding van het resultaat & Advies</h3>
        <div className="mb-4" style={{fontSize: '18px', lineHeight: '1.6'}}>
          <p>
            Op basis van de ingevulde vragenlijst voor <strong>{currentResult.project_name}</strong> zien we dat 
            {(() => {
              const scores = [
                { name: 'On-Premise', val: currentResult.is_ko_op ? -1 : currentResult.score_op },
                { name: 'OP Partner', val: currentResult.is_ko_opp ? -1 : currentResult.score_opp },
                { name: 'EU Cloud', val: currentResult.is_ko_euc ? -1 : currentResult.score_euc },
                { name: 'Hyperscaler', val: currentResult.is_ko_hyp ? -1 : currentResult.score_hyp }
              ].sort((a, b) => b.val - a.val);
              const best = scores[0];
              if (best.val === -1) return " geen van de scenario's momenteel geschikt is vanwege kritieke knock-out criteria.";
              let text = ` het scenario <strong>${best.name}</strong> de sterkste match heeft (${Math.round(best.val)}%). `;
              if (best.name === 'On-Premise') text += "Dit duidt op een sterke behoefte aan volledige controle, fysieke soevereiniteit of specifieke legacy-integratie.";
              else if (best.name === 'OP Partner') text += "Dit suggereert dat een lokaal beheerde cloudomgeving door een vertrouwde partner de beste balans biedt tussen ontzorging en controle.";
              else if (best.name === 'EU Cloud') text += "Dit wijst op een voorkeur voor moderne cloud-functionaliteit binnen de veilige kaders van Europese wet- en regelgeving.";
              else text += "Dit duidt op een behoefte aan maximale schaalbaarheid en innovatieve diensten, waarbij de risico's op het gebied van soevereiniteit als acceptabel worden beschouwd.";
              return <span dangerouslySetInnerHTML={{ __html: text }} />;
            })()}
          </p>
        </div>

        {(currentResult.is_ko_op || currentResult.is_ko_opp || currentResult.is_ko_euc || currentResult.is_ko_hyp) && (
          <div className="mt-4 p-3 bg-white rounded border border-danger">
            <h4 className="text-danger mb-3" style={{fontSize: '18px'}}>⚠️ Knock-Out Analyse</h4>
            <p className="small mb-3">De volgende vragen hebben geleid tot een 'Knock-Out' voor een of meerdere oplossingen:</p>
            <ul className="list-unstyled mb-0">
              {currentResult.details && currentResult.details.filter(d => {
                const v = parseFloat(d.answer_value);
                if (v >= 75 && d.ko_on_ja && d.ko_on_ja.trim().length > 0) return true;
                if (v <= 25 && d.ko_on_nee && d.ko_on_nee.trim().length > 0) return true;
                return false;
              }).map((d, idx) => {
                const isJa = parseFloat(d.answer_value) >= 75;
                const kos = (isJa ? d.ko_on_ja : d.ko_on_nee).split(',');
                const solutionNames = { 'OP': 'On-Premise', 'OPP': 'OP Partner', 'EUC': 'EU Cloud', 'HYP': 'Hyperscaler' };
                return (
                  <li key={idx} className="mb-3 pb-3 border-bottom">
                    <strong>Vraag:</strong> {d.question_text}<br/>
                    <span className="text-muted">Uw antwoord: <strong>{sliderLabel(d.answer_value)}</strong></span><br/>
                    <span className="badge bg-danger mt-1">Knock-out voor: {kos.map(k => solutionNames[k.trim()] || k).join(', ')}</span>
                    {d.ko_reason && (
                      <div className="mt-2 small" style={{ paddingLeft: '12px', borderLeft: '3px solid #ff4444' }}>
                        <strong>Reden:</strong> {d.ko_reason}
                      </div>
                    )}
                    {d.ko_mitigation && (
                      <div className="mt-2 small" style={{ paddingLeft: '12px', borderLeft: '3px solid var(--d-green)' }}>
                        <strong>Mogelijke mitigatie / gesprekspunt:</strong> {d.ko_mitigation}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Vervolgadvies bij smal resultaat (#9) */}
        {(() => {
          const blocked = [
            currentResult.is_ko_op,
            currentResult.is_ko_opp,
            currentResult.is_ko_euc,
            currentResult.is_ko_hyp
          ].filter(Boolean).length;
          const remaining = 4 - blocked;
          if (remaining > 1) return null;
          const blockedNames = [];
          if (currentResult.is_ko_op)  blockedNames.push('On-Premise');
          if (currentResult.is_ko_opp) blockedNames.push('OP Partner');
          if (currentResult.is_ko_euc) blockedNames.push('EU Cloud');
          if (currentResult.is_ko_hyp) blockedNames.push('Hyperscaler');
          return (
            <div className="mt-4 p-4" style={{ background: '#000', color: '#fff' }}>
              <h4 className="mb-3" style={{ fontSize: '18px', color: 'var(--d-green)' }}>
                💡 Vervolgstappen: het palet verbreden
              </h4>
              <p className="mb-3" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                {remaining === 0
                  ? <>Op basis van uw antwoorden zijn momenteel <strong>geen</strong> scenario's volledig kansrijk. Dit is een eerste indicatie — niet noodzakelijk een eindoordeel.</>
                  : <>Op basis van uw antwoorden blijft slechts <strong>één scenario</strong> over. In de praktijk kan het palet vaak verbreed worden door de scope of het juridisch landschap nader te definiëren.</>
                }
              </p>
              <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '12px' }}>Mogelijke vervolgstappen:</p>
              <ul style={{ fontSize: '14px', color: '#ddd', lineHeight: '1.8' }}>
                <li>Een <strong>Sovereignty Workshop</strong> met juridische, security- en architectuur-stakeholders om data-classificatie en wettelijke kaders aan te scherpen.</li>
                <li>Per geblokkeerd scenario ({blockedNames.join(', ') || '—'}) onderzoeken of <strong>mitigerende maatregelen</strong> mogelijk zijn (bv. EU Sovereign Cloud-varianten, contractuele data-residency, encryption-at-rest met klant-key, etc.).</li>
                <li><strong>Scope-segmentatie</strong>: niet elk component hoeft hetzelfde scenario te kiezen — kritieke data lokaal, minder gevoelige workloads in cloud.</li>
                <li>Validatie van de zwaarst wegende KO-criteria: zijn deze écht "harde" eisen of risico-acceptaties?</li>
              </ul>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '16px', marginBottom: 0 }}>
                Neem contact op met uw Deloitte-contactpersoon voor een verdiepende analyse.
              </p>
            </div>
          );
        })()}
      </div>

      <div className="card shadow-sm p-4 mt-5">
        <h3 className="mb-4">Gegeven Antwoorden</h3>
        {(() => {
          // Categorisering: groepeer per dimensie (#10)
          const grouped = {};
          (currentResult.details || []).forEach(d => {
            const key = d.dimensie || 'Overig';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(d);
          });
          return Object.entries(grouped).map(([dim, items]) => (
            <div key={dim} style={{ marginBottom: '24px' }}>
              <h5 style={{ fontWeight: '700', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px' }}>{dim}</h5>
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Vraag</th>
                    <th className="text-center" style={{ width: '180px' }}>Antwoord</th>
                    <th className="text-center" style={{ width: '160px' }}>Belang</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, i) => {
                    const factor = parseFloat(d.user_factor);
                    let priorityLabel = 'Standaard';
                    if (factor < 0.9) priorityLabel = 'Lager';
                    if (factor > 1.1) priorityLabel = 'Hoger';
                    if (factor === 0) priorityLabel = 'Niet meegenomen';
                    return (
                      <tr key={i}>
                        <td className="py-2">{d.question_text}</td>
                        <td className="fw-bold align-middle text-center">{sliderLabel(d.answer_value)}</td>
                        <td className="align-middle text-muted text-center">{priorityLabel} ({factor.toFixed(1)}×)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ));
        })()}
      </div>

      <div className="row mt-5 pt-5 no-print">
        <div className="col-md-6">
          <div className="card bg-light">
            <p className="mb-4">E-mail dit resultaat naar uzelf of een stakeholder:</p>
            <form onSubmit={handleEmail}>
              <div className="form-group mb-3">
                <input type="email" className="form-control" placeholder="naam@organisatie.nl"
                  value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
              </div>
              <button className="btn btn-primary w-100 py-3" type="submit">Verzend Rapport</button>
              {emailStatus && <p className="mt-3 small fw-bold text-success">{emailStatus}</p>}
            </form>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border h-100 d-flex flex-column justify-content-between">
            <p className="mb-4">Genereer een print-vriendelijke PDF of keer terug naar het overzicht.</p>
            <div className="d-flex gap-3">
              <button className="btn btn-outline-dark flex-grow-1" onClick={() => window.print()}>Print / PDF</button>
              <button className="btn btn-primary flex-grow-1" onClick={() => { setStep('list'); setEmailStatus(''); }}>Overzicht</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 text-muted small border-top">
        <p><strong>DISCLAIMER</strong></p>
        <p>Dit rapport is gegenereerd door de Deloitte Sovereignty Assessment Tool op {new Date(currentResult.created_at).toLocaleDateString('nl-NL')}. De resultaten zijn indicatief en aan dit rapport kunnen geen rechten worden ontleend.</p>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="main-container">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 className="mb-0">Mijn Assessments</h1>
        <button className="btn btn-success" onClick={() => { setProjectName(''); setAnswers({}); setFactors({}); setStep('new'); }}>
          Nieuwe Analyse
        </button>
      </div>
      <div className="card shadow-sm p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Project</th>
              <th>Score (Scenario's)</th>
              <th className="text-end">Acties</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(a => (
              <tr key={a.id}>
                <td className="align-middle text-muted" style={{fontSize: '14px'}}>{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="align-middle fw-bold" style={{fontSize: '18px'}}>{a.project_name}</td>
                <td className="align-middle">
                  <div className="d-flex gap-3 small">
                    <span title="On-Premise">OP: {a.is_ko_op ? 'KO' : Math.round(a.score_op)+'%'}</span>
                    <span title="EU Cloud">EUC: {a.is_ko_euc ? 'KO' : Math.round(a.score_euc)+'%'}</span>
                    <span title="Hyperscaler">HYP: {a.is_ko_hyp ? 'KO' : Math.round(a.score_hyp)+'%'}</span>
                  </div>
                </td>
                <td className="text-end align-middle">
                  <button className="btn btn-outline-dark btn-sm py-2" onClick={() => openAssessment(a)}>Openen</button>
                </td>
              </tr>
            ))}
            {assessments.length === 0 && (
              <tr><td colSpan="4" className="text-center py-5 text-muted">Geen assessments gevonden.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="nav-header shadow-sm no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div className="deloitte-logo" style={{ cursor: onHome ? 'pointer' : 'default' }} onClick={onHome}>Deloitte<span>.</span></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>Scenario Assessment</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          {onHome && (
            <button className="btn btn-outline-dark py-2" style={{fontSize: '12px', padding: '8px 20px'}} onClick={onHome}>
              Home
            </button>
          )}
          <button className="btn btn-outline-dark py-2" style={{fontSize: '12px', padding: '8px 20px'}} onClick={onLogout}>Uitloggen</button>
        </div>
      </header>
      {step === 'list' && renderList()}
      {step === 'new' && renderNewAssessment()}
      {step === 'wizard' && renderWizard()}
      {step === 'result' && renderResult()}
    </div>
  );
};

export default Assessment;
