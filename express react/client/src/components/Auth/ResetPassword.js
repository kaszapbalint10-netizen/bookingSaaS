import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import ShaderBackground from '../UI/ShaderBackground';

const useQuery = () => new URLSearchParams(useLocation().search);

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', token: '', password: '', confirm: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const email = query.get('email') || '';
    const token = query.get('token') || '';
    setForm((prev) => ({ ...prev, email, token }));
    // Töröljük a tokenes query-t az URL-ből, hogy ne látszódjon
    if (window?.history && window?.location?.pathname) {
      window.history.replaceState({}, '', '/reset-password');
    }
  }, [query]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!form.email || !form.token || !form.password) {
      setStatus({ type: 'error', message: 'Minden mező kötelező' });
      return;
    }
    if (form.password !== form.confirm) {
      setStatus({ type: 'error', message: 'A jelszavak nem egyeznek' });
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/auth/reset-password', {
        email: form.email,
        token: form.token,
        new_password: form.password,
      });
      setStatus({ type: 'success', message: 'Jelszó frissítve. Átirányítás...' });
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      const msg = error.response?.data?.error || 'Nem sikerült frissíteni. Lehet, hogy lejárt a token.';
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
              <h2>Reset password</h2>
              <p>Add meg a kapott kódot és az új jelszót.</p>
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
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="email@example.hu"
                autoComplete="email"
              />
            </div>

            {/* A token az URL-ből érkezik, nem kell megjeleníteni */}

            <div className="field">
              <label className="field-label">Új jelszó</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="********"
              />
            </div>

            <div className="field">
              <label className="field-label">Jelszó megerősítése</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                className="input"
                placeholder="********"
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Frissítés...' : 'Jelszó frissítése'}
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

export default ResetPassword;
