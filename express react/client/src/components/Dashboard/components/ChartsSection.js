import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart as RadarChartCore,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts';

const card =
  'rounded-2xl border border-white/5 bg-white/8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.28)] p-4 sm:p-5';

const COLORS = ['#9bcef7', '#7dd3fc', '#c084fc', '#fca5a5', '#a5b4fc'];

const ChartsSection = ({
  stats = {},
  services = [],
  appointments = [],
}) => {
  // Sample / derived data
  const donutData = [
    { name: 'Heti foglalás', value: stats.todayBookings || 12 },
    { name: 'Új vendég', value: stats.totalCustomers || 6 },
    { name: 'Visszatérő', value: stats.returning || 8 },
  ];

  const lineData = (stats.weeklyTrend || [
    { name: 'H', value: 12 },
    { name: 'K', value: 18 },
    { name: 'Sze', value: 9 },
    { name: 'Cs', value: 14 },
    { name: 'P', value: 20 },
    { name: 'Szo', value: 11 },
    { name: 'V', value: 6 },
  ]);

  const activityData = (appointments || []).slice(0, 7).map((a, idx) => ({
    name: a.date || `Nap ${idx + 1}`,
    value: a.duration || 30,
  })) || [
    { name: 'H', value: 30 },
    { name: 'K', value: 25 },
    { name: 'Sze', value: 40 },
  ];

  const radarData = (services || []).slice(0, 5).map((s) => ({
    subject: s.name,
    A: s.duration || 30,
    fullMark: 90,
  })) || [
    { subject: 'Vágás', A: 45, fullMark: 90 },
    { subject: 'Festés', A: 75, fullMark: 90 },
    { subject: 'Styling', A: 55, fullMark: 90 },
  ];

  const animatedData = [
    { name: 'Bevétel', value: stats.weeklyRevenue || 120000 },
    { name: 'Foglalások', value: stats.todayBookings || 18 },
  ];

  return (
    <section id="analytics" className="space-y-4">
      <div>
        <p className="text-sm text-white/70">Analitika</p>
        <h2 className="text-2xl font-semibold text-white">Chartok</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <div className="text-sm text-white/70 mb-2">Megoszlás</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1f2937' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <div className="text-sm text-white/70 mb-2">Foglalás trend</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1f2937' }} />
                <Line type="monotone" dataKey="value" stroke="#9bcef7" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <div className="text-sm text-white/70 mb-2">Napi aktivitás (perc)</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1f2937' }} />
                <Bar dataKey="value" fill="#7dd3fc" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <div className="text-sm text-white/70 mb-2">Szolgáltatás fókusz</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChartCore cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                <PolarRadiusAxis stroke="#9ca3af" />
                <Radar name="Időtartam" dataKey="A" stroke="#c084fc" fill="#c084fc" fillOpacity={0.4} />
              </RadarChartCore>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <div className="text-sm text-white/70 mb-2">Bevétel mozgás</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={animatedData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7dd3fc" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#7dd3fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1f2937' }} />
                <Area type="monotone" dataKey="value" stroke="#7dd3fc" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartsSection;
