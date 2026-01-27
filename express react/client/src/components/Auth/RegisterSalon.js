import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, useToast } from '../UI';
import './Auth.css';

const RegisterSalon = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    salon_name: '',
    password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'Kötelező mező';
    if (!formData.last_name.trim()) newErrors.last_name = 'Kötelező mező';
    if (!formData.email.trim()) newErrors.email = 'Kötelező mező';
    if (!formData.phone.trim()) newErrors.phone = 'Kötelező mező';
    if (!formData.salon_name.trim()) newErrors.salon_name = 'Kötelező mező';
    if (!formData.password) newErrors.password = 'Kötelező mező';
    if (!formData.confirm_password) newErrors.confirm_password = 'Kötelező mező';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Érvénytelen email formátum';
    }

    // Phone validation
    const phoneRegex = /^(\+36|06)[0-9]{8,9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Érvényes magyar telefonszám formátum: +36201234567 vagy 06201234567';
    }

    // Password strength
    if (formData.password && (formData.password.length < 8 || !/\d/.test(formData.password))) {
      newErrors.password = 'Minimum 8 karakter és 1 szám kell';
    }

    // Password match
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'A jelszavak nem egyeznek';
    }

    return newErrors;
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
      const result = await register(formData);
      toast.success('Regisztráció sikeres!', { title: 'Siker' });
      setTimeout(() => {
        navigate('/verify-email', { 
          state: { email: formData.email, message: result.message }
        });
      }, 1500);
    } catch (error) {
      const errorMsg = error.error || 'Regisztrációs hiba';
      setErrors({ submit: errorMsg });
      toast.error(errorMsg, { title: 'Hiba' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge">
            <span>✂️</span>
          </div>
          <h1>Szalon Regisztráció</h1>
          <p className="muted">Hozd létre szalonodat pár perc alatt</p>
        </div>

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <Input
                label="Vezetéknév"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
                placeholder="Kiss"
              />
            </div>

            <div className="form-group">
              <Input
                label="Keresztnév"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                placeholder="Nóra"
              />
            </div>
          </div>

          <Input
            label="Email cím"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="nora@szalon.hu"
          />

          <Input
            label="Telefonszám"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="+36201234567"
          />

          <Input
            label="Szalon neve"
            type="text"
            name="salon_name"
            value={formData.salon_name}
            onChange={handleChange}
            error={errors.salon_name}
            placeholder="Silk Salon"
          />

          <div className="form-row">
            <div className="form-group">
              <Input
                label="Jelszó"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Minimum 8 karakter"
              />
            </div>

            <div className="form-group">
              <Input
                label="Jelszó megerősítése"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                error={errors.confirm_password}
                placeholder="Ismételd meg a jelszót"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary"
            fullWidth
            loading={loading}
          >
            {loading ? 'Regisztráció...' : 'Szalon regisztrálása'}
          </Button>
        </form>

        <div className="auth-footer">
          <p className="muted">
            Már van fiókod? <Link to="/login" className="link">Jelentkezz be</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterSalon;