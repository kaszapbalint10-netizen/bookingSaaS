  // StylistRegistration.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button, Input, useToast } from '../UI';
import './Auth.css';

const StylistRegistration = () => {
  const { registerStylist } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    specialization: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [verifying, setVerifying] = useState(true);

  // Meghívó token ellenőrzése
  useEffect(() => {
    const verifyInvitation = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setErrors({ submit: 'Érvénytelen vagy hiányzó meghívó link' });
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/auth/verify-invitation/${token}`);
        const data = await response.json();
        
        if (data.success) {
          setInvitationInfo(data.invitation);
          setFormData(prev => ({
            ...prev,
            email: data.invitation.email
          }));
        } else {
          setErrors({ submit: data.error || 'Érvénytelen vagy lejárt meghívó' });
        }
      } catch (error) {
        setErrors({ submit: 'Hiba a meghívó ellenőrzése során' });
      } finally {
        setVerifying(false);
      }
    };

    verifyInvitation();
  }, [searchParams]);

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
    if (!formData.password) newErrors.password = 'Kötelező mező';
    if (!formData.confirm_password) newErrors.confirm_password = 'Kötelező mező';
    if (!formData.specialization.trim()) newErrors.specialization = 'Kötelező mező';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Érvénytelen email formátum';
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
      const token = searchParams.get('token');
      const result = await registerStylist({
        ...formData,
        token: token
      });
      
      toast.success('Sikeres regisztráció!', { title: 'Üdvözöljük' });
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Sikeres regisztráció! Most már bejelentkezhetsz.',
            email: formData.email
          }
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

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-badge">
              <span>✂️👋</span>
            </div>
            <h1>Meghívó ellenőrzése</h1>
            <p className="muted">Meghívód ellenőrzése folyamatban...</p>
          </div>
          <div className="loading-spinner">⏳</div>
        </div>
      </div>
    );
  }

  if (errors.submit && !invitationInfo) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-badge error">
              <span>❌</span>
            </div>
            <h1>Meghívó probléma</h1>
            <p className="muted">{errors.submit}</p>
          </div>
          <div className="auth-footer">
            <Link to="/login" className="button primary full-width">
              Vissza a bejelentkezéshez
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge">
            <span>✂️🎉</span>
          </div>
          <h1>Csatlakozás a csapathoz</h1>
          {invitationInfo && (
            <div className="invitation-info">
              <p className="muted">
                Meghívtak, hogy csatlakozz a <strong>{invitationInfo.salon}</strong> csapatához!
              </p>
              <p className="muted small">
                Szerepkör: <strong>
                  {invitationInfo.role === 'stylist' ? 'Fodrász' : 
                   invitationInfo.role === 'admin' ? 'Adminisztrátor' : 
                   invitationInfo.role === 'reception' ? 'Recepciós' : invitationInfo.role}
                </strong>
              </p>
            </div>
          )}
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
                disabled={loading}
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
                disabled={loading}
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
            disabled={true}
            title="Email cím a meghívóból, nem módosítható"
          />

          <Input
            label="Telefonszám"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="+36201234567"
            disabled={loading}
          />

          <Input
            label="Szakterület / Specializáció"
            type="select"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            error={errors.specialization}
            disabled={loading}
            options={[
              { value: '', label: 'Válassz szakterületet...' },
              { value: 'Női fodrász', label: 'Női fodrász' },
              { value: 'Férfi fodrász', label: 'Férfi fodrász' },
              { value: 'Gyermek fodrász', label: 'Gyermek fodrász' },
              { value: 'Hajfestő szakember', label: 'Hajfestő szakember' },
              { value: 'Kozmetikus', label: 'Kozmetikus' },
              { value: 'Műkörmös', label: 'Műkörmös' },
              { value: 'Sminkes', label: 'Sminkes' },
              { value: 'Masszőr', label: 'Masszőr' },
              { value: 'Egyéb', label: 'Egyéb' }
            ]}
          />

          {formData.specialization === 'Egyéb' && (
            <Input
              label="Egyéb szakterület megadása"
              type="text"
              name="custom_specialization"
              value={formData.custom_specialization || ''}
              onChange={handleChange}
              placeholder="Add meg a szakterületed..."
              disabled={loading}
            />
          )}

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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <Input
            label="Elfogadom a felhasználási feltételeket"
            type="checkbox"
            required
          />

          <Button 
            type="submit" 
            variant="primary"
            fullWidth
            loading={loading}
          >
            {loading ? 'Regisztráció...' : 'Csatlakozás a csapathoz'}
          </Button>
        </form>

        <div className="auth-footer">
          <p className="muted small">
            A regisztrációval elfogadod a szalon szabályzatát és hozzájárulsz ahhoz, 
            hogy a szalon adminisztrátora kezelhesse az időpontjaidat és ügyféladataidat.
          </p>
          <p className="muted">
            Már van fiókod? <Link to="/login" className="link">Jelentkezz be</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StylistRegistration;