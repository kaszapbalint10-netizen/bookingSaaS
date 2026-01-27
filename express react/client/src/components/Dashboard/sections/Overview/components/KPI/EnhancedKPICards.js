// sections/Overview/components/KPI/EnhancedKPICards.js
import React from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import '../../styles/KPI.css'; // IMPORTÁLD AZ ÚJ CSS-T

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-text">{`Érték: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// --- STAT CARD COMPONENT ---
function StatCard({ title, value, change, changeType, icon, chartData, chartColor }) {
  return (
    <div
      className="stat-card"
      data-type={title.toLowerCase().replace(' ', '-')}
    >
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-content">
        <div className="stat-values">
          <p className="stat-value">{value}</p>
          <p className={`stat-change ${changeType}`}>
            {change}
          </p>
        </div>
        <div className="stat-chart">
          <ResponsiveContainer width="100%" height={48}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`colorUv-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'rgba(255,255,255,0.1)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                fillOpacity={1}
                fill={`url(#colorUv-${title})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const EnhancedKPICards = ({ stats, chartData }) => {
  // Calculate additional metrics from chart data
  const currentRevenue = chartData.revenue?.week?.[chartData.revenue.week.length - 1]?.revenue || 0;
  const previousRevenue = chartData.revenue?.week?.[chartData.revenue.week.length - 2]?.revenue || 0;
  const revenueChange = previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
  
  const totalServicesRevenue = chartData.services?.reduce((sum, service) => sum + service.revenue, 0) || 0;
  const avgAppointmentValue = stats.totalCustomers ? totalServicesRevenue / stats.totalCustomers : 0;

  // Generate chart data for each KPI
  const generateChartData = (baseValue, variation = 0.2) => {
    return Array.from({ length: 7 }, (_, i) => ({
      name: `Day ${i + 1}`,
      value: Math.round(baseValue * (1 + (Math.random() - 0.5) * variation))
    }));
  };

  const kpis = [
    {
      title: "Jelenlegi Bevétel",
      value: `$${Math.round(currentRevenue).toLocaleString()}`,
      change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
      changeType: revenueChange >= 0 ? 'positive' : 'negative',
      icon: "💳",
      chartData: generateChartData(currentRevenue / 7),
      chartColor: '#4ade80'
    },
    {
      title: "Aktív Foglalások",
      value: stats.todayBookings || 0,
      change: "+0%",
      changeType: "neutral",
      icon: "📆",
      chartData: generateChartData(stats.todayBookings || 5),
      chartColor: '#60a5fa'
    },
    {
      title: "Vendégek",
      value: stats.totalCustomers || 0,
      change: "+0%",
      changeType: "neutral",
      icon: "🧑‍🤝‍🧑",
      chartData: generateChartData((stats.totalCustomers || 10) / 7),
      chartColor: '#c084fc'
    },
    {
      title: "Átlag Érték",
      value: `$${Math.round(avgAppointmentValue)}`,
      change: "+0%",
      changeType: "neutral",
      icon: "💰",
      chartData: generateChartData(avgAppointmentValue),
      chartColor: '#f59e0b'
    }
  ];

  return (
    <div className="kpis-grid-enhanced">
      {kpis.map((kpi, index) => (
        <StatCard
          key={index}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          changeType={kpi.changeType}
          icon={kpi.icon}
          chartData={kpi.chartData}
          chartColor={kpi.chColor}
        />
      ))}
    </div>
  );
};

export default EnhancedKPICards;
