import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ backend: 'checking', database: 'checking' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/health`);
        setStatus({
          backend: res.data.status === 'online' ? 'online' : 'offline',
          database: res.data.database === 'connected' ? 'online' : 'offline'
        });
      } catch (err) {
        setStatus({ backend: 'offline', database: 'offline' });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { username, password });
      onLogin(res.data.user);
    } catch (err) {
      setError('Ongeldige inloggegevens');
    }
  };

  return (
    <div className="login-screen">
      <div className="status-container">
        <div className="status-item">
          API <div className={`status-light ${status.backend}`}></div>
        </div>
        <div className="status-item">
          DB <div className={`status-light ${status.database}`}></div>
        </div>
      </div>

      <div className="login-container">
        {/* Box 1: Login (White) */}
        <div className="login-box">
          <div className="deloitte-logo mb-5" style={{ fontSize: '32px' }}>
            Deloitte<span>.</span>
          </div>

          <h2 style={{ fontSize: '28px', marginBottom: '20px' }} className="fw-bold">Toegang Tool</h2>
          <p className="text-muted mb-5">Log in met uw account.</p>

          {error && <div className="alert alert-danger p-3 mb-4" style={{ borderRadius: 0 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label className="form-label">Gebruikersnaam</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-5">
              <label className="form-label">Wachtwoord</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-3">Inloggen</button>
          </form>
        </div>

        {/* Box 2: Promo (Green) */}
        <div className="promo-box">
          <div className="h-100 d-flex flex-column justify-content-between">
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', opacity: 0.7 }}>
                Twee instrumenten, één platform
              </p>
              <h3 className="mb-4" style={{ fontSize: '30px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.1', color: 'black' }}>
                Digitale Soevereiniteit in kaart
              </h3>
              <p style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.6', marginBottom: '32px' }}>
                Bepaal de optimale hostingstrategie voor nieuwe projecten én beoordeel de soevereiniteit van bestaande systemen.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tool 1 */}
              <div style={{ background: 'rgba(0,0,0,0.12)', padding: '20px' }}>
                <p style={{ fontWeight: '800', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  01 — Scenario Assessment
                </p>
                <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: 0, opacity: 0.85 }}>
                  Beantwoord 23 vragen over uw project en ontdek welk hosting-scenario (On-Premise, EU Cloud of Hyperscaler) het beste past — inclusief live scorepreview en knock-out analyse.
                </p>
              </div>
              {/* Tool 2 */}
              <div style={{ background: 'rgba(0,0,0,0.12)', padding: '20px' }}>
                <p style={{ fontWeight: '800', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  02 — Soevereiniteitsaudit
                </p>
                <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: 0, opacity: 0.85 }}>
                  Beoordeel een bestaand AI-systeem op 7 soevereiniteitsdimensies: van data-controle en vendor lock-in tot auditability en operationele onafhankelijkheid.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.15)' }}>
              <p className="small mb-0" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                SovScan — Deloitte Sovereignty Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
