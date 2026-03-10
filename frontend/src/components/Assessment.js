import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api';

const Assessment = ({ user, onLogout }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [factors, setFactors] = useState({});
  const [projectName, setProjectName] = useState('');
  const [step, setStep] = useState('list'); // 'list', 'new', 'wizard', 'result'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessments, setAssessments] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (!factors[qId]) setFactors(prev => ({ ...prev, [qId]: 1 }));
    
    if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
        }, 500);
    }
  };

  const handleFactorChange = (qId, factor) => {
    setFactors(prev => ({ ...prev, [qId]: factor }));
  };

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
      value: answers[q.id] || 'Nee',
      factor: factors[q.id] || 1
    }));

    try {
      const res = await axios.post(`${API_BASE_URL}/assessments`, {
        userId: user.id,
        projectName,
        answers: answerArray
      });
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
              type="text" 
              className="form-control form-control-lg" 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Bijv. Migratie Klantportaal 2026"
              required
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

    return (
      <div className="main-container" style={{maxWidth: '900px'}}>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-3">
                <button 
                    className="btn btn-outline-dark btn-sm py-1 px-3" 
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    style={{fontSize: '10px'}}
                >
                    &larr; VORIGE
                </button>
                <button 
                    className="btn btn-outline-dark btn-sm py-1 px-3" 
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1 || !answers[currentQuestion.id]}
                    style={{fontSize: '10px'}}
                >
                    VOLGENDE &rarr;
                </button>
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
            <h1 style={{fontSize: '36px', lineHeight: '1.2'}} className="mb-4">{currentQuestion.question_text}</h1>
            {currentQuestion.toelichting && <p className="text-muted mb-5" style={{fontSize: '18px'}}><i>{currentQuestion.toelichting}</i></p>}
            
            <div className="answer-grid mt-5">
                <button 
                    className={`answer-btn ${answers[currentQuestion.id] === 'Ja' ? 'active-green' : ''}`}
                    onClick={() => handleAnswerChange(currentQuestion.id, 'Ja')}
                >
                    Ja
                </button>
                <button 
                    className={`answer-btn ${answers[currentQuestion.id] === 'Nee' ? 'active' : ''}`}
                    onClick={() => handleAnswerChange(currentQuestion.id, 'Nee')}
                >
                    Nee
                </button>
            </div>
        </div>

        <div className="mt-5 pt-5 border-top text-center">
            <p className="form-label mb-4 text-uppercase" style={{letterSpacing: '1px'}}>Prioriteit van dit criterium</p>
            <div className="d-flex justify-content-center gap-3">
                {[
                    { val: 0.5, label: 'Lager' },
                    { val: 1, label: 'Standaard' },
                    { val: 2, label: 'Hoger' }
                ].map(f => (
                    <button 
                        key={f.val}
                        type="button"
                        className={`btn btn-sm ${factors[currentQuestion.id] === f.val ? 'btn-primary' : 'btn-outline-dark'}`}
                        onClick={() => handleFactorChange(currentQuestion.id, f.val)}
                        style={{minWidth: '120px'}}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>

        {currentQuestionIndex === questions.length - 1 && (
            <div className="text-center mt-5 pt-4">
                <button className="btn btn-success px-5 py-3" onClick={handleSubmit} disabled={loading || !answers[currentQuestion.id]}>
                    {loading ? 'Berekenen...' : 'Bereken Eindresultaat'}
                </button>
            </div>
        )}
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
            let interpretation = '';
            if (s.ko) {
                interpretation = 'Niet geschikt (Knock-out)';
            } else if (s.score >= 80) {
                interpretation = 'Uitstekende match';
            } else if (s.score >= 60) {
                interpretation = 'Goede match';
            } else if (s.score >= 40) {
                interpretation = 'Matige match';
            } else {
                interpretation = 'Zwakke match';
            }

            return (
                <div className="result-item" key={s.label}>
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
                    if (best.val === -1) return "geen van de scenario's momenteel geschikt is vanwege kritieke knock-out criteria.";
                    
                    let text = `het scenario <strong>${best.name}</strong> de sterkste match heeft (${Math.round(best.val)}%). `;
                    
                    if (best.name === 'On-Premise') {
                        text += "Dit duidt op een sterke behoefte aan volledige controle, fysieke soevereiniteit of specifieke legacy-integratie.";
                    } else if (best.name === 'OP Partner') {
                        text += "Dit suggereert dat een lokaal beheerde cloudomgeving door een vertrouwde partner de beste balans biedt tussen ontzorging en controle.";
                    } else if (best.name === 'EU Cloud') {
                        text += "Dit wijst op een voorkeur voor moderne cloud-functionaliteit binnen de veilige kaders van Europese wet- en regelgeving.";
                    } else {
                        text += "Dit duidt op een behoefte aan maximale schaalbaarheid en innovatieve diensten, waarbij de risico's op het gebied van soevereiniteit als acceptabel worden beschouwd.";
                    }
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
                          const isJa = d.answer_value === 'Ja';
                          const kos = isJa ? d.ko_on_ja : d.ko_on_nee;
                          return kos && kos.trim().length > 0;
                      }).map((d, idx) => {
                          const kos = (d.answer_value === 'Ja' ? d.ko_on_ja : d.ko_on_nee).split(',');
                          const solutionNames = {
                              'OP': 'On-Premise',
                              'OPP': 'OP Partner',
                              'EUC': 'EU Cloud',
                              'HYP': 'Hyperscaler'
                          };
                          return (
                              <li key={idx} className="mb-2 pb-2 border-bottom">
                                  <strong>Vraag:</strong> {d.question_text}<br/>
                                  <span className="text-muted">Uw antwoord: <strong>{d.answer_value}</strong></span><br/>
                                  <span className="badge bg-danger mt-1">Knock-out voor: {kos.map(k => solutionNames[k.trim()] || k).join(', ')}</span>
                              </li>
                          );
                      })}
                  </ul>
              </div>
          )}
      </div>

      <div className="card shadow-sm p-4 mt-5">
          <h3 className="mb-4">Gegeven Antwoorden</h3>
          <table className="table table-sm">
              <thead>
                  <tr>
                      <th>Vraag</th>
                      <th className="text-center">Antwoord</th>
                      <th className="text-center">Prioriteit</th>
                  </tr>
              </thead>
              <tbody>
                  {currentResult.details && currentResult.details.map((d, i) => {
                      let priorityLabel = 'Standaard';
                      const factor = parseFloat(d.user_factor);
                      if (factor === 0.5) priorityLabel = 'Lager';
                      if (factor === 2) priorityLabel = 'Hoger';
                      
                      return (
                        <tr key={i}>
                            <td className="py-2">
                                {d.question_text}
                            </td>
                            <td className="fw-bold align-middle text-center">{d.answer_value}</td>
                            <td className="align-middle text-muted text-center">{priorityLabel}</td>
                        </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>

      <div className="row mt-5 pt-5 no-print">
          <div className="col-md-6">
              <div className="card bg-light">
                  <p className="mb-4">E-mail dit resultaat naar uzelf of een stakeholder:</p>
                  <form onSubmit={handleEmail}>
                    <div className="form-group mb-3">
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="naam@organisatie.nl" 
                            value={emailInput} 
                            onChange={(e) => setEmailInput(e.target.value)}
                            required
                        />
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
                    <button className="btn btn-primary flex-grow-1" onClick={() => {
                        setStep('list');
                        setEmailStatus('');
                    }}>Overzicht</button>
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
        <button className="btn btn-success" onClick={() => {
            setProjectName('');
            setAnswers({});
            setFactors({});
            setStep('new');
        }}>Nieuwe Analyse</button>
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
              <tr>
                <td colSpan="4" className="text-center py-5 text-muted">Geen assessments gevonden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="nav-header shadow-sm no-print">
        <div className="deloitte-logo">Deloitte<span>.</span></div>
        <div className="d-flex align-items-center">
            <span className="me-4 text-muted fw-bold" style={{fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px'}}>{user.username}</span>
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
