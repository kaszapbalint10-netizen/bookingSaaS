import React from 'react';
import OpeningHoursCalendar from './OpeningHoursCalendar';
import './OpeningHoursModal.css';

/**
 * Teljesen különálló nyitvatartás overlay (fresh start, új név és saját CSS).
 *
 * Props:
 * - open: boolean - megjelenjen-e
 * - onClose: fn - bezárás callback
 * - title: string - címsor (alapértelmezett: "Nyitvatartás")
 * - subtitle: string - kiegészítő (alap: "Heti nézet")
 * - openingHours: array - átadott adatok az OpeningHoursCalendar-nak
 */
const OpeningHoursModal = ({
  open = false,
  onClose = () => {},
  title = 'Nyitvatartás',
  subtitle = 'Heti nézet',
  openingHours = [],
}) => {
  if (!open) return null;

  return (
    <div className="oh-modal-backdrop" onClick={onClose}>
      <div className="oh-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="oh-modal-head">
          <div className="oh-head-text">
            <p className="oh-eyebrow">{subtitle}</p>
            <h3 className="oh-title">{title}</h3>
          </div>
          <button type="button" className="oh-close" onClick={onClose}>
            Bezárás
          </button>
        </header>
        <div className="oh-modal-body">
          <OpeningHoursCalendar openingHours={openingHours} />
        </div>
      </div>
    </div>
  );
};

export default OpeningHoursModal;
