import React, { useState } from 'react';
import '../css/ServicesTeam.css';

const Products = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  const addItem = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const amount = Number(qty) > 0 ? Number(qty) : 1;
    setItems((prev) => [...prev, { name: cleanName, qty: amount, note: note.trim() }]);
    setName('');
    setQty(1);
    setNote('');
    setShowForm(false);
  };

  return (
    <section className="glass-section">
      <header>
        <h2 className="glass-title">Felhasznált termékek</h2>
      </header>

      <div className="services-grid">
        {items.map((product, idx) => (
          <div key={idx} className="service-card">
            <div className="service-head">
              <h4 className="service-name">{product.name}</h4>
              <p className="service-meta">Mennyiség: {product.qty ?? 1}</p>
            </div>
            {product.note && <p className="glass-desc">{product.note}</p>}
          </div>
        ))}

        {!showForm && (
          <div className="add-card" onClick={() => setShowForm(true)}>
            <div className="plus">+</div>
            <div className="add-label">Új termék hozzáadása</div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Új termék</h3>
              <button className="modal-close" onClick={() => setShowForm(false)} type="button">
                Bezárás
              </button>
            </div>
            <form className="service-form" onSubmit={(e) => e.preventDefault()}>
              <input
                className="input"
                type="text"
                placeholder="Termék neve"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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

export default Products;
