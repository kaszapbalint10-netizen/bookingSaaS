// App.js - EGYSZERŰBB VERZIÓ
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthContext';
import { ToastProvider } from './components/UI/Toast';
import AssistantSelector from './components/AssistantSelector/AssistantSelector';
import Dashboard from './components/Dashboard/Dashboard';
import RegisterSalon from './components/Auth/RegisterSalon';
import VerifyEmail from './components/Auth/VertifyEmail';
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import StylistRegistration from './components/Auth/RegisterStylist';  
import SalonBrowser from './components/SalonBrowser/SalonBrowser';
import SalonDetail from './components/SalonBrowser/SalonDetail';
import GuestRegistration from './components/GuestRegistration/GuestRegistration';
import RegistrationSuccess from './components/GuestRegistration/RegistrationSuccess';
import GuestVerifyEmail from './components/GuestRegistration/GuestVerifyEmail'; 
import './styles/globals.css';

function App() {
  const [currentView, setCurrentView] = useState('demo');

  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register-salon" element={<RegisterSalon />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" />} />
              <Route path="/register-stylist" element={<StylistRegistration />} />
              <Route path="/salons" element={<SalonBrowser />} />
              <Route path="/salon/:slug" element={<SalonDetail />} />
              <Route path="/guest-registration" element={<GuestRegistration />} />
              <Route path="/guest-registration/success" element={<RegistrationSuccess />} />
              <Route path="/verify-guest-email" element={<GuestVerifyEmail />} />
            </Routes>
          </div>
        </Router>   
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
