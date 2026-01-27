import React, { useState } from 'react';
import axios from 'axios';

const GuestForm = ({ currentStep, setCurrentStep, onRegistration, loading, salonId }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newsletter: true,
    hairType: '',
    hairCondition: '',
    favoriteServices: [],
    allergies: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const services = [
    'Hajvágás', 'Hajfestés', 'Melír', 'Balayage', 'Hajkezelés', 
    'Hajmosás', 'Styling', 'Smink', 'Kozmetika', 'Műkörmös'
  ];

  const hairTypes = ['Egyenes', 'Göndör', 'Hullámos', 'Vegyes'];
  const hairConditions = ['Egészséges', 'Száraz', 'Zsíros', 'Törékeny', 'Festett', 'Sérült'];

  // 🆕 DEBUG - hogy lássuk mi történik
  React.useEffect(() => {
    console.log('🔍 GuestForm currentStep:', currentStep);
  }, [currentStep]);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Kötelező mező';
      if (!formData.lastName.trim()) newErrors.lastName = 'Kötelező mező';
      if (!formData.birthDate) newErrors.birthDate = 'Kötelező mező';
      
      if (formData.birthDate) {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 16) newErrors.birthDate = 'Minimum 16 éves kor szükséges';
      }
    }

    if (step === 2) {
      if (!formData.email.trim()) newErrors.email = 'Kötelező mező';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Érvénytelen email formátum';
      
      if (!formData.phone.trim()) newErrors.phone = 'Kötelező mező';
      else if (!/^(\+36|06)[0-9]{8,9}$/.test(formData.phone)) {
        newErrors.phone = 'Érvényes magyar telefonszám formátum: +36201234567 vagy 06201234567';
      }

      if (!formData.password) newErrors.password = 'Kötelező mező';
      else if (formData.password.length < 8) newErrors.password = 'Minimum 8 karakter';
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Tartalmazzon kis- és nagybetűt, valamint számot';
      }

      if (!formData.confirmPassword) newErrors.confirmPassword = 'Kötelező mező';
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'A jelszavak nem egyeznek';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleServiceToggle = (service) => {
    const currentServices = formData.favoriteServices;
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    handleInputChange('favoriteServices', newServices);
  };

  const handleNext = () => {
    console.log('🔍 handleNext called - step:', currentStep);
    if (validateStep(currentStep)) {
      console.log('✅ Step validation passed, moving to step:', currentStep + 1);
      setCurrentStep(prev => prev + 1);
    } else {
      console.log('❌ Step validation failed');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    // 🆕 EXTRA VÉDELEM - csak manuális submit engedélyezett
    if (!e) {
      console.log('🛑 AUTOMATIC SUBMIT BLOCKED - no event object');
      console.trace('🛑 Stack trace for automatic call:');
      return;
    }
    
    e.preventDefault();
    
    // 🆕 EXTRA VÉDELEM - csak 3. lépésben lehet submitelni
    if (currentStep !== 3) {
      console.log('🛑 SUBMIT BLOCKED - not on step 3, current step:', currentStep);
      return;
    }
    
    // 🆕 DUPLA KÜLDÉS VÉDELEM
    if (isSubmitting) {
      console.log('🛑 Már folyamatban van a küldés, ignorálás');
      return;
    }
    
    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      
      try {
        console.log('🟡 Küldés indítása... currentStep:', currentStep);
        
        // API hívás a backend-hez
        const response = await axios.post('http://localhost:3001/api/guest/register-guest', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
          // 🆕 CSAK A KÖTELEZŐ MEZŐKET KÜLDJÜK
        });
        
        if (response.data.success) {
          console.log('✅ Regisztráció sikeres');
          
          // ✅ CSAK A SIKERES VÁLASZ UTÁN HÍVJUK
          onRegistration(formData);
          
          // ✅ Állapot resetelése, hogy ne lehessen újra küldeni
          setFormData({
            firstName: '',
            lastName: '',
            birthDate: '',
            gender: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            newsletter: true,
            hairType: '',
            hairCondition: '',
            favoriteServices: [],
            allergies: '',
            notes: ''
          });
          
          console.log('✅ Regisztráció sikeres, form resetelve');
        }
      } catch (error) {
        console.error('Regisztrációs hiba:', error);
        alert(error.response?.data?.error || 'Hiba történt a regisztráció során');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 1. lépés: Személyes adatok
  const renderStep1 = () => (
    <div className="form-step">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">Keresztnév *</label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={errors.firstName ? 'error' : ''}
            placeholder="Adja meg keresztnevét"
          />
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Vezetéknév *</label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={errors.lastName ? 'error' : ''}
            placeholder="Adja meg vezetéknevét"
          />
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="birthDate">Születési dátum *</label>
          <input
            type="date"
            id="birthDate"
            value={formData.birthDate}
            onChange={(e) => handleInputChange('birthDate', e.target.value)}
            className={errors.birthDate ? 'error' : ''}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.birthDate && <span className="error-text">{errors.birthDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="gender">Nem</label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
          >
            <option value="">Válasszon...</option>
            <option value="female">Nő</option>
            <option value="male">Férfi</option>
            <option value="other">Egyéb</option>
            <option value="prefer-not-to-say">Nem szeretném megadni</option>
          </select>
        </div>
      </div>
    </div>
  );

  // 2. lépés: Elérhetőség
  const renderStep2 = () => (
    <div className="form-step">
      <div className="form-group">
        <label htmlFor="email">Email cím *</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={errors.email ? 'error' : ''}
          placeholder="pelda@email.hu"
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Telefonszám *</label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className={errors.phone ? 'error' : ''}
          placeholder="+36201234567"
        />
        {errors.phone && <span className="error-text">{errors.phone}</span>}
        <small className="hint">Formátum: +36201234567 vagy 06201234567</small>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="password">Jelszó *</label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={errors.password ? 'error' : ''}
            placeholder="Minimum 8 karakter"
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Jelszó megerősítése *</label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? 'error' : ''}
            placeholder="Ismételje meg a jelszót"
          />
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.newsletter}
            onChange={(e) => handleInputChange('newsletter', e.target.checked)}
          />
          <span className="checkmark"></span>
          Szeretnék hírlevelet kapni az akciókról és újdonságokról
        </label>
      </div>
    </div>
  );

  // 3. lépés: Preferenciák
  const renderStep3 = () => (
    <div className="form-step">
      <div className="form-group">
        <label htmlFor="hairType">Hajtípus</label>
        <select
          id="hairType"
          value={formData.hairType}
          onChange={(e) => handleInputChange('hairType', e.target.value)}
        >
          <option value="">Válasszon hajtípust...</option>
          {hairTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="hairCondition">Hajállapot</label>
        <select
          id="hairCondition"
          value={formData.hairCondition}
          onChange={(e) => handleInputChange('hairCondition', e.target.value)}
        >
          <option value="">Válasszon hajállapotot...</option>
          {hairConditions.map(condition => (
            <option key={condition} value={condition}>{condition}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Kedvenc szolgáltatások</label>
        <div className="services-grid">
          {services.map(service => (
            <label key={service} className="service-checkbox">
              <input
                type="checkbox"
                checked={formData.favoriteServices.includes(service)}
                onChange={() => handleServiceToggle(service)}
              />
              <span className="checkmark"></span>
              {service}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="allergies">Allergiák / érzékenységek</label>
        <textarea
          id="allergies"
          value={formData.allergies}
          onChange={(e) => handleInputChange('allergies', e.target.value)}
          placeholder="Pl.: Parafenilén-diamin allergia, bőrérzékenység..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Egyéb megjegyzések</label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Egyéb speciális igények, megjegyzések..."
          rows="3"
        />
      </div>

      <div className="privacy-notice">
        <h4>🔒 Adatvédelmi tájékoztató</h4>
        <p>
          Regisztrációjával hozzájárul, hogy a szalon kezelje személyes adatait időpontfoglalás 
          és szolgáltatásnyújtás céljából. Adatait bizalmasan kezeljük, és harmadik félnek 
          nem adjuk át.
        </p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="guest-form">
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      <div className="form-actions">
        {currentStep > 1 && (
          <button type="button" className="btn secondary" onClick={handleBack}>
            ← Vissza
          </button>
        )}
        
        {currentStep < 3 ? (
          <button type="button" className="btn primary" onClick={handleNext}>
            Tovább →
          </button>
        ) : (
          <button 
            type="submit" 
            className="btn success" 
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? 'Regisztráció...' : '✅ Regisztráció befejezése'}
          </button>
        )}
      </div>
    </form>
  );
};

export default GuestForm;