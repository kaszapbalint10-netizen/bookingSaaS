// sections/Overview/utils/chartConfigs.js
export const generateMockData = () => {
  // Revenue data for different time ranges
  const generateRevenueData = (days, baseValue, variation) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.max(0, baseValue + (Math.random() - 0.5) * variation),
        appointments: Math.floor(Math.random() * 20) + 5,
        utilization: Math.floor(Math.random() * 40) + 60 // 60-100%
      };
    });
  };

  // Services distribution
  const services = [
    { name: 'Férfi hajvágás', value: 35, revenue: 12000 },
    { name: 'Női hajvágás', value: 25, revenue: 18000 },
    { name: 'Festés', value: 15, revenue: 25000 },
    { name: 'Szőkítés', value: 10, revenue: 15000 },
    { name: 'Balayage', value: 8, revenue: 20000 },
    { name: 'Hajápolás', value: 7, revenue: 8000 }
  ];

  // Calendar data for pricing heatmap
  const generateCalendarData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < 180; i++) { // 6 months
      const date = new Date(today);
      date.setDate(date.getDate() - (179 - i));
      
      // Simulate business patterns (weekends higher, some days off)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isClosed = Math.random() < 0.05; // 5% chance closed
      
      let revenue = 0;
      if (!isClosed) {
        revenue = isWeekend 
          ? Math.floor(Math.random() * 80000) + 20000 // 20k-100k weekends
          : Math.floor(Math.random() * 60000) + 10000; // 10k-70k weekdays
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue,
        appointments: isClosed ? 0 : Math.floor(Math.random() * 15) + 3,
        isClosed
      });
    }
    
    return data;
  };

  return {
    revenue: {
      week: generateRevenueData(7, 50000, 30000),
      month: generateRevenueData(30, 45000, 40000),
      year: generateRevenueData(12, 40000, 50000) // Monthly data for year view
    },
    services,
    calendar: generateCalendarData()
  };
};

// Color configurations for charts
export const CHART_COLORS = {
  revenue: 'var(--primary, #5ac8fa)',
  appointments: 'var(--primary-strong, #4fa7d8)',
  utilization: 'var(--primary-soft, #8ed8ff)',
  services: [
    'var(--primary, #5ac8fa)',
    'var(--primary-strong, #4fa7d8)',
    'rgba(90,200,250,0.75)',
    'rgba(90,200,250,0.55)',
    'rgba(90,200,250,0.35)',
    'rgba(90,200,250,0.22)'
  ]
};
