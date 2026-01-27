import React, { useMemo } from 'react';
import { PieChart, PieArcSeries, PieArc } from 'reaviz';

const palette = ['#76E4C5', '#5CA0D3', '#C79BFF', '#F8B26A', '#F56C91', '#A2B86C', '#7DD3FC', '#9AA5B1'];
const PREFERRED_SERVICES = [
  'Színfrissítés',
  'Prémium hajvágás',
  'ASD',
  'Expressz styling',
  'Férfi fodrászat',
  'Női fodrászat',
  'Gyermek fodrászat',
  'Hajvágás',
];
const preferredIndex = PREFERRED_SERVICES.reduce((acc, label, index) => {
  acc[label] = index;
  return acc;
}, {});

const ServiceDonutOverlay = ({ data = [] }) => {
  const services = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const normalized = data
      .map((item, index) => {
        const label = item?.name || item?.service || `Szolgáltatás ${index + 1}`;
        return {
          key: label,
          label,
          data: Number(item?.value ?? item?.data ?? 0),
        };
      })
      .filter((item) => item.data > 0);

    const prioritized = PREFERRED_SERVICES.map((label, idx) => {
      const match = normalized.find((item) => item.label === label);
      if (!match) return null;
      return {
        ...match,
        color: palette[idx % palette.length],
        order: idx,
      };
    }).filter(Boolean);

    if (prioritized.length) {
      return prioritized;
    }

    return normalized
      .map((item, idx) => ({
        ...item,
        color: palette[idx % palette.length],
        order: preferredIndex[item.label] ?? idx,
      }))
      .sort((a, b) => a.order - b.order);
  }, [data]);

  const chartSize = useMemo(() => {
    if (typeof window === 'undefined') {
      return 640;
    }
    const { innerWidth } = window;
    if (innerWidth < 900) {
      return Math.max(360, innerWidth - 80);
    }
    const viewportShare = innerWidth * 0.48;
    return Math.max(600, Math.min(780, viewportShare));
  }, []);

  if (!services.length) {
    return <p className="empty-state">Nincs adat a megjelenítéshez.</p>;
  }

  return (
    <div className="donut-overlay">
      <div className="donut-chart" aria-hidden={!services.length}>
        <PieChart
          width={chartSize}
          height={chartSize}
          data={services}
          series={
            <PieArcSeries
              doughnut
              padAngle={0.02}
              arc={<PieArc cornerRadius={10} padAngle={0.01} />}
              colorScheme={services.map((item) => item.color)}
            />
          }
        />
      </div>

      <div className="donut-details">
        <div className="donut-list">
          {services.map((item) => (
            <div key={item.key} className="donut-row">
              <div className="dot" style={{ background: item.color }} />
              <div className="donut-copy">
                <strong>{item.key}</strong>
                <span>{item.data} foglalás</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceDonutOverlay;
