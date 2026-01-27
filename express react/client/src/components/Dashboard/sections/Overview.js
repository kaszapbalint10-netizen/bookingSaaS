// sections/Overview.js
import React from 'react';
import { formatCurrency } from '../utils/formatters';

const Overview = ({ stats, appointments, team, services, user }) => {
  const getUserDisplayName = () => {
    if (!user) return 'Vendeg';
    return `${user.first_name} ${user.last_name}`;
  };

  return (
    <section id="overview" className="section shown">
      <h1 className="title">Szia, {getUserDisplayName()}!</h1>
      <p className="subtitle">
        {stats.todayBookings ? `${stats.todayBookings} mai foglalas` : 'Nincs mai foglalas'}
      </p>

      <div className="grid-2">
        <AppointmentsList appointments={appointments} />
        <QuickStats team={team} services={services} stats={stats} />
      </div>
    </section>
  );
};

const AppointmentsList = ({ appointments }) => (
  <article className="card">
    <div className="card-head">
      <h2>Kovetkezo idopontok</h2>
    </div>
    <div className="appointments-list">
      {appointments.length > 0 ? (
        appointments.slice(0, 5).map((appt, index) => (
          <div key={index} className="appointment-item">
            <div className="appointment-time">{appt.time}</div>
            <div className="appointment-details">
              <strong>{appt.service}</strong>
              <span>{appt.duration}</span>
            </div>
          </div>
        ))
      ) : (
        <p style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '20px'}}>
          Nincsenek idopontok
        </p>
      )}
    </div>
  </article>
);

const QuickStats = ({ team, services, stats }) => (
  <article className="card">
    <div className="card-head">
      <h2>Gyors statisztikak</h2>
    </div>
    <div className="stats-grid">
      <StatItem label="Aktiv csapattagok" value={team.length} />
      <StatItem label="Szolgaltatasok" value={services.length} />
      <StatItem label="Nyitva ma" value={stats.isOpenToday ? 'Igen' : 'Nem'} />
      <StatItem label="Heti bevetel" value={formatCurrency(stats.weeklyRevenue)} />
    </div>
  </article>
);

const StatItem = ({ label, value }) => (
  <div className="stat-item">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
  </div>
);

export default Overview;
