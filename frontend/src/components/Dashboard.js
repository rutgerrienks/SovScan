import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const Dashboard = ({ user, onSelect, onLogout }) => {
  const [counts, setCounts] = useState({ assessments: null, audits: null });
  const [showInvites, setShowInvites] = useState(false);
  const [invites, setInvites] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [inviteType, setInviteType] = useState('assessment');
  const [createdLink, setCreatedLink] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [aRes, auRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/assessments?userId=${user.id}`),
          axios.get(`${API_BASE_URL}/audits?userId=${user.id}`)
        ]);
        setCounts({ assessments: aRes.data.length, audits: auRes.data.length });
      } catch (err) {
        setCounts({ assessments: 0, audits: 0 });
      }
    };
    fetchCounts();
  }, [user.id]);

  const fetchInvites = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/invites?userId=${user.id}`);
      setInvites(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenInvites = () => {
    setShowInvites(true);
    fetchInvites();
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/invites`, {
        userId: user.id,
        projectName: newProjectName,
        expiresInDays: parseInt(expiresInDays),
        inviteType
      });
      const link = `${window.location.origin}/invite/${res.data.token}`;
      setCreatedLink(link);
      setNewProjectName('');
      fetchInvites();
    } catch (err) {
      alert('Fout bij aanmaken uitnodiging');
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopyFeedback(link);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleDeleteInvite = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/invites/${id}`);
      fetchInvites();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6' }}>
      {/* Header */}
      <header className="nav-header shadow-sm">
        <div className="deloitte-logo">Deloitte<span>.</span></div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted fw-bold" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {user.username}
          </span>
          <button
            className="btn btn-outline-dark py-2"
            style={{ fontSize: '12px', padding: '8px 20px' }}
            onClick={onLogout}
          >
            Uitloggen
          </button>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: '#000', color: '#fff', padding: '60px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--d-green)', fontWeight: '700', marginBottom: '12px' }}>
            SovScan — Sovereignty Platform
          </p>
          <h1 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '16px', color: '#fff' }}>
            Welkom, {user.username}.
          </h1>
          <p style={{ fontSize: '18px', color: '#aaa', maxWidth: '560px', lineHeight: 1.6, marginBottom: 0 }}>
            Kies hieronder welk instrument u wilt gebruiken. U kunt altijd wisselen via de navigatie.
          </p>
        </div>
      </div>

      {/* Tool cards */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* Card 1 – Scenario Assessment */}
          <div
            className="dashboard-tool-card"
            onClick={() => onSelect('assessment')}
            style={{ cursor: 'pointer' }}
          >
            <div className="dashboard-card-number">01</div>
            <h2 className="dashboard-card-title">Scenario Assessment</h2>
            <p className="dashboard-card-desc">
              Bepaal het meest geschikte hosting-scenario voor een nieuw project of use-case. Beantwoord 23 vragen en ontvang direct scores voor On-Premise, OP Partner, EU Cloud en Hyperscaler — inclusief live preview en knock-out analyse.
            </p>
            <div className="dashboard-card-meta">
              {counts.assessments !== null
                ? `${counts.assessments} eerdere ${counts.assessments === 1 ? 'analyse' : 'analyses'}`
                : '—'}
            </div>
            <div className="dashboard-card-cta">
              Starten →
            </div>
          </div>

          {/* Card 2 – Soevereiniteitsaudit */}
          <div
            className="dashboard-tool-card dashboard-tool-card--green"
            onClick={() => onSelect('audit')}
            style={{ cursor: 'pointer' }}
          >
            <div className="dashboard-card-number">02</div>
            <h2 className="dashboard-card-title">Soevereiniteitsaudit</h2>
            <p className="dashboard-card-desc">
              Beoordeel een bestaand AI-systeem of digitale oplossing op de huidige mate van soevereiniteit. Scoor 7 dimensies — van data-controle en vendor lock-in tot auditability en operationele onafhankelijkheid.
            </p>
            <div className="dashboard-card-meta">
              {counts.audits !== null
                ? `${counts.audits} eerdere ${counts.audits === 1 ? 'audit' : 'audits'}`
                : '—'}
            </div>
            <div className="dashboard-card-cta">
              Starten →
            </div>
          </div>
        </div>

        {/* Card 3 – Externe Uitnodigingen (full width) */}
        <div style={{ marginTop: '24px' }}>
          <div
            className="dashboard-tool-card"
            onClick={handleOpenInvites}
            style={{ cursor: 'pointer', borderLeft: '4px solid var(--d-green)' }}
          >
            <div className="dashboard-card-number">03</div>
            <h2 className="dashboard-card-title">Externe Uitnodiging</h2>
            <p className="dashboard-card-desc">
              Maak een unieke link aan waarmee een externe partij zonder account een Scenario Assessment of Soevereiniteitsaudit kan invullen. Beheer en volg uw uitnodigingen.
            </p>
            <div className="dashboard-card-cta">
              Beheren →
            </div>
          </div>
        </div>

        {/* Invite management panel */}
        {showInvites && (
          <div style={{ marginTop: '32px', background: '#fff', padding: '32px', border: '1px solid #e5e5e5' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0, fontSize: '20px' }}>Uitnodigingen</h3>
              <button className="btn btn-outline-dark btn-sm" onClick={() => setShowInvites(false)}>Sluiten</button>
            </div>

            {/* Create new invite */}
            <form onSubmit={handleCreateInvite} className="mb-4 p-3 bg-light">
              <p className="fw-bold mb-3" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nieuwe uitnodiging</p>
              <div className="d-flex gap-3 align-items-end flex-wrap">
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label small">Projectnaam</label>
                  <input
                    type="text" className="form-control" value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Bijv. Migratie Klantportaal 2026" required
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <label className="form-label small">Type</label>
                  <select className="form-control" value={inviteType} onChange={(e) => setInviteType(e.target.value)}>
                    <option value="assessment">Scenario Assessment</option>
                    <option value="audit">Soevereiniteitsaudit</option>
                  </select>
                </div>
                <div style={{ width: '140px' }}>
                  <label className="form-label small">Geldig (dagen)</label>
                  <input
                    type="number" className="form-control" value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    min="1" max="365"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Aanmaken</button>
              </div>
            </form>

            {/* Show created link */}
            {createdLink && (
              <div className="mb-4 p-3" style={{ background: '#e8f5e9', border: '1px solid var(--d-green)' }}>
                <p className="fw-bold mb-2" style={{ fontSize: '13px' }}>Uitnodigingslink aangemaakt:</p>
                <div className="d-flex gap-2 align-items-center">
                  <input type="text" className="form-control form-control-sm" value={createdLink} readOnly
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <button className="btn btn-outline-dark btn-sm" onClick={() => handleCopyLink(createdLink)}>
                    {copyFeedback === createdLink ? 'Gekopieerd!' : 'Kopiëren'}
                  </button>
                </div>
              </div>
            )}

            {/* List existing invites */}
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Aangemaakt</th>
                  <th>Verloopt</th>
                  <th>Status</th>
                  <th className="text-end">Acties</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => {
                  const isUsed = !!inv.used_at;
                  const isExpired = !isUsed && inv.expires_at && new Date(inv.expires_at) < new Date();
                  const link = `${window.location.origin}/invite/${inv.token}`;
                  return (
                    <tr key={inv.id}>
                      <td className="align-middle fw-bold">{inv.project_name}</td>
                      <td className="align-middle text-muted small">{inv.invite_type === 'audit' ? 'Audit' : 'Assessment'}</td>
                      <td className="align-middle text-muted small">{new Date(inv.created_at).toLocaleDateString('nl-NL')}</td>
                      <td className="align-middle text-muted small">{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('nl-NL') : '—'}</td>
                      <td className="align-middle">
                        {isUsed && (
                          <span className="badge bg-success">
                            Ingevuld{inv.respondent_name ? ` door ${inv.respondent_name}` : ''}
                          </span>
                        )}
                        {isExpired && <span className="badge bg-secondary">Verlopen</span>}
                        {!isUsed && !isExpired && <span className="badge bg-warning text-dark">Openstaand</span>}
                      </td>
                      <td className="text-end align-middle">
                        <div className="d-flex gap-1 justify-content-end">
                          {!isUsed && !isExpired && (
                            <button className="btn btn-outline-dark btn-sm" onClick={() => handleCopyLink(link)}
                              style={{ fontSize: '11px' }}>
                              {copyFeedback === link ? 'Gekopieerd!' : 'Link kopiëren'}
                            </button>
                          )}
                          {isUsed && (inv.assessment_id || inv.audit_id) && (
                            <button className="btn btn-outline-dark btn-sm" onClick={() => onSelect(inv.invite_type === 'audit' ? 'audit' : 'assessment')}
                              style={{ fontSize: '11px' }}>
                              Bekijken
                            </button>
                          )}
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteInvite(inv.id)}
                            style={{ fontSize: '11px' }}>
                            Verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {invites.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">Nog geen uitnodigingen aangemaakt.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Info strip */}
        <div style={{ marginTop: '48px', padding: '24px 32px', background: '#fff', borderLeft: '4px solid var(--d-green)', display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { n: '23', label: 'Vragen per scenario-scan' },
            { n: '4', label: 'Hosting-scenario\'s vergeleken' },
            { n: '7', label: 'Soevereiniteitsdimensies' },
            { n: '21', label: 'Auditstellingen' },
          ].map(({ n, label }) => (
            <div key={label}>
              <div style={{ fontSize: '40px', fontWeight: '800', lineHeight: 1, color: 'var(--d-green)' }}>{n}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
