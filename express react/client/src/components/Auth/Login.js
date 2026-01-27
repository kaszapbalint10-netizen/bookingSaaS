import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from '../Dashboard/utils/axiosConfig';
import './Auth.css';
import ShaderBackground from '../UI/ShaderBackground';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'guest', // 'guest' vagy 'salon'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email cím kötelező';
    if (!formData.password) newErrors.password = 'Jelszó kötelező';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Érvénytelen email formátum';
    }
    return newErrors;
  };

  const formatErrorMessage = (error) => {
    const status = error?.response?.status;
    const apiMsg = error?.response?.data?.error || error?.response?.data?.message;
    if (status === 0 || status === undefined) {
      return 'Nem érhető el az API. Ellenőrizd az URL-t vagy a hálózatot.';
    }
    if (status === 401) return apiMsg || 'Hibás email vagy jelszó.';
    if (status === 403) return apiMsg || 'Nincs jogosultság a belépéshez.';
    if (status === 404) return apiMsg || 'Az authentikációs endpoint nem elérhető.';
    if (status === 500) return apiMsg || 'Szerverhiba történt.';
    return apiMsg || error.message || 'Bejelentkezési hiba.';
  };

  const handleGuestLogin = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        return {
          success: true,
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          userType: 'guest',
        };
      }
      throw new Error(response.data.error || 'Bejelentkezési hiba');
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (formData.userType === 'guest') {
        const result = await handleGuestLogin(formData.email, formData.password);
        if (result.accessToken) {
          localStorage.setItem('token', result.accessToken);
          localStorage.setItem('refreshToken', result.refreshToken);
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        navigate('/salon-browser');
      } else {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (error) {
      setErrors({ submit: formatErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const setRole = (role) => {
    handleChange({ target: { name: 'userType', value: role } });
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
              <h2>Welcome back</h2>
              <p>Access your salon dashboard or browse as guest</p>
            </div>
          </div>

          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="field">
              <label className="field-label">Sign in as</label>
            <div className={`chip-group ${formData.userType}-active`}>
              <button
                type="button"
                className={`chip ${formData.userType === 'guest' ? 'active' : ''}`}
                onClick={() => setRole('guest')}
              >
                  Guest
                </button>
                <button
                  type="button"
                  className={`chip ${formData.userType === 'salon' ? 'active' : ''}`}
                  onClick={() => setRole('salon')}
                >
                  Salon
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'has-error' : ''}`}
                placeholder="email@example.hu"
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input ${errors.password ? 'has-error' : ''}`}
                placeholder="********"
                autoComplete="current-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-row">
              <Link to="/forgot-password" className="ghost-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="signin-footer">
            <span>New here?</span>
            {formData.userType === 'guest' ? (
              <Link to="/guest-registration" className="ghost-link">
                Create guest account
              </Link>
            ) : (
              <Link to="/register-salon" className="ghost-link">
                Register salon
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
