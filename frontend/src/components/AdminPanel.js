import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api';

const AdminPanel = ({ onLogout }) => {
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
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

  const handleEdit = (q) => {
    setEditingQuestion({ ...q });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Weet je zeker dat je deze vraag wilt verwijderen?")) {
      try {
        await axios.delete(`${API_BASE_URL}/questions/${id}`);
        fetchQuestions();
      } catch (err) {
        console.error("Error deleting question", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestion.id) {
        await axios.put(`${API_BASE_URL}/questions/${editingQuestion.id}`, editingQuestion);
      } else {
        await axios.post(`${API_BASE_URL}/questions`, editingQuestion);
      }
      setShowForm(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err) {
      console.error("Error saving question", err);
    }
  };

  const renderForm = () => (
    <div className="card p-4 shadow-sm mb-5">
      <h4>{editingQuestion.id ? 'Vraag Aanpassen' : 'Nieuwe Vraag Toevoegen'}</h4>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Cluster</label>
            <input type="text" className="form-control" value={editingQuestion.cluster || ''} onChange={e => setEditingQuestion({...editingQuestion, cluster: e.target.value})} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Dimensie</label>
            <input type="text" className="form-control" value={editingQuestion.dimensie || ''} onChange={e => setEditingQuestion({...editingQuestion, dimensie: e.target.value})} required />
          </div>
          <div className="col-12">
            <label className="form-label">Vraag Tekst</label>
            <textarea className="form-control" value={editingQuestion.question_text || ''} onChange={e => setEditingQuestion({...editingQuestion, question_text: e.target.value})} required />
          </div>
          <div className="col-12">
            <label className="form-label">Toelichting</label>
            <textarea className="form-control" value={editingQuestion.toelichting || ''} onChange={e => setEditingQuestion({...editingQuestion, toelichting: e.target.value})} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Basis Wegingsfactor</label>
            <input type="number" step="0.1" className="form-control" value={editingQuestion.base_factor || 1} onChange={e => setEditingQuestion({...editingQuestion, base_factor: e.target.value})} required />
          </div>

          <div className="col-12 mt-4 border-top pt-3">
              <h6>Scores bij antwoord "Ja" (0-10)</h6>
              <div className="row g-2">
                {['op_ja', 'opp_ja', 'euc_ja', 'hyp_ja'].map(key => (
                    <div className="col-md-3" key={key}>
                        <label className="small">{key.toUpperCase().replace('_JA','')}</label>
                        <input type="number" className="form-control form-control-sm" value={editingQuestion[key] || 0} onChange={e => setEditingQuestion({...editingQuestion, [key]: parseInt(e.target.value)})} />
                    </div>
                ))}
              </div>
          </div>

          <div className="col-12 mt-3">
              <h6>Scores bij antwoord "Nee" (0-10)</h6>
              <div className="row g-2">
                {['op_nee', 'opp_nee', 'euc_nee', 'hyp_nee'].map(key => (
                    <div className="col-md-3" key={key}>
                        <label className="small">{key.toUpperCase().replace('_NEE','')}</label>
                        <input type="number" className="form-control form-control-sm" value={editingQuestion[key] || 0} onChange={e => setEditingQuestion({...editingQuestion, [key]: parseInt(e.target.value)})} />
                    </div>
                ))}
              </div>
          </div>

          <div className="col-md-6 mt-4">
            <label className="form-label">Knock-out bij "Ja" (scenario's bijv. OP,HYP)</label>
            <input type="text" className="form-control" placeholder="OP,OPP,EUC,HYP" value={editingQuestion.ko_on_ja || ''} onChange={e => setEditingQuestion({...editingQuestion, ko_on_ja: e.target.value})} />
          </div>
          <div className="col-md-6 mt-4">
            <label className="form-label">Knock-out bij "Nee"</label>
            <input type="text" className="form-control" placeholder="OP,OPP,EUC,HYP" value={editingQuestion.ko_on_nee || ''} onChange={e => setEditingQuestion({...editingQuestion, ko_on_nee: e.target.value})} />
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" className="btn btn-success me-2">Opslaan</button>
          <button type="button" className="btn btn-link text-dark" onClick={() => setShowForm(false)}>Annuleren</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between mb-4 border-bottom pb-2">
        <div className="deloitte-logo mb-0">Deloitte<span>.</span> <small className="text-muted">| Beheerder</small></div>
        <button className="btn btn-sm btn-outline-danger" onClick={onLogout}>Uitloggen</button>
      </div>

      {!showForm ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Vragenlijst Beheer</h3>
            <button className="btn btn-primary" onClick={() => {
                setEditingQuestion({ base_factor: 1, op_ja: 0, opp_ja: 0, euc_ja: 0, hyp_ja: 0, op_nee: 0, opp_nee: 0, euc_nee: 0, hyp_nee: 0 });
                setShowForm(true);
            }}>+ Nieuwe Vraag</button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Cluster / Dimensie</th>
                  <th>Vraag</th>
                  <th>Factor</th>
                  <th className="text-end">Acties</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id}>
                    <td className="small">
                        <strong>{q.cluster}</strong><br/>
                        <span className="text-muted">{q.dimensie}</span>
                    </td>
                    <td className="small">{q.question_text}</td>
                    <td>{q.base_factor}x</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-dark me-2" onClick={() => handleEdit(q)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(q.id)}>X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : renderForm()}
    </div>
  );
};

export default AdminPanel;
