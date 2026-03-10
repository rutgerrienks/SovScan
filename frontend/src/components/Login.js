import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api';

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
          <div className="h-100 d-flex flex-column justify-content-center">
            <h3 className="mb-4" style={{ fontSize: '32px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.1', color: 'black' }}>
              Klaar om te scannen?
            </h3>

            <p className="mb-5" style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.6' }}>
              Navigeer door de complexiteit van digitale soevereiniteit. Ontdek binnen 10 minuten welke cloud-strategie het beste past bij uw organisatie.
            </p>

            <div className="features">
              <div className="d-flex align-items-center mb-4">
                <span style={{ fontSize: '24px', marginRight: '15px' }}>✓</span>
                <span style={{ fontSize: '16px', fontWeight: '700' }}>23 Kritieke criteria</span>
              </div>
              <div className="d-flex align-items-center mb-4">
                <span style={{ fontSize: '24px', marginRight: '15px' }}>✓</span>
                <span style={{ fontSize: '16px', fontWeight: '700' }}>Objectieve datagedreven scores</span>
              </div>
              <div className="d-flex align-items-center mb-4">
                <span style={{ fontSize: '24px', marginRight: '15px' }}>✓</span>
                <span style={{ fontSize: '16px', fontWeight: '700' }}>Direct inzicht in Knock-outs</span>
              </div>
              <div className="d-flex align-items-center">
                <span style={{ fontSize: '24px', marginRight: '15px' }}>✓</span>
                <span style={{ fontSize: '16px', fontWeight: '700' }}>Direct deelbare rapportage</span>
              </div>
            </div>

            <div className="mt-auto pt-5" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <p className="small mb-0" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Sovereignty Assessment Tool
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
