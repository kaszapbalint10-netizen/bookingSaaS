import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import '../css/ServicesTeam.css';

const Tools = () => {
  const presetOptions = [
    'Szék',
    'Váróhely',
    'Hajszárító búra',
    'Fejmosó állomás',
    'Gőzbúra',
    'Mobil fejmosó',
    'Klimaxon',
    '2 in 1 Gőzölő és szárító állvány',
    'Egyéb',
  ];

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(presetOptions[0]);
  const [customName, setCustomName] = useState('');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCustomId = (type) => {
    const safe = (type || 'eszkoz').toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    return `${safe || 'eszkoz'}-${Date.now()}`;
  };

  const loadResources = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/dashboard/resources');
      const mapped = (data || []).map((row) => ({
        id: row.id,
        custom_id: row.custom_id,
        name: row.type,
        qty: 1,
        note: row.description || '',
      }));
      setItems(mapped);
      setError('');
    } catch (err) {
      console.error('Tools load error', err);
      setError('Nem sikerült betölteni az eszközöket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const addItem = async () => {
    const name = selected === 'Egyéb' ? customName.trim() : selected;
    if (!name) return;
    const amount = Number(qty) > 0 ? Number(qty) : 1;
    const newItem = {
      custom_id: generateCustomId(name),
      name,
      qty: amount,
      note: note.trim(),
    };

    // optimista UI
    setItems((prev) => [...prev, newItem]);

    try {
      await axios.post('/api/dashboard/resources', {
        custom_id: newItem.custom_id,
        type: newItem.name,
        description: newItem.note || null,
      });
      setError('');
    } catch (err) {
      console.error('Tools save error', err);
      setError('Nem sikerült menteni az eszközt az adatbázisba.');
      // visszavonás hiba esetén
      setItems((prev) => prev.filter((it) => it.custom_id !== newItem.custom_id));
    }

    setCustomName('');
    setQty(1);
    setNote('');
    setSelected(presetOptions[0]);
    setShowForm(false);
  };

  return (
    <section className="glass-section">
      <header>
        <h2 className="glass-title">Műhely és szerszám készlet</h2>
        {error && <p className="glass-desc" style={{ color: '#ffb3b3' }}>{error}</p>}
      </header>

      <div className="services-grid-tools">
        {items.map((tool, idx) => (
          <div key={tool.custom_id || idx} className="service-card">
            <div className="service-head">
              <h4 className="service-name">{tool.name}</h4>
              <p className="service-meta">Mennyiség: {tool.qty ?? 1}</p>
            </div>
            {tool.note && <p className="glass-desc">{tool.note}</p>}
          </div>
        ))}

        {!showForm && (
          <div className="add-card" onClick={() => setShowForm(true)}>
            <div className="plus">+</div>
            <div className="add-label">Új eszköz hozzáadása</div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Új eszköz</h3>
              <button className="modal-close" onClick={() => setShowForm(false)} type="button">
                Bezárás
              </button>
            </div>
            <form className="service-form" onSubmit={(e) => e.preventDefault()}>
              <label className="field-label">Válassz eszközt</label>
              <select
                className="glass-select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {presetOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {selected === 'Egyéb' && (
                <input
                  className="input"
                  type="text"
                  placeholder="Egyéb eszköz neve"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              )}

              <div className="service-form" style={{ padding: 0 }}>
                <label className="field-label">Mennyiség</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>

              <div className="service-form" style={{ padding: 0 }}>
                <label className="field-label">Leírás (opcionális)</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="Megjegyzés / leírás"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowForm(false)}
                >
                  Mégse
                </button>
                <button type="button" className="glass-action" onClick={addItem}>
                  Hozzáadás
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Tools;
