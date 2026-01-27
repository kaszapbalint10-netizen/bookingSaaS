import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, formatTime } from '../../../../utils/formatters';

const GRID_OPTION = { key: 'grid', label: 'Rács' };
const QUEUE_OPTION = { key: 'queue', label: 'Sor' };
const VIEW_OPTIONS = [GRID_OPTION, QUEUE_OPTION];

const VisualizeBookingCard = ({ data = [], appointments = [] }) => {
  const [view, setView] = useState(GRID_OPTION.key);
  const [hasMounted, setHasMounted] = useState(false);
  const isQueueView = view === QUEUE_OPTION.key;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const sortedRows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  const sliceWindow = (length, offset = 0) => {
    if (!length) return [];
    const start = Math.max(sortedRows.length - length - offset, 0);
    const end = Math.max(sortedRows.length - offset, 0);
    return sortedRows.slice(start, end);
  };

  const STAT_WINDOW = 7;
  const currentWindow = useMemo(
    () => sliceWindow(STAT_WINDOW),
    [sortedRows]
  );
  const previousWindow = useMemo(
    () => sliceWindow(STAT_WINDOW, STAT_WINDOW),
    [sortedRows]
  );
  const sumReducer = (rows, key) => rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
  const totalBookings = sumReducer(currentWindow, 'appointments');
  const prevBookings = sumReducer(previousWindow, 'appointments');
  const totalRevenue = sumReducer(currentWindow, 'revenue');
  const averagePerDay = STAT_WINDOW ? Math.round(totalBookings / STAT_WINDOW) : 0;
  const bookingDelta = prevBookings
    ? ((totalBookings - prevBookings) / prevBookings) * 100
    : null;

  const deltaLabel =
    bookingDelta === null ? 'Nincs adat' : `${bookingDelta > 0 ? '+' : ''}${bookingDelta.toFixed(1)}%`;
  const deltaClass = bookingDelta === null ? '' : bookingDelta >= 0 ? 'positive' : 'negative';

  const queueAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];

    const withDate = appointments.map((item, index) => {
      const datePart = item.date || item.booking_date || '';
      const timePart = item.time || item.booking_time || '';
      const combined = datePart
        ? new Date(`${datePart}T${timePart || '00:00'}`)
        : new Date();
      return {
        ...item,
        _sortDate: combined,
        _fallbackIndex: index,
      };
    });

    return withDate
      .sort((a, b) => {
        if (a._sortDate && b._sortDate) {
          return a._sortDate - b._sortDate;
        }
        return a._fallbackIndex - b._fallbackIndex;
      })
      .slice(0, 8);
  }, [appointments]);

  const getAppointmentName = (item) =>
    item.customer_name || item.customer || item.name || 'Vendég';

  const getAppointmentService = (item) =>
    item.service || item.service_name || 'Szolgáltatás';

  const calendarCells = useMemo(() => {
    const cells = sortedRows.slice(-12);
    const max = Math.max(
      1,
      ...cells.map((row) => Number(row.appointments || 0))
    );
    return cells.map((row) => ({
      id: row.date,
      label: formatDate(row.date).slice(0, 5),
      value: Number(row.appointments || 0),
      intensity: row.appointments ? Number(row.appointments) / max : 0,
    }));
  }, [sortedRows]);

  const queueOverlay = (
    <AnimatePresence>
      {isQueueView && (
        <motion.div
          key="queue-overlay"
          className="queue-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setView(GRID_OPTION.key)}
        >
          <motion.section
            className="queue-modal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="queue-modal-head">
              <div>
                <p>Aktív sor</p>
                <h4>Következő vendégek</h4>
              </div>
              <button
                type="button"
                className="queue-close"
                onClick={() => setView(GRID_OPTION.key)}
              >
                Bezárás
              </button>
            </div>
            <div className="queue-list">
              {queueAppointments.length ? (
                queueAppointments.map((item, idx) => (
                  <div key={`${item.id || idx}`} className="queue-row">
                    <div>
                      <strong>{getAppointmentName(item)}</strong>
                      <span>{getAppointmentService(item)}</span>
                    </div>
                    <span className="queue-time">
                      {formatTime(item.time || item.booking_time) || formatDate(item.date)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-state">Nincsenek sorban álló foglalások.</p>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="visualize-card">
        <div className="visualize-head">
          <div>
            <p>Naptár</p>
            <h3>Rács nézet</h3>
          </div>
          <div className="visualize-switch">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`visualize-option ${view === option.key ? 'is-active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setView(option.key);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key="grid-panel"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="visualize-panel"
        >
          <div className="visualize-grid">
            <div className="visualize-calendar">
              {calendarCells.length ? (
                calendarCells.map((cell) => (
                  <div
                    key={cell.id}
                    className="visualize-cell"
                    style={{
                      background: `rgba(94, 123, 107, ${0.15 + cell.intensity * 0.55})`,
                    }}
                  >
                    <span>{cell.label}</span>
                    <strong>{cell.value}</strong>
                  </div>
                ))
              ) : (
                <p className="empty-state">Nincs kalendáriumi adat.</p>
              )}
            </div>

            <div className="visualize-main">
              <div>
                <p>Összes foglalás</p>
                <strong>{totalBookings}</strong>
              </div>
              <div>
                <p>Átlag / nap</p>
                <strong>{averagePerDay}</strong>
              </div>
              <div>
                <p>Bevétel</p>
                <strong>{formatCurrency(totalRevenue)}</strong>
              </div>
              <span className={`visualize-delta ${deltaClass}`}>{deltaLabel}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {hasMounted && createPortal(queueOverlay, document.body)}
    </>
  );
};

export default VisualizeBookingCard;
