// sections/OpeningHours.js - JAVÍTOTT
import React, { useState } from 'react';
import axios from 'axios';
import { Calendar, Button, Input, useToast } from '../../UI';
import '../css/OpeningHours.css';

const OpeningHours = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [currentStartTime, setCurrentStartTime] = useState('09:00');
  const [currentEndTime, setCurrentEndTime] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // HIÁNYZÓ FÜGGVÉNYEK HOZZÁADVA
  const addTimeSlot = () => {
    if (!selectedDate) return;
    
    const newSlot = {
      date: selectedDate,
      start_time: currentStartTime,
      end_time: currentEndTime,
      time_slot_type: 'OPEN',
    };
    
    setTimeSlots([...timeSlots, newSlot]);
  };

  const updateTimeSlot = (index, field, value) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index][field] = value;
    setTimeSlots(updatedSlots);
  };

  const removeTimeSlot = (index) => {
    const updatedSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedSlots);
  };

  const handleSave = async () => {
    if (timeSlots.length === 0) {
      toast.warning('Kérjük, adj hozzá legalább egy időintervallumot!', { title: 'Hiányzó adat' });
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/dashboard/opening-hours', { 
        date: selectedDate,
        timeSlots 
      });
      
      toast.success('Nyitvatartás sikeresen mentve!', { title: 'Siker' });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Hiba történt a mentés során';
      toast.error(errorMsg, { title: 'Hiba' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="opening-hours" className="section shown opening-hours-section">
      <div className="section-header">
        <h1 className="title">🕐 Nyitvatartás</h1>
        <p className="subtitle">Szalon nyitvatartási idejének beállítása</p>
      </div>
      
      <div className="opening-hours-container">
        {/* Bal oldal - Dátum és idő választó */}
        <div className="date-time-picker">
          <div className="picker-card">
            <h3>📅 Dátum és idő beállítása</h3>
            
            <Calendar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />

            <div className="time-inputs">
              <Input
                label="Nyitás időpontja"
                type="time"
                value={currentStartTime}
                onChange={(e) => setCurrentStartTime(e.target.value)}
                icon="🔓"
              />
              <Input
                label="Zárás időpontja"
                type="time"
                value={currentEndTime}
                onChange={(e) => setCurrentEndTime(e.target.value)}
                icon="🔒"
              />
            </div>

            <Button 
              variant="primary"
              fullWidth
              onClick={addTimeSlot}
              disabled={!selectedDate}
            >
              ➕ Időintervallum hozzáadása
            </Button>
          </div>
        </div>

        {/* Jobb oldal - Időpontok listája */}
        <div className="time-slots-container">
          <div className="slots-card">
            <h3>⏰ Beállított időpontok</h3>
            
            <div className="time-slots">
              {timeSlots.length > 0 ? (
                timeSlots.map((slot, index) => (
                  <div key={index} className="time-slot-item">
                    <div className="slot-type">
                      <select
                        value={slot.time_slot_type}
                        onChange={(e) => updateTimeSlot(index, 'time_slot_type', e.target.value)}
                        className="slot-type-select"
                      >
                        <option value="OPEN">📖 Nyitvatartás</option>
                        <option value="BREAK">☕ Pihenőidő</option>
                      </select>
                    </div>
                    
                    <div className="slot-times">
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                        className="time-input"
                      />
                      <span className="separator">→</span>
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                        className="time-input"
                      />
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Helyszín (opcionális)"
                      value={slot.location || ''}
                      onChange={(e) => updateTimeSlot(index, 'location', e.target.value)}
                      className="location-input"
                    />
                    
                    <Button 
                      variant="danger"
                      size="small"
                      onClick={() => removeTimeSlot(index)}
                    >
                      🗑️
                    </Button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state__icon">🕐</div>
                  <p>Még nincsenek időintervallumok</p>
                  <p className="text-muted">Válassz dátumot és add hozzá az első időpontot!</p>
                </div>
              )}
            </div>

            {timeSlots.length > 0 && (
              <div className="actions">
                <Button 
                  variant="primary"
                  fullWidth
                  onClick={handleSave}
                  loading={loading}
                >
                  💾 Mentés
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OpeningHours;