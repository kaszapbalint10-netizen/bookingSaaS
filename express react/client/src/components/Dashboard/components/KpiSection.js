import React from 'react';

const glassCard =
  'rounded-2xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.35)] p-4 sm:p-6 transition duration-300 hover:translate-y-[-2px] hover:shadow-[0_15px_70px_rgba(0,0,0,0.35)]';

const KPI = ({ label, value, hint }) => (
  <div className={glassCard}>
    <div className="text-xs uppercase tracking-wide text-white/70 mb-2">{label}</div>
    <div className="text-2xl font-semibold text-white">{value}</div>
    {hint && <div className="text-xs text-white/60 mt-2">{hint}</div>}
  </div>
);

const KpiSection = ({ stats = {} }) => {
  const kpiData = [
    {
      label: 'Napi látogatók',
      value: stats.dailyVisitors ?? 0,
      hint: 'Utolsó 24 óra',
    },
    {
      label: 'Foglalások',
      value: stats.todayBookings ?? 0,
      hint: 'Mai nap',
    },
    {
      label: 'Konverzió',
      value: stats.conversionRate ? `${stats.conversionRate}%` : '—',
      hint: 'Heti átlag',
    },
    {
      label: 'Árbevétel',
      value: stats.weeklyRevenue ? `${stats.weeklyRevenue} Ft` : '0 Ft',
      hint: 'Heti',
    },
  ];

  return (
    <section id="overview" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">Fő mutatók</p>
          <h2 className="text-2xl font-semibold text-white">KPI</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiData.map((item) => (
          <KPI key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
};

export default KpiSection;
