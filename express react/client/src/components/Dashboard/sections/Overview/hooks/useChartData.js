// sections/Overview/hooks/useChartData.js
import { useState, useEffect, useCallback } from 'react';
import axios from '../../../utils/axiosConfig';

const getInitialState = () => ({
  revenue: {
    week: [],
    month: [],
    year: [],
  },
  services: [],
  calendar: [],
});

export const useChartData = () => {
  const [chartData, setChartData] = useState(getInitialState);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('/api/dashboard/overview/charts');
      setChartData({
        revenue: data?.revenue || getInitialState().revenue,
        services: data?.services || [],
        calendar: data?.calendar || [],
      });
    } catch (error) {
      console.error('Chart data betöltési hiba:', error);
      setChartData(getInitialState());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    chartData,
    refreshData,
    isLoading,
  };
};
