// sections/Appointments.js
import React, { useEffect } from 'react';
import axios from '../utils/axiosConfig.js';

const Appointments = ({ appointments, loadAppointments }) => {
  useEffect(() => {
    console.log('Appointments list frissult', appointments);
  }, [appointments]);

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Fuggoben';
      case 1: return 'Befejezve';
      case 2: return 'Vendeg lemondta';
      case 3: return 'Stylist lemondta';
      default: return 'Ismeretlen';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return '#ffa500';
      case 1: return '#28a745';
      case 2: return '#dc3545';
      case 3: return '#6c757d';
      default: return '#6c757d';
    }
  };

  const handleDeleteAppointment = async (customerId, bookingDate) => {
    if (window.confirm('Biztosan torolni szeretned ezt az idopontot?')) {
      try {
        const response = await axios.delete(
          `http://localhost:3001/api/dashboard/appointments/${customerId}/${bookingDate}`
        );
        if (response.data.success) {
          await loadAppointments();
          alert('Idopont sikeresen torolve!');
        }
      } catch (error) {
        console.error('Idopont torlesi hiba:', error);
        alert('Hiba az idopont torlesekor!');
      }
    }
  };

  return (
    <section id="appointments" className="section shown">
      <h1 className="title">Idopontok</h1>
      <div className="card">
        {appointments && appointments.length > 0 ? (
          <div className="appointments-grid">
            {appointments.map((appt, index) => (
              <div key={index} className="appointment-card">
                <div className="appointment-header">
                  <span className="appointment-time">{appt.time}</span>
                  <span className="appointment-date">{appt.date}</span>
                  <span 
                    className="status-badge"
                    style={{backgroundColor: getStatusColor(appt.status)}}
                  >
                    {getStatusText(appt.status)}
                  </span>
                </div>
                
                <div className="appointment-body">
                  <h4>{appt.service}</h4>
                  <p><strong>Idotartam:</strong> {appt.duration} perc</p>
                  <p><strong>Vendeg:</strong> {appt.customer_name}</p>
                  <p><strong>Stylist:</strong> {appt.stylist_name}</p>
                  {appt.price && (
                    <p><strong>Ar:</strong> {appt.price} Ft</p>
                  )}
                  {appt.notes && (
                    <p><strong>Megjegyzes:</strong> {appt.notes}</p>
                  )}
                </div>
                
                <div className="appointment-actions">
                  <button className="btn ghost">Szerkesztes</button>
                  <button 
                    className="btn danger"
                    onClick={() => handleDeleteAppointment(appt.customer_id, appt.booking_date)}
                  >
                    Torles
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>
            <p>Nincsenek idopontok</p>
            <button onClick={() => loadAppointments()} className="btn">
              Ujratoltes
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Appointments;
