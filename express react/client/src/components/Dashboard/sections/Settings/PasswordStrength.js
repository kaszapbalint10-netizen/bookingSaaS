// components/Dashboard/components/PasswordStrength/PasswordStrength.js
import React from 'react';
import './css/PasswordStrength.css';

const PasswordStrength = ({ password }) => {
  const calculateStrength = (pwd) => {
    let score = 0;
    
    if (!pwd) return 0;
    
    // Hossz
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    
    // Komplexitás
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    
    return Math.min(score, 5);
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['Nagyon gyenge', 'Gyenge', 'Közepes', 'Erős', 'Nagyon erős'];
  const strengthColors = ['#ff4444', '#ff8800', '#ffbb33', '#00C851', '#007E33'];

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="strength-bar">
        {[1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            className={`strength-segment ${strength >= level ? 'active' : ''}`}
            style={{ backgroundColor: strength >= level ? strengthColors[strength - 1] : '#e0e0e0' }}
          ></div>
        ))}
      </div>
      <div className="strength-label" style={{ color: strengthColors[strength - 1] }}>
        {strengthLabels[strength - 1]}
      </div>
    </div>
  );
};

export default PasswordStrength;