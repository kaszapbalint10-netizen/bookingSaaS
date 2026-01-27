import React, { useState } from 'react'
import axios from 'axios'
import '../css/ServicesTeam.css'

const TeamSection = ({ team = [], loadTeam }) => {
  const [form, setForm] = useState({ name: '', specialty: '', email: '', role: 'stylist' })
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fallback =
    team && team.length > 0
      ? team
      : [
          { name: 'Anna', specialty: 'Stylist', role: 'Fodrász', email: 'anna@example.com' },
          { name: 'Bence', specialty: 'Colorist', role: 'Fodrász', email: 'bence@example.com' },
          { name: 'Csilla', specialty: 'Stylist', role: 'Stylist', email: 'csilla@example.com' },
        ]

  const list = team && team.length > 0 ? team : fallback

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      alert('Név, szerepkör és email kötelező.')
      return
    }
    try {
      setLoading(true)
      await axios.post('/api/dashboard/team', form)
      setForm({ name: '', specialty: '', email: '', role: 'stylist' })
      setShowModal(false)
      if (typeof loadTeam === 'function') await loadTeam()
    } catch (error) {
      console.error('Csapattag mentési hiba:', error)
      alert('Hiba mentés közben')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="team" className="glass-section">
      <div>
        <h2 className="glass-title">Csapattagok</h2>
      </div>

      <div className="glass-grid">
        {list.map((member, idx) => (
          <div key={member.id || idx} className="glass-card">
            <div className="glass-row" style={{ justifyContent: 'space-between' }}>
              <div className="glass-row" style={{ gap: 10 }}>
                <div className="avatar">{member.name?.[0] || '?'}</div>
                <div>
                  <h3 style={{ margin: 0 }}>{member.name}</h3>
                  <div className="glass-row" style={{ gap: 6 }}>
                    <span>{member.specialty || 'Szakterület'}</span>
                  </div>
                </div>
              </div>
              <span className="badge-soft">{member.role || 'Fodrász'}</span>
            </div>
            {member.email && <p className="glass-desc">{member.email}</p>}
          </div>
        ))}
      </div>

      <div className="cta-bar">
        <button onClick={() => setShowModal(true)} className="glass-action">
          + Új csapattag
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>+ Új csapattag</h3>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
                Bezár
              </button>
            </div>
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Név *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Szakterület</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Szerepkör</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                  <option value="stylist">Stylist</option>
                  <option value="admin">Admin</option>
                  <option value="reception">Recepciós</option>
                  <option value="owner">Tulajdonos</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="modal-cta">
                Mentés
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default TeamSection
