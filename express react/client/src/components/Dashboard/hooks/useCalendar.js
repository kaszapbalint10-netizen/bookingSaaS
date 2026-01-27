// hooks/useCalendar.js
import { useState } from 'react';

export const useCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getWeekDates = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      week.push(current);
    }
    return week;
  };

  const getDayName = (date) => {
    const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    return days[date.getDay()];
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('hu-HU');
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  return {
    currentWeek,
    selectedDate,
    setSelectedDate,
    getWeekDates,
    getDayName,
    formatDate,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek
  };
};