import React, { useState, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import axios from 'axios';

const CalendarWithTimePicker = ({
  selectedDate,
  onDateChange,
  startTime = '09:00',
  onStartTimeChange,
  endTime = '17:00',
  onEndTimeChange,
  className = ''
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [openingHours, setOpeningHours] = useState({});
  const calendarRef = useRef(null);

  // Betöltjük a nyitvatartásokat a kiválasztott dátumhoz
  useEffect(() => {
    if (selectedDate) {
      loadOpeningHoursForDate(selectedDate);
    }
  }, [selectedDate]);

  // Betöltjük a nyitvatartásokat egy hónapra
  useEffect(() => {
    if (isCalendarOpen) {
      loadOpeningHoursForMonth();
    }
  }, [isCalendarOpen]);

  const loadOpeningHoursForDate = async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await axios.get(`/api/dashboard/opening-hours/${dateStr}`);
      setOpeningHours(prev => ({
        ...prev,
        [dateStr]: response.data
      }));
    } catch (error) {
      console.error('Hiba a nyitvatartások betöltésekor:', error);
    }
  };

  const loadOpeningHoursForMonth = async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const startDateStr = format(firstDayOfMonth, 'yyyy-MM-dd');
      const endDateStr = format(lastDayOfMonth, 'yyyy-MM-dd');
      
      const response = await axios.get(
        `/api/dashboard/opening-hours?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      
      const hoursMap = {};
      response.data.forEach(slot => {
        if (!hoursMap[slot.date]) {
          hoursMap[slot.date] = [];
        }
        hoursMap[slot.date].push(slot);
      });
      
      setOpeningHours(hoursMap);
    } catch (error) {
      console.error('Hiba a havi nyitvatartások betöltésekor:', error);
    }
  };

  // Kattintás a kalendáron kívülre
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date) => {
    onDateChange(date);
    setIsCalendarOpen(false);
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'Válassz dátumot';
    return format(date, 'yyyy. MMMM dd.', { locale: hu });
  };

  // Egyedi dátum formázó a naptárban
  const formatDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hours = openingHours[dateStr];
    
    if (hours && hours.length > 0) {
      const openSlots = hours.filter(slot => slot.time_slot_type === 'OPEN');
      const breakSlots = hours.filter(slot => slot.time_slot_type === 'BREAK');
      
      return (
        <div className="custom-day">
          <div className="day-number">{format(date, 'd')}</div>
          <div className="day-slots">
            {openSlots.length > 0 && (
              <div className="slot-indicator open" title={`${openSlots.length} nyitvatartás`}>
                🟢
              </div>
            )}
            {breakSlots.length > 0 && (
              <div className="slot-indicator break" title={`${breakSlots.length} pihenőidő`}>
                🔴
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return format(date, 'd');
  };

  // Dátum módosító a naptárban
  const modifiers = {
    hasOpeningHours: Object.keys(openingHours).map(dateStr => new Date(dateStr)),
    hasOpenSlots: Object.keys(openingHours)
      .filter(dateStr => openingHours[dateStr].some(slot => slot.time_slot_type === 'OPEN'))
      .map(dateStr => new Date(dateStr)),
    hasBreakSlots: Object.keys(openingHours)
      .filter(dateStr => openingHours[dateStr].some(slot => slot.time_slot_type === 'BREAK'))
      .map(dateStr => new Date(dateStr)),
  };

  const modifiersStyles = {
    hasOpeningHours: {
      position: 'relative',
      fontWeight: 'bold'
    },
    hasOpenSlots: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #0ea5e9'
    },
    hasBreakSlots: {
      backgroundColor: '#fef2f2',
      border: '1px solid #ef4444'
    }
  };

  return (
    <div className={`calendar-time-picker ${className}`}>
      {/* Dátum választó input */}
      <div className="date-input-container">
        <label className="input-label">Dátum</label>
        <div 
          className="date-input"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        >
          <CalendarIcon size={18} />
          <span className="date-text">{formatDisplayDate(selectedDate)}</span>
          {selectedDate && (
            <button 
              className="clear-date"
              onClick={(e) => {
                e.stopPropagation();
                onDateChange(null);
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Naptár dropdown */}
        {isCalendarOpen && (
          <div className="calendar-dropdown" ref={calendarRef}>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={hu}
              className="custom-day-picker"
              formatters={{ formatDay }}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
            
            {/* Jelmagyarázat */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-color open">🟢</span>
                <span>Nyitvatartás</span>
              </div>
              <div className="legend-item">
                <span className="legend-color break">🔴</span>
                <span>Pihenőidő</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Idő választók */}
      <div className="time-inputs">
        <div className="time-input-group">
          <label className="input-label">
            <Clock size={16} />
            Kezdési idő
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="time-input"
          />
        </div>

        <div className="time-input-group">
          <label className="input-label">
            <Clock size={16} />
            Befejezési idő
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="time-input"
          />
        </div>
      </div>

      {/* Kiválasztott dátum időpontjainak megjelenítése */}
      {selectedDate && openingHours[format(selectedDate, 'yyyy-MM-dd')] && (
        <div className="selected-date-slots">
          <h4>Beállított időpontok ezen a napon:</h4>
          {openingHours[format(selectedDate, 'yyyy-MM-dd')].map((slot, index) => (
            <div key={index} className={`slot-preview ${slot.time_slot_type.toLowerCase()}`}>
              <span className="slot-type">
                {slot.time_slot_type === 'OPEN' ? '🟢 Nyitvatartás' : '🔴 Pihenőidő'}
              </span>
              <span className="slot-time">
                {slot.start_time} - {slot.end_time}
              </span>
              {slot.location && (
                <span className="slot-location">({slot.location})</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarWithTimePicker;