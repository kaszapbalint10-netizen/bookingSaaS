import React, { useState } from 'react'
import axios from 'axios'
import '../css/ServicesTeam.css'

const ServicesGrid = ({ services = [], loadServices }) => {
  const [form, setForm] = useState({ name: '', duration: 30, price: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fallback =
    services && services.length > 0
      ? services
      : [
        ]

  const list = services && services.length > 0 ? services : fallback

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.duration) {
      alert('Név és időtartam kötelező.')
      return
    }
    try {
      setLoading(true)
      await axios.post('/api/dashboard/services', {
        service: form.name,
        duration: Number(form.duration),
        price: form.price ? Number(form.price) : 0,
        description: form.description || '',
      })
      setForm({ name: '', duration: 30, price: '', description: '' })
      setShowModal(false)
      if (typeof loadServices === 'function') await loadServices()
    } catch (error) {
      console.error('Szolgáltatás mentési hiba:', error)
      alert('Hiba mentés közben')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="services" className="glass-section">
      <div>

        <h2 className="glass-title">Szolgáltatások</h2>
      </div>

      <div className="glass-grid">
        {list.map((service, idx) => (
          <div key={service.id || idx} className="glass-card">
            <h3>{service.name || service.service || 'Névtelen szolgáltatás'}</h3>
            <p className="glass-desc">{service.description || 'Részletes leírás hamarosan.'}</p>
            <div className="glass-row">
              {service.price ? <span className="badge-soft">{service.price} Ft</span> : null}
              {service.duration ? <span className="badge-soft">~ {service.duration} perc</span> : null}
              {service.category ? <span className="badge-soft">{service.category}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="cta-bar">
        <button onClick={() => setShowModal(true)} className="glass-action">
          + Új szolgáltatás
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>+ Új szolgáltatás</h3>
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
              <div className="form-field">
                <label>Időtartam (perc) *</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  min={1}
                  required
                />
              </div>
              <div className="form-field">
                <label>Ár (Ft) – opcionális</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  min={0}
                />
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Leírás</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
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

export default ServicesGrid
