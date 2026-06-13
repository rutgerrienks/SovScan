import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Replicate backend scoring for live preview (same as Assessment.js)
const calculateLiveScores = (questions, answers, factors) => {
  let totalMaxOP = 0, totalMaxOPP = 0, totalMaxEUC = 0, totalMaxHYP = 0;
  let scoreOP = 0, scoreOPP = 0, scoreEUC = 0, scoreHYP = 0;
  let koOP = false, koOPP = false, koEUC = false, koHYP = false;

  questions.forEach(q => {
    const sliderVal = answers[q.id] !== undefined ? parseFloat(answers[q.id]) : 50;
    const t = sliderVal / 100;
    const userFactor = parseFloat(factors[q.id] || 1);
    const effectiveFactor = (q.base_factor || 1) * userFactor * (parseFloat(q.dimensie_gewicht) || 1.0);
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

    if (sliderVal >= 65 && q.ko_on_ja) {
      const kos = q.ko_on_ja.split(',').map(s => s.trim());
      if (kos.includes('OP'))  koOP  = true;
      if (kos.includes('OPP')) koOPP = true;
      if (kos.includes('EUC')) koEUC = true;
      if (kos.includes('HYP')) koHYP = true;
    }
    if (sliderVal <= 35 && q.ko_on_nee) {
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

const sliderLabel = (val) => {
  const v = parseFloat(val);
  if (v >= 85) return 'Ja (sterk)';
  if (v >= 60) return 'Ja (licht)';
  if (v >= 40) return 'Neutraal';
  if (v >= 15) return 'Nee (licht)';
  return 'Nee (sterk)';
};

const ScoreBar = ({ label, score, ko }) => (
  <div style={{ marginBottom: '10px' }}>
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
      <ScoreBar label="OP Partner"    score={scores.opp} ko={scores.koOPP} />
      <ScoreBar label="EU Cloud"      score={scores.euc} ko={scores.koEUC} />
      <ScoreBar label="Hyperscaler"   score={scores.hyp} ko={scores.koHYP} />
      <p style={{ fontSize: '10px', color: '#888', marginTop: '16px', marginBottom: 0 }}>
        {answeredCount} / {questions.length} ingevuld
      </p>
    </div>
  );
};

const InviteAssessment = ({ token }) => {
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [factors, setFactors] = useState({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [step, setStep] = useState('loading'); // loading | intro | wizard | result | error
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const [inviteRes, questionsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/invites/${token}`),
          axios.get(`${API_BASE_URL}/questions`)
        ]);
        setInvite(inviteRes.data);
        setQuestions(questionsRes.data);
        setStep('intro');
      } catch (err) {
        setError(err.response?.data?.error || 'Ongeldige of verlopen uitnodiging');
        setStep('error');
      }
    };
    validateToken();
  }, [token]);

  const handleSliderChange = useCallback((qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (factors[qId] === undefined) setFactors(prev => ({ ...prev, [qId]: 1 }));
  }, [factors]);

  const handleFactorChange = useCallback((qId, value) => {
    setFactors(prev => ({ ...prev, [qId]: parseFloat(value) }));
  }, []);

  const startWizard = (e) => {
    if (e) e.preventDefault();
    setStep('wizard');
    setCurrentQuestionIndex(0);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    const answerArray = questions.map(q => ({
      questionId: q.id,
      value: answers[q.id] !== undefined ? answers[q.id] : 50,
      factor: factors[q.id] || 1
    }));

    try {
      const res = await axios.post(`${API_BASE_URL}/invites/${token}/submit`, {
        respondentName,
        respondentEmail,
        answers: answerArray
      });
      const detailRes = await axios.get(`${API_BASE_URL}/assessments/${res.data.id}`);
      setCurrentResult(detailRes.data);
      setStep('result');
    } catch (err) {
      const msg = err.response?.data?.error || 'Er is een fout opgetreden.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="App">
        <header className="nav-header shadow-sm">
          <div className="deloitte-logo">Deloitte<span>.</span></div>
        </header>
        <div className="main-container text-center py-5">
          <p className="text-muted">Uitnodiging laden...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="App">
        <header className="nav-header shadow-sm">
          <div className="deloitte-logo">Deloitte<span>.</span></div>
        </header>
        <div className="main-container text-center py-5">
          <div style={{ maxWidth: '500px', margin: '80px auto' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>Uitnodiging ongeldig</h2>
            <p className="text-muted" style={{ fontSize: '18px' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="App">
        <header className="nav-header shadow-sm">
          <div className="deloitte-logo">Deloitte<span>.</span></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>Scenario Assessment</span>
        </header>
        <div className="main-container">
          <h1 className="mb-2">Sovereignty Assessment</h1>
          <p className="text-muted mb-4" style={{ fontSize: '20px' }}>
            U bent uitgenodigd om een Sovereignty Assessment in te vullen voor het project: <strong>{invite.projectName}</strong>.
          </p>
          <p className="text-muted mb-5" style={{ fontSize: '16px' }}>
            Beantwoord de {questions.length} vragen en ontvang direct inzicht in de soevereiniteitsscore voor
            On-Premise, Partner Cloud, EU Cloud en Hyperscaler scenario's.
          </p>
          <div className="card shadow-sm bg-light">
            <form onSubmit={startWizard}>
              <div className="form-group mb-4">
                <label className="form-label">Uw naam</label>
                <input
                  type="text" className="form-control form-control-lg" value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Naam" required
                />
              </div>
              <div className="form-group mb-5">
                <label className="form-label">Uw e-mailadres (optioneel)</label>
                <input
                  type="email" className="form-control form-control-lg" value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="naam@organisatie.nl"
                />
              </div>
              <button type="submit" className="btn btn-primary px-5 py-3">Start Vragenlijst</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'wizard') {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const sliderVal = answers[currentQuestion.id] !== undefined ? answers[currentQuestion.id] : 50;
    const factorVal = factors[currentQuestion.id] !== undefined ? factors[currentQuestion.id] : 1;

    const scenarioLabels = { op: 'On-Premise', opp: 'OP Partner', euc: 'EU Cloud', hyp: 'Hyperscaler' };
    const impactScenarios = Object.entries(scenarioLabels).filter(([k]) =>
      (currentQuestion[`${k}_ja`] || 0) !== (currentQuestion[`${k}_nee`] || 0)
    );

    return (
      <div className="App">
        <header className="nav-header shadow-sm no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="deloitte-logo">Deloitte<span>.</span></div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>
              Assessment — {invite.projectName}
            </span>
          </div>
        </header>
        <div style={{ display: 'flex', gap: '40px', padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex gap-3">
                <button className="btn btn-outline-dark btn-sm py-1 px-3"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0} style={{ fontSize: '10px' }}
                >&larr; VORIGE</button>
                <button className="btn btn-outline-dark btn-sm py-1 px-3"
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  style={{ fontSize: '10px' }}
                >VOLGENDE &rarr;</button>
              </div>
              <span className="text-muted small fw-bold">STAP {currentQuestionIndex + 1} VAN {questions.length} ({Math.round(progress)}%)</span>
            </div>

            <div className="progress-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="question-step mt-5">
              <div className="mb-4">
                <span className="badge bg-deloitte-black">{currentQuestion.cluster}</span>
                <span className="badge bg-deloitte-green">{currentQuestion.dimensie}</span>
              </div>
              <h1 style={{ fontSize: '32px', lineHeight: '1.2' }} className="mb-3">{currentQuestion.question_text}</h1>
              {currentQuestion.toelichting && <p className="text-muted mb-4" style={{ fontSize: '17px' }}><i>{currentQuestion.toelichting}</i></p>}

              {impactScenarios.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', marginRight: '4px', lineHeight: '22px' }}>Beïnvloedt:</span>
                  {impactScenarios.map(([k, label]) => {
                    const jaScore = currentQuestion[`${k}_ja`] || 0;
                    const neeScore = currentQuestion[`${k}_nee`] || 0;
                    const maxScore = Math.max(jaScore, neeScore);
                    const t = sliderVal / 100;
                    const currentContrib = neeScore + (jaScore - neeScore) * t;
                    const neutralContrib = neeScore + (jaScore - neeScore) * 0.5;
                    const delta = currentContrib - neutralContrib;
                    const threshold = maxScore * 0.1;
                    let arrow, bg;
                    if (delta > threshold)       { arrow = '↑'; bg = 'var(--d-green)'; }
                    else if (delta < -threshold) { arrow = '↓'; bg = '#222'; }
                    else                         { arrow = '→'; bg = '#888'; }
                    return (
                      <span key={k} style={{
                        padding: '2px 10px', fontSize: '11px', fontWeight: '700',
                        background: bg, color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        transition: 'background 0.2s'
                      }}>{label} {arrow}</span>
                    );
                  })}
                  {(sliderVal >= 65 && currentQuestion.ko_on_ja) && (
                    <span style={{ padding: '2px 10px', fontSize: '11px', fontWeight: '700', background: '#ff4444', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      KO: {currentQuestion.ko_on_ja}
                    </span>
                  )}
                  {(sliderVal <= 35 && currentQuestion.ko_on_nee) && (
                    <span style={{ padding: '2px 10px', fontSize: '11px', fontWeight: '700', background: '#ff4444', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      KO: {currentQuestion.ko_on_nee}
                    </span>
                  )}
                  {(sliderVal > 35 && sliderVal < 65 && (currentQuestion.ko_on_ja || currentQuestion.ko_on_nee)) && (
                    <span style={{ padding: '2px 10px', fontSize: '11px', fontWeight: '700', background: '#ff8800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚠ KO mogelijk
                    </span>
                  )}
                </div>
              )}

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
                <div className="slider-value-display">
                  <span className={`slider-value-badge ${sliderVal >= 60 ? 'badge-ja' : sliderVal <= 40 ? 'badge-nee' : 'badge-neutraal'}`}>
                    {sliderLabel(sliderVal)}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-top">
                <p className="form-label mb-3 text-uppercase" style={{ letterSpacing: '1px', fontSize: '12px' }}>
                  Belang van dit criterium voor uw project
                </p>
                <div className="priority-slider-container">
                  <div className="slider-labels" style={{ fontSize: '12px' }}>
                    <span>Minder belangrijk</span>
                    <span>Standaard</span>
                    <span>Zeer belangrijk</span>
                  </div>
                  <input
                    type="range" min="5" max="20" step="1"
                    value={Math.round(factorVal * 10)}
                    onChange={(e) => handleFactorChange(currentQuestion.id, parseInt(e.target.value) / 10)}
                    className="priority-slider"
                  />
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    Wegingsfactor: <strong style={{ color: '#000' }}>{factorVal.toFixed(1)}×</strong>
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

          <div style={{ width: '220px', flexShrink: 0 }} className="no-print">
            <LiveScorePanel questions={questions} answers={answers} factors={factors} />
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="App">
        <header className="nav-header shadow-sm no-print">
          <div className="deloitte-logo">Deloitte<span>.</span></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', fontWeight: '700' }}>Assessment Resultaat</span>
        </header>
        <div className="main-container">
          <h1 className="mb-2">Analyse Resultaat</h1>
          <p className="text-muted mb-5" style={{ fontSize: '20px' }}>
            Project: <strong>{currentResult.project_name}</strong>
            {respondentName && <> — ingevuld door <strong>{respondentName}</strong></>}
          </p>

          <div className="result-grid shadow-sm mb-5">
            {[
              { label: 'On-Premise', score: currentResult.score_op, ko: currentResult.is_ko_op },
              { label: 'OP Partner', score: currentResult.score_opp, ko: currentResult.is_ko_opp },
              { label: 'EU Cloud', score: currentResult.score_euc, ko: currentResult.is_ko_euc },
              { label: 'Hyperscaler', score: currentResult.score_hyp, ko: currentResult.is_ko_hyp }
            ].map(s => {
              let interpretation = '';
              if (s.ko) interpretation = 'Niet geschikt (Knock-out)';
              else if (s.score >= 80) interpretation = 'Uitstekende match';
              else if (s.score >= 60) interpretation = 'Goede match';
              else if (s.score >= 40) interpretation = 'Matige match';
              else interpretation = 'Zwakke match';

              return (
                <div className="result-item" key={s.label}>
                  <div className="result-label">{s.label}</div>
                  <div className="result-value" style={{ color: s.ko ? '#ccc' : 'inherit' }}>
                    {s.ko ? '--' : Math.round(s.score) + '%'}
                  </div>
                  <div className="small text-muted mt-2 fw-bold" style={{ minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {interpretation}
                  </div>
                  {s.ko && <div className="ko-badge">Knock-out</div>}
                </div>
              );
            })}
          </div>

          <div className="card shadow-sm p-4 mt-5 bg-light border-0">
            <h3 className="mb-3">Duiding van het resultaat</h3>
            <div className="mb-4" style={{ fontSize: '18px', lineHeight: '1.6' }}>
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
          </div>

          <div className="card shadow-sm p-4 mt-5">
            <h3 className="mb-4">Gegeven Antwoorden</h3>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Vraag</th>
                  <th className="text-center">Antwoord</th>
                  <th className="text-center">Belang</th>
                </tr>
              </thead>
              <tbody>
                {currentResult.details && currentResult.details.map((d, i) => {
                  const factor = parseFloat(d.user_factor);
                  let priorityLabel = 'Standaard';
                  if (factor < 0.9) priorityLabel = 'Lager';
                  if (factor > 1.1) priorityLabel = 'Hoger';
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

          <div className="text-center mt-5 pt-4 no-print">
            <button className="btn btn-outline-dark px-5 py-3" onClick={() => window.print()}>Print / PDF</button>
          </div>

          <div className="mt-5 pt-5 text-muted small border-top">
            <p><strong>DISCLAIMER</strong></p>
            <p>Dit rapport is gegenereerd door de Deloitte Sovereignty Assessment Tool op {new Date(currentResult.created_at).toLocaleDateString('nl-NL')}. De resultaten zijn indicatief en aan dit rapport kunnen geen rechten worden ontleend.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteAssessment;
