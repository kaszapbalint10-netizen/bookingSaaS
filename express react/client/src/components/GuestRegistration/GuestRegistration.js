import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../UI';
import GuestForm from './GuestForm';
import './GuestRegistration.css';

const GuestRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const salonId = searchParams.get('salonId') || '';

  const handleRegistration = async (guestData) => {
    setRegistrationData(guestData);
    toast.success('Sikeres regisztráció!', { title: 'Üdvözöljük' });
    setTimeout(() => {
      navigate('/guest-registration/success', { 
        state: { guestData } 
      });
    }, 1500);
  };

  const steps = [
    { number: 1, title: 'Személyes adatok', icon: '👤' },
    { number: 2, title: 'Elérhetőség', icon: '📱' },
    { number: 3, title: 'Előnyben részesítések', icon: '⭐' }
  ];

  return (
    <div className="guest-registration">
      <div className="registration-header">
        <div className="header-content">
          <h1>Üdvözöljük! 🎉</h1>
          <p>Regisztráljon vendégként, és foglaljon időpontot könnyedén</p>
        </div>
      </div>

      <div className="registration-container">
        <div className="registration-sidebar">
          <div className="steps-container">
            <h3>Regisztráció lépései</h3>
            {steps.map(step => (
              <div 
                key={step.number} 
                className={`step-item ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
              >
                <div className="step-icon">
                  {step.icon}
                </div>
                <div className="step-content">
                  <div className="step-number">0{step.number}</div>
                  <div className="step-title">{step.title}</div>
                </div>
                {currentStep > step.number && (
                  <div className="step-check">✓</div>
                )}
              </div>
            ))}
          </div>

          <div className="sidebar-info">
            <div className="info-card">
              <h4>🎯 Miért érdemes regisztrálni?</h4>
              <ul>
                <li>Gyors időpontfoglalás</li>
                <li>Egyedi ajánlatok</li>
                <li>Kedvezmények</li>
                <li>Időpont emlékeztető</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="registration-main">
          <div className="form-container">
            <div className="form-header">
              <h2>{steps.find(s => s.number === currentStep)?.title}</h2>
              <p>Kérjük, töltse ki az alábbi adatokat</p>
            </div>

            <GuestForm
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              onRegistration={handleRegistration}
              loading={loading}
              salonId={salonId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestRegistration;