// VerifyEmail.js - JAVÍTOTT VERZIÓ
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button, useToast } from '../UI';
import './Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasVerified, setHasVerified] = useState(false); // 🔥 ÚJ - megakadályozza az ismétlődést

  useEffect(() => {
    const verifyToken = async () => {
      // 🔥 JAVÍTOTT: Egyszerre csak egy verification futhat
      if (isProcessing || hasVerified) return;
      
      setIsProcessing(true);
      setHasVerified(true);

      const token = searchParams.get('token');
      
      console.log('🔍 URL token:', token);

      if (!token || token === 'null' || token === 'undefined') {
        setStatus('error');
        setMessage('Hiányzó vagy érvénytelen verification token');
        setIsProcessing(false);
        return;
      }

      try {
        console.log('🔄 Token verification indítása:', token);
        const result = await verifyEmail(token);
        
        console.log('✅ Verification válasz:', result);
        
        // 🔥 JAVÍTOTT: A backend válasz alapján kezeljük a státuszt
        if (result.success) {
          if (result.status === 'verified') {
            setStatus('success');
            setMessage('Email cím sikeresen megerősítve! Átirányítás a dashboardra...');
            toast.success('Email megerősítve!', { title: 'Siker' });
            
            // Automatikus bejelentkezés 3 másodperc múlva
            setTimeout(() => {
              navigate('/dashboard?section=settings');
            }, 3000);
            
          } else if (result.status === 'already_verified') {
            setStatus('already_verified');
            setMessage('Ez az email cím már korábban megerősítésre került.');
            toast.info('Email már megerősítve', { title: 'Információ' });
          }
        } else {
          setStatus('error');
          setMessage(result.error || 'Verifikációs hiba történt');
          toast.error(result.error || 'Verifikációs hiba', { title: 'Hiba' });
        }

      } catch (error) {
        console.error('❌ Verification hiba:', error);
        
        // 🔥 JAVÍTOTT: Pontosabb hibaüzenetek
        let errorMessage = 'Verifikációs hiba történt';
        if (error.message?.includes('érvénytelen') || error.message?.includes('lejárt')) {
          errorMessage = 'Érvénytelen vagy lejárt verification token';
        } else if (error.error?.includes('érvénytelen') || error.error?.includes('lejárt')) {
          errorMessage = 'Érvénytelen vagy lejárt verification token';
        } else {
          errorMessage = error.message || error.error || 'Verifikációs hiba történt';
        }
        
        setStatus('error');
        setMessage(errorMessage);
        toast.error(errorMessage, { title: 'Hiba' });
      } finally {
        setIsProcessing(false);
      }
    };

    verifyToken();
  }, [searchParams, verifyEmail, navigate, isProcessing, hasVerified]); // 🔥 HOZZÁADVA: hasVerified

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge">
            <span>✅</span>
          </div>
          <h1>Email Megerősítés</h1>
        </div>

        <div className="verification-content">
          {status === 'verifying' && (
            <div className="verification-status">
              <div className="loading-spinner">⏳</div>
              <p>Email cím megerősítése...</p>
              <p className="muted">Kérjük várjon, ez eltarthat néhány másodpercig</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verification-status success">
              <div className="status-icon">✅</div>
              <h3>Sikeres megerősítés!</h3>
              <p>{message}</p>
              <p className="muted">Átirányítás a dashboardra...</p>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          )}

          {status === 'already_verified' && (
            <div className="verification-status success">
              <div className="status-icon">ℹ️</div>
              <h3>Már meg van erősítve!</h3>
              <p>{message}</p>
              <Button 
                onClick={() => navigate('/login')}
                variant="primary"
                style={{ marginTop: '16px', width: '100%' }}
              >
                Tovább a Bejelentkezéshez
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="verification-status error">
              <div className="status-icon">❌</div>
              <h3>Hiba történt</h3>
              <p>{message}</p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                <Button 
                  onClick={() => navigate('/login')}
                  variant="primary"
                  fullWidth
                >
                  Bejelentkezés
                </Button>
                <Button 
                  onClick={() => navigate('/register-salon')}
                  variant="ghost"
                  fullWidth
                >
                  Új regisztráció
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="text"
                  fullWidth
                  style={{ marginTop: '10px', fontSize: '14px' }}
                >
                  Újrapróbálás
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;