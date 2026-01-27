// components/GuestRegistration/RegistrationSuccess.js (ha szeretnéd)
import React from 'react';
import { Link } from 'react-router-dom';

const RegistrationSuccess = () => {
  return (
    <div className="registration-success">
      <div className="success-container">
        <div className="success-icon">🎉</div>
        <h1>Sikeres regisztráció!</h1>
        <p>Köszönjük, hogy regisztrált nálunk! Hamarosan értesítjük emailben a fiók megerősítéséről.</p>
        
        <div className="success-actions">
          <Link to="/salons" className="btn primary">
            Szalonok böngészése
          </Link>
          <Link to="/" className="btn secondary">
            Főoldal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;