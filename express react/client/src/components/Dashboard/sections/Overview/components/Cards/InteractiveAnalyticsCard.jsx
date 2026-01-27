import React, { useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { formatCurrency } from '../../../../utils/formatters';

const InteractiveAnalyticsCard = ({ data = [] }) => {
  const pivotX = useMotionValue(0);
  const pivotY = useMotionValue(0);
  const rotateX = useTransform(pivotY, [-50, 50], [10, -10]);
  const rotateY = useTransform(pivotX, [-50, 50], [-10, 10]);

  const services = useMemo(() => {
    const parsed = (Array.isArray(data) ? data : []).map((item) => ({
      name: item.name || 'Ismeretlen',
      bookings: Number(item.value) || 0,
      revenue: Number(item.revenue) || 0,
    }));
    return parsed.sort((a, b) => b.bookings - a.bookings).slice(0, 4);
  }, [data]);

  const totals = services.reduce(
    (acc, curr) => ({
      bookings: acc.bookings + curr.bookings,
      revenue: acc.revenue + curr.revenue,
    }),
    { bookings: 0, revenue: 0 }
  );

  const maxBookings = services.length ? Math.max(...services.map((item) => item.bookings), 1) : 1;

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pivotX.set(((x - rect.width / 2) / rect.width) * 100);
    pivotY.set(((y - rect.height / 2) / rect.height) * 100);
  };

  const resetTilt = () => {
    pivotX.set(0);
    pivotY.set(0);
  };

  return (
    <motion.div
      className="interactive-analytics-card"
      style={{ rotateX, rotateY }}
      onMouseMove={handleMove}
      onMouseLeave={resetTilt}
    >
      <div className="iac-grid">
        <div className="iac-bars">
          {services.map((item, index) => (
            <div key={item.name} className="iac-bar">
              <span className="iac-bar-value">{item.bookings}</span>
              <div
                className="iac-bar-fill"
                style={{
                  height: `${(item.bookings / maxBookings) * 100}%`,
                  background: `linear-gradient(180deg, rgba(94,123,107,0.8), rgba(94,123,107,0.2))`,
                }}
              />
              <span className="iac-bar-label">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="iac-metrics">
          <div>
            <p>Foglalások</p>
            <strong>{totals.bookings}</strong>
          </div>
          <div>
            <p>Bevétel</p>
            <strong>{formatCurrency(totals.revenue)}</strong>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InteractiveAnalyticsCard;
