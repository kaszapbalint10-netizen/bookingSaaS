// sections/Overview/components/Charts/RevenueLineChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../utils/chartConfigs';

const RevenueLineChart = ({ data, timeRange, isExpanded }) => {
  const formatXAxis = (tickItem) => {
    if (timeRange === 'year') {
      const date = new Date(tickItem);
      return date.toLocaleDateString('hu-HU', { month: 'short' });
    }
    return tickItem.split('-').slice(1).join('-');
  };

  const formatTooltip = (value, name) => {
    switch (name) {
      case 'revenue':
        return [`$${value.toLocaleString()}`, 'Bevétel'];
      case 'appointments':
        return [value, 'Foglalások'];
      case 'utilization':
        return [`${value}%`, 'Kihasználtság'];
      default:
        return [value, name];
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">
          Bevétel Trend - {timeRange === 'week' ? 'Heti' : timeRange === 'month' ? 'Havi' : 'Éves'}
        </h3>
      </div>

      <div className={`chart-wrapper ${isExpanded ? 'expanded' : 'compact'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={12}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={CHART_COLORS.revenue}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.revenue, strokeWidth: 2 }}
              name="Bevétel"
            />
            <Line
              type="monotone"
              dataKey="appointments"
              stroke={CHART_COLORS.appointments}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.appointments, strokeWidth: 2 }}
              name="Foglalások"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueLineChart;
