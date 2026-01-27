import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../Dashboard/utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [salonDb, setSalonDb] = useState(localStorage.getItem('salonDb'));
  const [managementDb, setManagementDb] = useState(localStorage.getItem('managementDb'));

  // Axios interceptor beállítása salon adatbázis header-hez
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Token hozzáadása
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Salon adatbázis információk hozzáadása
        const currentSalonDb = localStorage.getItem('salonDb');
        const currentManagementDb = localStorage.getItem('managementDb');
        
        if (currentSalonDb) {
          config.headers['X-Salon-Database'] = currentSalonDb;
        }
        if (currentManagementDb) {
          config.headers['X-Management-Database'] = currentManagementDb;
        }
        
        console.log('🔍 Request headers:', config.headers);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Auto-login token alapján
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
      
      // Salon adatbázis információk mentése, ha érkeznek
      if (response.data.user?.salon_db_name) {
        localStorage.setItem('salonDb', response.data.user.salon_db_name);
        setSalonDb(response.data.user.salon_db_name);
      }
      if (response.data.user?.management_db_name) {
        localStorage.setItem('managementDb', response.data.user.management_db_name);
        setManagementDb(response.data.user.management_db_name);
      }
      
    } catch (error) {
      console.error('Auth check failed:', error);
      // Csak csendes logout, ne hívja meg az újraindítást
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Regisztrációs hiba' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      console.log('🔍 Raw response:', response);
      console.log('🔍 Response data:', response.data);
      
      const responseData = response.data;
      
      if (responseData.success && responseData.token && responseData.user) {
        // Token mentése
        localStorage.setItem('token', responseData.token);
        setToken(responseData.token);
        
        // Salon adatbázis információk mentése
        if (responseData.user.salon_db_name) {
          localStorage.setItem('salonDb', responseData.user.salon_db_name);
          setSalonDb(responseData.user.salon_db_name);
        }
        if (responseData.user.management_db_name) {
          localStorage.setItem('managementDb', responseData.user.management_db_name);
          setManagementDb(responseData.user.management_db_name);
        }
        
        // User adatok mentése
        setUser(responseData.user);
        
        // Authorization header beállítása
        axios.defaults.headers.common['Authorization'] = `Bearer ${responseData.token}`;
        
        console.log('✅ Login successful, salonDb:', responseData.user.salon_db_name);
        return responseData;
      } else {
        throw new Error(responseData.error || 'Invalid response format');
      }
      
    } catch (error) {
      console.error('❌ Login catch error:', error);
      
      const errorMessage = 
        error.response?.data?.error ||
        error.message ||
        'Bejelentkezési hiba';
      
      throw { error: errorMessage };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await axios.post('/api/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Email verification hiba' };
    }
  };

  const registerStylist = async (stylistData) => {
  try {
    const response = await fetch(`${axios.defaults.baseURL}/api/auth/register-stylist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stylistData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Stylist regisztrációs hiba');
    }

    return data;
  } catch (error) {
    console.error('Stylist regisztrációs hiba:', error);
    throw error;
  }
};

  const logout = () => {
    // Összes adat törlése
    localStorage.removeItem('token');
    localStorage.removeItem('salonDb');
    localStorage.removeItem('managementDb');
    
    setToken(null);
    setUser(null);
    setSalonDb(null);
    setManagementDb(null);
    
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    token,
    salonDb,
    managementDb,
    register,
    login,
    verifyEmail,
    logout,
    registerStylist,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
