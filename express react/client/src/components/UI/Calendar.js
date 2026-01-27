import React, { useState } from 'react';
import './Calendar.css';

const Calendar = ({ selectedDate, onDateChange, disabledDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getDayName = (day) => ['Vas', 'Hét', 'Kedd', 'Szer', 'Csü', 'Pén', 'Szo'][day];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!disabledDates.includes(dateStr)) {
      onDateChange(dateStr);
    }
  };

  const days = [];
  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);

  // Előző hónap napjai
  const prevMonthDays = getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      isDisabled: true
    });
  }

  // Jelenlegi hónap napjai
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    const dateStr = date.toISOString().split('T')[0];
    const isDisabled = disabledDates.includes(dateStr) || date < new Date();
    
    days.push({
      day: i,
      isCurrentMonth: true,
      isDisabled: isDisabled,
      dateStr: dateStr
    });
  }

  // Következő hónap napjai
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      isDisabled: true
    });
  }

  const isSelected = (day) => {
    if (!day.isCurrentMonth || !selectedDate) return false;
    return day.dateStr === selectedDate;
  };

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav-btn">←</button>
        <h3>
          {currentMonth.toLocaleDateString('hu-HU', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} className="calendar-nav-btn">→</button>
      </div>

      <div className="calendar-weekdays">
        {['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'].map(day => (
          <div key={day} className="calendar-weekday">{getDayName(day)}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((dayObj, index) => (
          <button
            key={index}
            className={`calendar-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${
              dayObj.isDisabled ? 'disabled' : ''
            } ${isSelected(dayObj) ? 'selected' : ''}`}
            onClick={() => dayObj.isCurrentMonth && !dayObj.isDisabled && handleDateClick(dayObj.day)}
            disabled={dayObj.isDisabled}
          >
            {dayObj.day}
          </button>
        ))}
      </div>

      {selectedDate && (
        <div className="calendar-selected">
          <span>Kiválasztott: <strong>{new Date(selectedDate).toLocaleDateString('hu-HU')}</strong></span>
        </div>
      )}
    </div>
  );
};

export default Calendar;
