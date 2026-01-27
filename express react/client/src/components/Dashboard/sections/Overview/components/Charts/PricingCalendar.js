// sections/Overview/components/Charts/PricingCalendar.js
import React, { useMemo, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, getDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import '../../styles/PricingCalendar.css';

const Chevron = ({ dir }) => (
  <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d={dir === 'left' ? 'M15 18L9 12L15 6' : 'M9 6L15 12L9 18'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PricingCalendar = ({ data = [], isDarkMode, isCompact = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const toKey = (dateLike) => {
    if (!dateLike) return null;
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return null;
    return format(d, 'yyyy-MM-dd');
  };

  // Map provided data by date; no random mock so rings stay stable.
  const priceData = useMemo(() => {
    const map = {};
    let maxMetric = 0;
    let hasMetric = false;
    data.forEach((item) => {
      if (item?.date) {
        const key = toKey(item.date);
        if (!key) return;
        const revenue = Number(item.revenue) || 0;
        const bookings = Number(item.bookings) || Number(item.appointments) || 0;
        const completion = Number(item.completion) || 0;
        const metric = completion || bookings || revenue;
        if (metric > 0) hasMetric = true;
        if (metric > maxMetric) maxMetric = metric;
        map[key] = { value: revenue, bookings, completion, metric };
      }
    });
    return { map, maxMetric, hasMetric };
  }, [data]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const leading = (getDay(start) + 6) % 7; // Monday-first
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    const list = [];
    for (let i = 0; i < leading; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const key = format(dateObj, 'yyyy-MM-dd');
      const entry = priceData.map[key];
      const completion = Number(entry?.completion ?? 0);
      const perfRaw =
        completion > 0
          ? completion / 100 // completion már százalék
          : entry?.metric ?? entry?.bookings ?? entry?.value ?? 0;
      const normalized = Math.max(0, Math.min(1, perfRaw));
      const ringDeg = Math.round(normalized * 360);
      list.push({
        date: dateObj,
        key,
        perf: normalized,
        ringDeg,
        value: entry?.value ?? null,
        metric: completion || perfRaw,
        bookings: entry?.bookings ?? null,
        completion: entry?.completion ?? null,
      });
    }
    return list;
  }, [currentMonth, priceData]);

  const monthText = format(currentMonth, 'LLLL', { locale: hu });
  const yearText = format(currentMonth, 'yyyy', { locale: hu });

  const calendarClass = ['pricing-calendar', 'minimal'];
  if (isCompact) calendarClass.push('compact');
  if (isDarkMode) calendarClass.push('dark');

  return (
    <div className={calendarClass.join(' ')}>
      <div className="calendar-card slim">
        <div className="calendar-header shell">
          <div className="current-year">{yearText}</div>
          <div className="calendar-navigation compact">
            <button
              className="nav-btn"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMonth((m) => subMonths(m, 1));
              }}
            >
              <Chevron dir="left" />
            </button>
            <div className="nav-month">{monthText}</div>
            <button
              className="nav-btn"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMonth((m) => addMonths(m, 1));
              }}
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        <div className="calendar-body">
          <div className="weekdays">
            {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map((day, idx) => (
              <div key={`${day}-${idx}`} className="weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="days-grid">
            {days.map((item, idx) =>
              item ? (
                <button
                  key={item.key}
                  className={`day-button ${selected === item.key ? 'selected' : ''}`}
                  onClick={() => setSelected(item.key)}
                  title={
                    Number.isFinite(item.completion)
                      ? `${Math.round(item.completion)}% produktivitás`
                      : Number.isFinite(item.bookings)
                        ? `${item.bookings} foglalás`
                        : Number.isFinite(item.value)
                          ? `${item.value} Ft`
                          : 'Nincs adat'
                  }
                  style={{
                    '--ring-deg': `${item.ringDeg || 0}deg`,
                    '--ring-color': `hsl(${Math.round(40 + 60 * (item.perf || 0))}, 82%, 58%)`,
                    '--ring-scale': 0.45 + Math.min(1, Math.max(0, item.perf || 0)) * 0.55,
                  }}
                >
                  <span className="day-ring" aria-hidden="true" />
                  <span className="day-inner">
                    <span className="day-number">{format(item.date, 'd')}</span>
                  </span>
                </button>
              ) : (
                <div key={`empty-${idx}`} className="empty-day" />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalendar;
