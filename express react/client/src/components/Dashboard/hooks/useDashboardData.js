// src/components/Dashboard/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig'; // ✅ HELYES ÚTVONAL

// Debug - ellenőrizd, hogy betöltődik-e az axios
console.log('🔍 Axios object:', axios);
console.log('🔍 Axios get method:', axios.get);

const useDashboardData = () => {
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [team, setTeam] = useState([]);
  const [openingHoursData, setOpeningHoursData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      console.log('💇 Szolgáltatások betöltése...');
      console.log('🔍 Axios a loadServices-ben:', axios);
      const response = await axios.get('/api/dashboard/services');
      console.log('✅ Szolgáltatások betöltve:', response.data);
      setServices(response.data);
    } catch (error) {
      console.error('Szolgáltatások betöltési hiba:', error);
      setServices([]);
    }
  };

  const loadOpeningHours = async () => {
    try {
      console.log('⏰ Nyitvatartás betöltése...');
      const response = await axios.get('/api/dashboard/opening-hours');
      console.log('✅ Nyitvatartás betöltve:', response.data);
      setOpeningHoursData(response.data);
    } catch (error) {
      console.error('Nyitvatartás betöltési hiba:', error);
      setOpeningHoursData([]);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Statisztikák betöltése...');
      const response = await axios.get('/api/dashboard/stats');
      console.log('✅ Statisztikák betöltve:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Statisztikák betöltési hiba:', error);
      setStats({
        todayBookings: 0,
        weeklyRevenue: 0,
        totalCustomers: 0,
        avgServiceTime: 0,
        isOpenToday: false,
        servicesCount: 0
      });
    }
  };

  const loadAppointments = async () => {
    try {
      console.log('📅 Időpontok betöltése...');
      const response = await axios.get('/api/dashboard/appointments');
      console.log('✅ Időpontok betöltve:', response.data);
      setAppointments(response.data);
    } catch (error) {
      console.error('Időpontok betöltési hiba:', error);
      setAppointments([]);
    }
  };

  const loadTeam = async () => {
    try {
      console.log('👥 Csapat betöltése...');
      const response = await axios.get('/api/dashboard/team');
      console.log('✅ Csapat betöltve:', response.data);
      setTeam(response.data);
    } catch (error) {
      console.error('Csapat betöltési hiba:', error);
      setTeam([]);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadStats(),
          loadAppointments(),
          loadServices(),
          loadOpeningHours(),
          loadTeam()
        ]);
      } catch (error) {
        console.error('Összes adat betöltési hiba:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  return {
    stats,
    appointments,
    services,
    team,
    openingHoursData,
    loading,
    loadServices,
    loadOpeningHours,
    loadStats,
    loadAppointments,
    loadTeam
  };
};

export default useDashboardData;