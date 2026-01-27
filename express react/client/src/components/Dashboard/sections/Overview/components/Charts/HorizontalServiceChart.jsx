import React, { useMemo } from 'react';
import {
  BarChart,
  LinearYAxis,
  LinearYAxisTickSeries,
  LinearYAxisTickLabel,
  LinearXAxis,
  LinearXAxisTickSeries,
  BarSeries,
  Bar,
  GridlineSeries,
  Gridline,
} from 'reaviz';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../../../utils/formatters';

const chartColors = ['#9152EE', '#40D3F4', '#40E5D1', '#4C86FF', '#F28AD9', '#FFE08A'];

const formatNumber = (value = 0) => new Intl.NumberFormat('hu-HU').format(value);

const normalizeData = (services = []) =>
  (Array.isArray(services) ? services : [])
    .map((item) => ({
      key: item.name || 'Ismeretlen',
      data: Number(item.value) || 0,
      revenue: Number(item.revenue) || 0,
    }))
    .filter((item) => item.data > 0 || item.revenue > 0)
    .sort((a, b) => b.data - a.data)
    .slice(0, 6);

const metricSvgs = [
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M9.92844 1.25411C9.32947 1.25895 8.73263 1.49041 8.28293 1.94747L1.92062 8.41475C1.02123 9.32885 1.03336 10.8178 1.94748 11.7172L8.41476 18.0795C9.32886 18.9789 10.8178 18.9667 11.7172 18.0526L18.0795 11.5861C18.0803 11.5853 18.081 11.5846 18.0816 11.5839C18.979 10.6708 18.9667 9.18232 18.0526 8.28291L11.5853 1.92061C11.1283 1.47091 10.5274 1.24926 9.92844 1.25411Z"
        stroke="#E84045"
        strokeWidth="1.2"
      />
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.66663C5.40511 1.66663 1.66675 5.40499 1.66675 9.99996C1.66675 14.5949 5.40511 18.3333 10 18.3333C14.595 18.3333 18.3334 14.5949 18.3334 9.99996C18.3334 5.40499 14.595 1.66663 10 1.66663Z"
        stroke="#E84045"
        strokeWidth="1.2"
      />
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.10535C9.35241 2.10535 8.70472 2.42118 8.35459 3.05343L1.9044 14.7063C1.22414 15.9354 2.14514 17.5 3.5499 17.5H16.4511C17.8559 17.5 18.7769 15.9354 18.0966 14.7063L11.6456 3.05343C11.2955 2.42118 10.6478 2.10535 10 2.10535Z"
        stroke="#40E5D1"
        strokeWidth="1.2"
      />
    </svg>
  ),
];

const trendSvgs = [
  (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="14" fill="#E84045" fillOpacity="0.4" />
      <path
        d="M9.50134 12.6111L14.0013 8.16663M14.0013 8.16663L18.5013 12.6111M14.0013 8.16663L14.0013 19.8333"
        stroke="#F08083"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="14" fill="#E84045" fillOpacity="0.4" />
      <path
        d="M9.50134 12.6111L14.0013 8.16663M14.0013 8.16663L18.5013 12.6111M14.0013 8.16663L14.0013 19.8333"
        stroke="#F08083"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="14" fill="#40E5D1" fillOpacity="0.4" />
      <path
        d="M18.4987 15.3889L13.9987 19.8334M13.9987 19.8334L9.49866 15.3889M13.9987 19.8334V8.16671"
        stroke="#40E5D1"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  ),
];

const ActivityRings = ({ revenue, bookings, services, ringsData }) => {
  const size = 200;
  const stroke = 16;
  const radius = (size - stroke) / 2;

  const clampPct = (val) => Math.max(0, Math.min(100, Math.round(val)));

  const rings =
    ringsData && ringsData.length
      ? ringsData.map((r) => ({ ...r, pct: clampPct(r.pct) }))
      : [
          { id: 'rev', label: 'Bevétel', pct: clampPct(revenue), color: '#9fb2c8' },
          { id: 'book', label: 'Foglalás', pct: clampPct(bookings), color: '#a9c2b1' },
          { id: 'srv', label: 'Szolg.', pct: clampPct(services), color: '#cabb9a' },
        ];

  return (
    <div className="activity-rings-plain">
      <svg className="ring-svg" viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, idx) => {
          const offset = stroke * 1.6 * idx;
          const ringRadius = radius - offset;
          const ringCirc = 2 * Math.PI * ringRadius;
          const dash = (ring.pct / 100) * ringCirc;
          return (
            <g key={ring.id} transform={`translate(${stroke},${stroke})`}>
              <circle
                cx={radius}
                cy={radius}
                r={ringRadius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={stroke}
              />
              <circle
                cx={radius}
                cy={radius}
                r={ringRadius}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${ringCirc}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${radius} ${radius})`}
              />
            </g>
          );
        })}
      </svg>
      <div className="activity-legend">
        {rings.map((ring) => (
          <div key={ring.id} className="activity-row">
            <span className="dot" style={{ background: ring.color }} />
            <div>
              <p>{ring.label}</p>
              <strong>{ring.pct}%</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HorizontalServiceChart = ({ data = [], compact = false, ringsData }) => {
  const chartData = useMemo(() => normalizeData(data), [data]);
  const totalBookings = useMemo(
    () => chartData.reduce((sum, item) => sum + item.data, 0),
    [chartData]
  );
  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.revenue || 0), 0),
    [chartData]
  );
  const topService = chartData[0];
  const avgTicket = totalBookings ? totalRevenue / totalBookings : 0;
  const chartHeight = Math.max(chartData.length * 34, compact ? 220 : 320);

  // Mock targets for ring percentages
  const revenueTarget = 100000;
  const bookingsTarget = 200;
  const servicesTarget = 6;

  const ringRevenuePct = revenueTarget ? (totalRevenue / revenueTarget) * 100 : 0;
  const ringBookingsPct = bookingsTarget ? (totalBookings / bookingsTarget) * 100 : 0;
  const ringServicesPct = servicesTarget ? (chartData.length / servicesTarget) * 100 : 0;

  if (compact) {
    return (
      <ActivityRings
        revenue={ringRevenuePct}
        bookings={ringBookingsPct}
        services={ringServicesPct}
        ringsData={ringsData}
      />
    );
  }

  if (!chartData.length) {
    return (
      <div className="incident-card empty">
        <p>Nincs eleg adat a szolgaltatas jelentesehez.</p>
      </div>
    );
  }

  const metrics = [
    {
      id: 'top-service',
      label: 'Top szolgaltatas',
      value: topService?.key ?? 'Nincs adat',
      trend: topService ? `${formatNumber(topService.data)} foglalas` : 'Nincs eleg adat',
      iconSvg: metricSvgs[0],
      trendIconSvg: trendSvgs[0],
      delay: 0,
    },
    {
      id: 'total-bookings',
      label: 'Osszes foglalas',
      value: formatNumber(totalBookings),
      trend: 'Utobbi idoszak',
      iconSvg: metricSvgs[1],
      trendIconSvg: trendSvgs[1],
      delay: 0.05,
    },
    {
      id: 'avg-ticket',
      label: 'Atlagjegy',
      value: formatCurrency(avgTicket || 0),
      trend: `Osszes bevetel: ${formatCurrency(totalRevenue)}`,
      iconSvg: metricSvgs[2],
      trendIconSvg: trendSvgs[2],
      delay: 0.1,
    },
  ];

  return (
    <div className={`incident-card ${compact ? 'is-compact' : ''}`}>
      <h3 className="incident-title">Szolgaltatas jelentese</h3>
      <div className="incident-chart">
        <BarChart
          id="horizontal-service-card"
          height={chartHeight}
          data={chartData}
          margins={{ left: 64, right: 16, top: 8, bottom: 8 }}
          yAxis={
            <LinearYAxis
              type="category"
              tickSeries={
                <LinearYAxisTickSeries
                  tick={
                    <LinearYAxisTickLabel
                      format={(text) => (text.length > 8 ? `${text.slice(0, 8)}…` : text)}
                      labelStyle={{ fill: '#9A9AAF', fontSize: compact ? 10 : 12 }}
                    />
                  }
                />
              }
            />
          }
          xAxis={
            <LinearXAxis
              type="value"
              axisLine={null}
              tickSeries={<LinearXAxisTickSeries label={null} line={null} tickSize={10} />}
            />
          }
          series={
            <BarSeries
              layout="horizontal"
              padding={0.2}
              colorScheme={chartColors}
              bar={<Bar glow={{ blur: 20, opacity: 0.5 }} gradient={null} />}
            />
          }
          gridlines={<GridlineSeries line={<Gridline strokeColor="#7E7E8F75" />} />}
        />
      </div>
      <div className="incident-metrics">
        {metrics.map((metric) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: metric.delay }}
            className="incident-metric"
          >
            <div className="incident-metric-left">
              {metric.iconSvg}
              <span className="incident-label">{metric.label}</span>
            </div>
            <div className="incident-metric-right">
              <span className="incident-value">{metric.value}</span>
              <span className="incident-trend">{metric.trend}</span>
              {metric.trendIconSvg}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalServiceChart;
