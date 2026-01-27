// sections/Overview/utils/exportUtils.js
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatChartDataForExport = (data, chartType) => {
  switch (chartType) {
    case 'revenue':
      return data.map(item => ({
        Dátum: item.date,
        Bevétel: item.revenue,
        Foglalások: item.appointments,
        Kihasználtság: `${item.utilization}%`
      }));
    
    case 'services':
      return data.map(item => ({
        Szolgáltatás: item.name,
        'Eloszlás (%)': item.value,
        'Bevétel (HUF)': item.revenue
      }));
    
    case 'calendar':
      return data.map(item => ({
        Dátum: item.date,
        Bevétel: item.revenue,
        Foglalások: item.appointments,
        Állapot: item.isClosed ? 'Zárva' : 'Nyitva'
      }));
    
    default:
      return data;
  }
};