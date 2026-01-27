// frontend/src/components/GuestVerifyEmail.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GuestVerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        console.log('🔐 GUEST Verify token:', token);
        
        // FONTOS: guest verify endpointot használjuk
        const response = await axios.get(`http://localhost:3001/api/guest/verify-guest-email?token=${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
          
          // 5 másodperc után átirányítás a bejelentkezéshez
          setTimeout(() => {
            navigate('/guest-login');
          }, 5000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Hiba a megerősítés során');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {status === 'loading' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Vendég email cím megerősítése...</h2>
          <p>Kérjük várjon, amíg megerősítjük email címét.</p>
        </div>
      )}
      
      {status === 'success' && (
        <div style={{ textAlign: 'center', color: 'green' }}>
          <h2>✅ Sikeres megerősítés!</h2>
          <p>{message}</p>
          <p>Átirányítás a bejelentkezéshez 5 másodpercen belül...</p>
          <button 
            onClick={() => navigate('/guest-login')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Azonnali átirányítás a bejelentkezéshez
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div style={{ textAlign: 'center', color: 'red' }}>
          <h2>❌ Hiba</h2>
          <p>{message}</p>
          <button 
            onClick={() => navigate('/guest-registration')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Újra regisztrálás
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestVerifyEmail;