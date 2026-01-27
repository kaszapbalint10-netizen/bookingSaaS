import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import ShaderBackground from '../UI/ShaderBackground';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Email megadása kötelező' });
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/auth/forgot-password', { email });
      setStatus({
        type: 'success',
        message: 'Ha létezik ez az email, 5 perces reset linket küldtünk.',
      });
    } catch (error) {
      const msg = error.response?.data?.error || 'Nem sikerült elküldeni. Próbáld meg később.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-bg" aria-hidden="true">
        <ShaderBackground />
      </div>

      <div className="signin-shell">
        <div className="signin-card">
          <div className="card-head">
            <div className="brand-mark">S</div>
            <div>
              <h2>Forgot password</h2>
              <p>Kérj 5 perces jelszó reset linket emailben.</p>
            </div>
          </div>

          {status?.message && (
            <div className={`error-banner ${status.type === 'success' ? 'success' : ''}`}>
              {status.message}
              {status.type === 'success' && <div className="success-progress" aria-hidden="true" />}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.hu"
                autoComplete="email"
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Küldés...' : 'Küldj reset linket'}
            </button>
          </form>

          <div className="signin-footer">
            <Link to="/login" className="ghost-link">
              Vissza a bejelentkezéshez
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
