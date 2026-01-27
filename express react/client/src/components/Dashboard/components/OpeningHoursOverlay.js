import React from 'react';
import OpeningHoursCalendar from './OpeningHoursCalendar';

/**
 * Általános overlay-kártya, amely az OpeningHoursCalendar-t jeleníti meg.
 * Használat:
 * <OpeningHoursOverlay
 *   openingHours={data}
 *   onClose={() => setOpen(false)}
 *   title="Nyitvatartás"
 *   eyebrow="Részletes nézet"
 * />
 */
const OpeningHoursOverlay = ({
  openingHours = [],
  onClose = () => {},
  title = 'Nyitvatartás',
  eyebrow = 'Részletes nézet',
}) => {
  return (
    <div className="panel-overlay visible" onClick={onClose}>
      <div className="overlay-card" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-head">
          <div>
            <p className="overlay-eyebrow">{eyebrow}</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="overlay-close" onClick={onClose}>
            Bezárás
          </button>
        </div>
        <div className="overlay-body">
          <OpeningHoursCalendar openingHours={openingHours} />
        </div>
      </div>
    </div>
  );
};

export default OpeningHoursOverlay;
