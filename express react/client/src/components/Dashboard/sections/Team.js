// sections/Team.js
import React, { useState } from 'react';
import axios from 'axios';

const Team = ({ team, loadTeam }) => {
  const [newStaffMember, setNewStaffMember] = useState({
    name: '',
    specialty: '',
    email: '',
    role: 'stylist'
  });

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/dashboard/team', newStaffMember);
      if (response.data.success) {
        await loadTeam();
        setNewStaffMember({ name: '', specialty: '', email: '', role: 'stylist' });
        alert('Csapattag hozzaadva');
      }
    } catch (error) {
      console.error('Csapattag hozzaadasi hiba:', error);
      const errorMessage = error.response?.data?.error || 'Hiba a csapattag hozzaadasakor!';
      alert(`Hiba: ${errorMessage}`);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Biztosan torolni szeretned ezt a csapattagot?')) {
      try {
        const response = await axios.delete(`http://localhost:3001/api/dashboard/team/${id}`);
        if (response.data.success) {
          await loadTeam();
          alert('Csapattag torolve');
        }
      } catch (error) {
        console.error('Csapattag torlesi hiba:', error);
        alert('Hiba a csapattag torlesekor!');
      }
    }
  };

  return (
    <section id="team" className="section shown">
      <h1 className="title">Csapat</h1>
      
      <div className="card" style={{marginBottom: '20px'}}>
        <h3 style={{marginBottom: '15px'}}>Uj csapattag hozzaadasa</h3>
        <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px'}}>
          Az uj csapattag alapertelmezett jelszot kap, amit kesobb megvaltoztathat.
        </p>
        <form onSubmit={handleAddStaff} className="form-grid">
          <input
            type="text"
            placeholder="Teljes nev *"
            value={newStaffMember.name}
            onChange={(e) => setNewStaffMember({...newStaffMember, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Szakterulet *"
            value={newStaffMember.specialty}
            onChange={(e) => setNewStaffMember({...newStaffMember, specialty: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email *"
            value={newStaffMember.email}
            onChange={(e) => setNewStaffMember({...newStaffMember, email: e.target.value})}
            required
          />
          <select
            value={newStaffMember.role}
            onChange={(e) => setNewStaffMember({...newStaffMember, role: e.target.value})}
          >
            <option value="stylist">Fodrasz</option>
            <option value="admin">Admin</option>
            <option value="reception">Recepcios</option>
          </select>
          <button type="submit" className="btn full-width">
            Csapattag hozzaadasa
          </button>
        </form>
      </div>

      <div className="team-grid">
        {team.length > 0 ? (
          team.map((member, index) => (
            <article key={index} className="card team-member">
              <div className="member-header">
                <div className="avatar">{member.name[0]}</div>
                <div className="member-info">
                  <strong>{member.name}</strong>
                  <span className="specialty">{member.specialty}</span>
                  <span className="role">
                    {member.role === 'owner' ? 'Tulajdonos' : 
                     member.role === 'admin' ? 'Admin' : 
                     member.role === 'stylist' ? 'Fodrasz' : 'Recepcios'}
                  </span>
                </div>
              </div>
              <div className="member-contact">{member.email}</div>
              {member.role !== 'owner' && (
                <button 
                  className="btn danger full-width"
                  onClick={() => handleDeleteStaff(member.id)}
                >
                  Torles
                </button>
              )}
            </article>
          ))
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>
            <p>Nincsenek csapattagok</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Team;
