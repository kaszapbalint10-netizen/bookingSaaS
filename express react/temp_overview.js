// sections/Overview/index.js
import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  DollarSign,
  Download,
  Maximize2,
  Scissors,
  Users,
} from 'lucide-react';
import RevenueLineChart from './components/Charts/RevenueLineChart';
import HorizontalServiceChart from './components/Charts/HorizontalServiceChart';
import PricingCalendar from './components/Charts/PricingCalendar';
import InteractiveAnalyticsCard from './components/Cards/InteractiveAnalyticsCard';
import VisualizeBookingCard from './components/Cards/VisualizeBookingCard';
import ServiceDonutOverlay from './components/Charts/ServiceDonutOverlay';
import OpeningHoursCalendar from '../../components/OpeningHoursCalendar';
import { useChartData } from './hooks/useChartData';
import { formatCurrency } from '../../utils/formatters';
import { LineChart, Line, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend, XAxis, YAxis, Label } from 'recharts';
import './styles/overview.css';

const RANGE_OPTIONS = [
  { value: 'week', label: 'Heti' },
  { value: 'month', label: 'Havi' },
  { value: 'year', label: 'Eves' },
];

const Overview = ({
  stats = {},
  appointments = [],
  services = [],
  user,
  backgroundChoice = 'blob',
}) => {
  const [timeRange, setTimeRange] = useState('week');
  const [expandedPanel, setExpandedPanel] = useState(null);
  const { chartData, isLoading } = useChartData();

  const safeServices = Array.isArray(chartData?.services) ? chartData.services : [];
  const safeRevenue = chartData?.revenue?.[timeRange] || [];
  const safeCalendar = chartData?.calendar || [];
  const productivity = Array.isArray(chartData?.productivity) ? chartData.productivity : safeCalendar;
  const fallbackSpark = [{ name: 'A', uv: 0 }, { name: 'B', uv: 1 }];

  const displayName = user ? `${user.first_name} ${user.last_name}` : 'Vendeg';

  const rangeLabel = timeRange === 'week' ? 'Heti' : timeRange === 'month' ? 'Havi' : 'Éves';

  const rangeSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    if (timeRange === 'week') {
      const offset = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - offset);
    } else if (timeRange === 'month') {
      start.setDate(1);
    } else {
      start.setMonth(0, 1);
    }
    return productivity
      .map((item) => {
        const d = new Date(item.date);
        d.setHours(0, 0, 0, 0);
        if (Number.isNaN(d.getTime()) || d < start || d > today) return null;
        return {
          date: d.toISOString().split('T')[0],
          revenue: Number(item.revenue ?? item.amount ?? 0),
          bookings: Number(item.appointments ?? item.bookings ?? 0),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [productivity, timeRange]);

  const revenueTotal = rangeSeries.reduce((sum, r) => sum + r.revenue, 0);
  const bookingsTotal = rangeSeries.reduce((sum, r) => sum + r.bookings, 0);

  const kpiCards = useMemo(() => {
    const deltas = {
      revenue: Number(stats.monthlyRevenueDelta ?? stats.revenueDelta ?? stats.revenueChange ?? 0),
      customers: Number(stats.customerDelta ?? stats.customerChange ?? stats.customersDelta ?? 0),
      avgTime: Number(stats.avgServiceTimeDelta ?? stats.avgTimeDelta ?? 0),
      services: Number(stats.servicesDelta ?? stats.servicesChange ?? 0),
    };

    return [
      {
        label: `${rangeLabel} bevetel`,
        value: formatCurrency(revenueTotal),
        change: bookingsTotal ? `${bookingsTotal} foglalas a periodusban` : 'Nincs foglalas',
        delta: deltas.revenue,
        icon: DollarSign,
      },
      {
        label: 'Aktiv vendegek',
        value: stats.totalCustomers ?? 0,
        change: stats.servicesCount ? `${stats.servicesCount} szolgaltatas` : 'Nincs adat',
        delta: deltas.customers,
        icon: Users,
      },
      {
        label: 'Atlag ido',
        value: stats.avgServiceTime ? `${stats.avgServiceTime} perc` : '--',
        change: stats.isOpenToday ? 'Ma nyitva' : 'Ma zarva',
        delta: deltas.avgTime,
        icon: CalendarClock,
      },
      {
        label: 'Top szolgaltatas',
        value: services[0]?.service ?? 'Nincs adat',
        change: services.length ? `${services.length} aktiv` : 'Adj hozza szolgaltatast',
        delta: deltas.services,
        icon: Scissors,
      },
    ];
  }, [services, stats]);

  const highlightStats = useMemo(() => ([
    {
      id: 'today',
      label: 'Mai foglalasok',
      value: stats.todayBookings ?? 0,
      meta: 'Eloben fut',
    },
    {
      id: 'week',
      label: 'Heti bevetel',
      value: stats.weeklyRevenue ? formatCurrency(stats.weeklyRevenue) : '0 Ft',
      meta: 'Penzugy',
    },
    {
      id: 'clients',
      label: 'Aktiv vendegek',
      value: stats.totalCustomers ?? 0,
      meta: 'CRM',
    },
  ]), [stats]);

  const statCards = useMemo(() => {
    const revenueTrend = rangeSeries.length ? rangeSeries : fallbackSpark;
    const servicesTrend = safeServices.map((s, i) => ({ name: s.name || `S${i + 1}`, uv: s.value || s.revenue || 0 }));
    const appsTrend = rangeSeries.length
      ? rangeSeries.map((d) => ({ name: d.date, uv: d.bookings }))
      : fallbackSpark;
    const avgValue = stats.avgServiceTime ? [{ name: 'avg', uv: stats.avgServiceTime }] : fallbackSpark;
    return [
      {
        title: `${rangeLabel} bevetel`,
        value: formatCurrency(revenueTotal),
        change: `${stats.monthlyRevenueDelta ?? 0}% vs elozo honap`,
        changeType: Number(stats.monthlyRevenueDelta) >= 0 ? 'positive' : 'negative',
        chartData: revenueTrend,
      },
      {
        title: 'Szolgaltatasok',
        value: services.length,
        change: `${stats.servicesDelta ?? 0}% mozgasa`,
        changeType: Number(stats.servicesDelta) >= 0 ? 'positive' : 'negative',
        chartData: servicesTrend.length ? servicesTrend : fallbackSpark,
      },
      {
        title: `${rangeLabel} foglalas`,
        value: bookingsTotal,
        change: `${bookingsTotal} a periodusban`,
        changeType: 'positive',
        chartData: appsTrend.length ? appsTrend : fallbackSpark,
      },
      {
        title: 'Atlag ido',
        value: stats.avgServiceTime ? `${stats.avgServiceTime} perc` : '--',
        change: `${stats.avgServiceTimeDelta ?? 0}% valtozas`,
        changeType: Number(stats.avgServiceTimeDelta) >= 0 ? 'positive' : 'negative',
        chartData: avgValue,
      },
    ];
  }, [bookingsTotal, fallbackSpark, rangeLabel, rangeSeries, revenueTotal, safeServices, services.length, stats.avgServiceTime, stats.avgServiceTimeDelta, stats.monthlyRevenueDelta, stats.servicesDelta]);

  const heroMultiSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = (() => {
      const d = new Date(today);
      if (timeRange === 'week') {
        const offset = (d.getDay() + 6) % 7; // Monday = 0
        d.setDate(d.getDate() - offset);
      } else if (timeRange === 'month') {
        d.setDate(1);
      } else {
        d.setMonth(0, 1); // Jan 1
      }
      return d;
    })();

    const formatLabel = (val, idx) => {
      const d = val ? new Date(val) : null;
      if (d && !Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
      return `T${idx + 1}`;
    };

    const mapped = new Map();
    productivity.forEach((item) => {
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return;
      d.setHours(0, 0, 0, 0);
      if (d < startDate || d > today) return;
      const key = d.toISOString().split('T')[0];
      mapped.set(key, { ...item, _dateObj: d });
    });

    const avgServiceTime = Number(stats.avgServiceTime) || 45; // perc

    // Yearly: töltsük fel minden napot startDate-tõl ma-ig 0-val, ha nincs adat
    if (timeRange === 'year') {
      const filled = [];
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        const item = mapped.get(key);
        const revenue = Number(item?.revenue ?? 0);
        const bookings = Number(item?.appointments ?? item?.bookings ?? item?.count ?? 0);
        const durationMinutes = Number(item?.durationMinutes ?? 0);
        const workedMinutes = durationMinutes > 0 ? durationMinutes : bookings * avgServiceTime;
        const workedHours = workedMinutes / 60;
        const revenuePerHour = workedHours > 0 ? revenue / workedHours : 0;
        const label = formatLabel(key, filled.length);
        filled.push({
          name: label,
          label,
          rev: revenue,
          worked: workedHours,
          revPerHour: revenuePerHour,
        });
      }
      return filled;
    }

    // Week / month: csak a meglévõ napok a tartományban, fallback egy üres napra, ha nincs adat
    const filtered = Array.from(mapped.values()).sort((a, b) => a._dateObj - b._dateObj);
    const series = filtered.length
      ? filtered
      : [
          {
            date: today.toISOString().split('T')[0],
            revenue: 0,
            appointments: 0,
            durationMinutes: 0,
            _dateObj: today,
          },
        ];

    return series.map((item, i) => {
      const revenue = Number(item.revenue ?? item.value ?? item.amount ?? 0);
      const bookings = Number(item.appointments ?? item.bookings ?? item.count ?? 0);
      const durationMinutes = Number(item.durationMinutes ?? 0);
      const workedMinutes = durationMinutes > 0 ? durationMinutes : bookings * avgServiceTime;
      const workedHours = workedMinutes / 60;
      const revenuePerHour = workedHours > 0 ? revenue / workedHours : 0;
      const label = formatLabel(item.date || item.label || item.name, i);
      return {
        name: label,
        label,
        rev: revenue,
        worked: workedHours,
        revPerHour: revenuePerHour,
      };
    });
  }, [productivity, timeRange, stats.avgServiceTime]);

  const serviceRings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = (() => {
      const d = new Date(today);
      if (timeRange === 'week') {
        const offset = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - offset);
      } else if (timeRange === 'month') {
        d.setDate(1);
      } else {
        d.setMonth(0, 1);
      }
      return d;
    })();

    const clamp = (val) => Math.max(0, Math.min(100, Number.isFinite(val) ? val : 0));
    const fallbackDuration = Number(stats.avgServiceTime) || 45;
    let totalRevenue = 0;
    let totalPotentialRevenue = 0;
    let workedMinutes = 0;
    let capacityMinutes = 0;
    let completionSum = 0;
    let completionCount = 0;

    productivity.forEach((item) => {
      const d = new Date(item.date);
      if (Number.isNaN(d.getTime())) return;
      d.setHours(0, 0, 0, 0);
      if (d < startDate || d > today) return;

      const revenue = Number(item.revenue ?? 0);
      const revenueCeiling = Number(item.revenueCeiling ?? 0);
      const durationMinutes = Number(item.durationMinutes ?? 0);
      const apps = Number(item.appointments ?? item.bookings ?? 0);
      const worked = durationMinutes > 0 ? durationMinutes : apps * fallbackDuration;
      const capacity = Number(item.capacityMinutes ?? 0);

      totalRevenue += revenue;
      totalPotentialRevenue += revenueCeiling;
      workedMinutes += worked;
      capacityMinutes += capacity;
      if (typeof item.completion === 'number') {
        completionSum += Number(item.completion);
        completionCount += 1;
      }
    });

    const revenuePct =
      totalPotentialRevenue > 0 ? (totalRevenue / totalPotentialRevenue) * 100 : 0;
    const workedHours = workedMinutes / 60;
    const capacityHours = capacityMinutes / 60;
    const actualRph = workedHours > 0 ? totalRevenue / workedHours : 0;
    const potentialRph =
      capacityHours > 0 && totalPotentialRevenue > 0
        ? totalPotentialRevenue / capacityHours
        : 0;
    const rphPct = potentialRph > 0 ? (actualRph / potentialRph) * 100 : 0;

    const completionPct =
      completionCount > 0
        ? completionSum / completionCount
        : capacityMinutes > 0
          ? (workedMinutes / capacityMinutes) * 100
          : 0;

    return [
      { id: 'rev', label: 'Bevetel a plafonhoz', pct: clamp(revenuePct), color: '#4ade80' },
      { id: 'rph', label: 'Bevetel/ora', pct: clamp(rphPct), color: '#38bdf8' },
      { id: 'prod', label: 'Produktivitas', pct: clamp(completionPct), color: '#a78bfa' },
    ];
  }, [productivity, timeRange, stats.avgServiceTime]);

  const appointmentPreview = expandedPanel === 'appointments' ? 8 : 4;
  const appointmentList = appointments.slice(0, appointmentPreview);

  const notificationFeed = appointmentList.length
    ? appointmentList.map((appointment, index) => ({
        id: `${appointment.service}-${appointment.time}-${index}`,
        title: appointment.service,
        time: appointment.time,
        meta: appointment.duration,
      }))
    : [
        {
          id: 'idle-1',
          title: 'Terv szerint halad',
          time: 'Nincs aktualis vendeg',
          meta: 'Varakozik',
        },
      ];

  const overlayTitleMap = {
    revenue: 'Bevetel reszletes nezet',
    appointments: 'Idopont reszletek',
    services: 'Szolgaltatas analitika',
    openingHours: 'Nyitvatartas',
    calendar: 'Arkepzesi naptar',
  };

  const overlayContent = {
    revenue: (
      <RevenueLineChart
        data={safeRevenue}
        timeRange={timeRange}
        isExpanded
      />
    ),
    appointments: (
      <div className="overlay-list">
        {appointmentList.length ? (
          appointmentList.map((appointment, index) => (
            <div key={`${appointment.time}-${index}`} className="overlay-list-row">
              <div>
                <p className="overlay-list-title">{appointment.service}</p>
                <span className="overlay-list-meta">{appointment.duration}</span>
              </div>
              <span className="overlay-list-time">{appointment.time}</span>
            </div>
          ))
        ) : (
          <p className="empty-state">Nincs idopont</p>
        )}
      </div>
    ),
    services: (
      <div className="expanded-bar-wrapper">
        <ServiceDonutOverlay data={safeServices} />
      </div>
    ),
    openingHours: (
      <div className="card-body hero-lines" style={{ minHeight: 360 }}>
        <OpeningHoursCalendar />
      </div>
    ),
    calendar: (
      <div className="card-body hero-lines" style={{ minHeight: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={heroMultiSeries}
            margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
            className="text-tertiary [&_.recharts-text]:text-xs"
          >
            <defs>
              <linearGradient id="gradientA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a84ff" stopOpacity="0.7" />
                <stop offset="95%" stopColor="#0a84ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-gray-100" />
            <Legend verticalAlign="top" align="right" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value}
              padding={{ left: 10, right: 10 }}
            >
              <Label fill="currentColor" className="!text-xs font-medium" position="bottom">
                Hcnap / Id‹
              </Label>
            </XAxis>
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => Number(value).toLocaleString()}
            >
              <Label
                value="rt‚k"
                fill="currentColor"
                className="!text-xs font-medium"
                style={{ textAnchor: 'middle' }}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            <Tooltip
              contentStyle={{
                background: 'rgba(10,12,20,0.9)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 12,
                padding: 10,
              }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Area
              dataKey="rev"
              name="Bev‚tel"
              type="monotone"
              stroke="#0a84ff"
              fill="url(#gradientA)"
              strokeWidth={2}
              isAnimationActive={false}
              fillOpacity={0.12}
            />
            <Area
              dataKey="bookings"
              name="Foglal s"
              type="monotone"
              stroke="#32d74b"
              fill="none"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              dataKey="servicesLine"
              name="Szolg ltat s"
              type="monotone"
              stroke="#ffd60a"
              fill="none"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ),
  };

  const openPanel = (panel) => setExpandedPanel(panel);
  const closeOverlay = () => setExpandedPanel(null);

  return (
      <section className="overview-hub vision">
        {(!backgroundChoice || backgroundChoice === 'blob') && (
          <div className="liquid-bg">
            <div className="blob blob-big" />
            <div className="blob blob-medium" />
            <div className="blob blob-small-a" />
            <div className="blob blob-small-b" />
          </div>
        )}

      <div className="vision-hero">
        <div className="vision-hero-text">
          <h1>Üdv, {displayName}</h1>
          <p>
            {stats.todayBookings
              ? `Ma ${stats.todayBookings} idopont var teljesitesre.`
              : 'Ma meg nincsenek foglalasok, keszulhetsz a kovetkezo hullamra.'}
          </p>
          <div className="vision-stats-grid">
            {statCards.map((card) => (
              <div key={card.title} className={`vision-stat-card ${card.changeType}`}>
                <div className="stat-card-head">
                  <span className="stat-title">{card.title}</span>
                  <span className="stat-change">{card.change}</span>
                </div>
                <div className="stat-card-main">
                  <strong className="stat-value">{card.value}</strong>
                  <div className="stat-chart">
                    <ResponsiveContainer width="100%" height={48}>
                      <LineChart data={card.chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(10,12,20,0.85)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 8,
                            color: '#fff',
                            fontSize: 12,
                            padding: 8,
                          }}
                          cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="uv"
                          stroke={card.changeType === 'positive' ? '#4ade80' : '#f87171'}
                          strokeWidth={2}
                          dot={false}
                          fillOpacity={0.4}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="vision-hero-actions">
          <div
            className="range-switch"
            style={{
              '--active-idx': RANGE_OPTIONS.findIndex((o) => o.value === timeRange),
              '--btn-count': RANGE_OPTIONS.length,
            }}
          >
            <span className="range-indicator" aria-hidden="true" />
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`range-btn ${timeRange === option.value ? 'is-active' : ''}`}
                onClick={() => setTimeRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button type="button" className="hero-btn primary">
            <Download size={16} />
            Riport letoltese
          </button>
          {isLoading && <span className="loading-chip">Frissites...</span>}
        </div>
      </div>      <section className="vision-grid">
        <article className="vision-card hero" onClick={() => openPanel('openingHours')}>
          <div className="card-body calendar">
            <PricingCalendar data={safeCalendar} isExpanded={false} isDarkMode={false} />
          </div>
        </article>

        {/* Line chart card -> Árképezési naptár panel */}
        <article className="vision-card calendar" onClick={() => openPanel('calendar')}>
          <div className="card-body hero-lines" style={{ minHeight: 240 }}>
            <div className="hero-chart" style={{ minHeight: 220 }}>
              <ResponsiveContainer width="100%" height={390}>
                  <LineChart data={heroMultiSeries} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v}
                      interval="preserveStartEnd"
                      minTickGap={12}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10,12,20,0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 12,
                        padding: 8,
                      }}
                      cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '3 3' }}
                      formatter={(value, name) => [Number(value ?? 0).toFixed(2), name]}
                      labelFormatter={(label) => `Dátum: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="rev"
                      stroke="#4ade80"
                    strokeWidth={2.4}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="worked"
                    name="Ledolgozott óra"
                    stroke="#60a5fa"
                    strokeWidth={2.1}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="revPerHour"
                    name="Bevétel/óra"
                    stroke="#a78bfa"
                    strokeWidth={2.1}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>

<article className="vision-card services" onClick={() => openPanel('services')}>
          <HorizontalServiceChart data={safeServices} compact ringsData={serviceRings} />
        </article>

        <article className="vision-card analytics" onClick={() => openPanel('services')}>
          <div className="card-body">
            <InteractiveAnalyticsCard data={safeServices} />
          </div>
        </article>

        <article className="vision-card notifications">
          <div className="card-top">
            <div>
              <p className="card-label">Workflow feed</p>
              <h3>Ertesitesek</h3>
            </div>
          </div>
          <div className="card-body notifications-list">
            {notificationFeed.map((item) => (
              <div key={item.id} className="notification-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {expandedPanel && (
        <div
          className={`panel-overlay visible ${expandedPanel === 'openingHours' ? 'opening-hours-overlay' : ''}`}
          onClick={closeOverlay}
        >
          <div
            className={`overlay-card ${expandedPanel === 'openingHours' ? 'opening-hours-card' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overlay-head">
              <div>
              </div>
            </div>
            <div className="overlay-body">{overlayContent[expandedPanel]}</div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Overview;










