import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AnalyticsCharts = ({ data }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };
    checkDarkMode();
    
    // Observer for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Default data if no data provided
  const chartData = data || {
    bookings: [12, 19, 15, 22, 18, 25, 30],
    revenue: [1200, 1900, 1500, 2200, 1800, 2500, 3000],
    users: [5, 12, 18, 25, 32, 40, 50],
    energy: [100, 150, 130, 200, 170, 220, 280],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    stationTypes: {
      labels: ['CCS', 'CHAdeMO', 'Type 2', 'Tesla'],
      values: [45, 25, 20, 10]
    },
    statusData: {
      labels: ['Available', 'Occupied', 'Maintenance'],
      values: [60, 25, 15]
    }
  };

  // Text color based on theme
  const textColor = isDarkMode ? '#e8e8e8' : '#1a1a2e';
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const mutedColor = isDarkMode ? '#aaaaaa' : '#6c757d';

  // Bookings Bar Chart
  const bookingsChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Bookings',
        data: chartData.bookings,
        backgroundColor: 'rgba(46, 125, 50, 0.6)',
        borderColor: 'rgba(46, 125, 50, 1)',
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  // Revenue Line Chart
  const revenueChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: chartData.revenue,
        fill: true,
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderColor: 'rgba(46, 125, 50, 1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(46, 125, 50, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  // User Growth Line Chart
  const usersChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Total Users',
        data: chartData.users,
        fill: true,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderColor: 'rgba(33, 150, 243, 1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  // Energy Consumption Bar Chart
  const energyChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Energy (kWh)',
        data: chartData.energy,
        backgroundColor: 'rgba(255, 193, 7, 0.6)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  // Station Types Doughnut Chart
  const stationTypesData = {
    labels: chartData.stationTypes.labels,
    datasets: [
      {
        data: chartData.stationTypes.values,
        backgroundColor: [
          'rgba(46, 125, 50, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(156, 39, 176, 0.8)',
        ],
        borderColor: [
          'rgba(46, 125, 50, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(156, 39, 176, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Charger Status Doughnut Chart
  const statusData = {
    labels: chartData.statusData.labels,
    datasets: [
      {
        data: chartData.statusData.values,
        backgroundColor: [
          'rgba(46, 125, 50, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(255, 193, 7, 0.8)',
        ],
        borderColor: [
          'rgba(46, 125, 50, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(255, 193, 7, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, weight: 'bold' },
          color: textColor,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: mutedColor,
        },
        grid: {
          color: gridColor,
        },
      },
      x: {
        ticks: {
          color: mutedColor,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12, weight: 'bold' },
          color: textColor,
          padding: 15,
        },
      },
    },
  };

  return (
    <div className="analytics-charts">
      <div className="charts-grid">
        <div className="chart-card">
          <h4>📊 Daily Bookings</h4>
          <div className="chart-container">
            <Bar data={bookingsChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>💰 Revenue Trend</h4>
          <div className="chart-container">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>👥 User Growth</h4>
          <div className="chart-container">
            <Line data={usersChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>⚡ Energy Consumption</h4>
          <div className="chart-container">
            <Bar data={energyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>🔌 Charger Types</h4>
          <div className="chart-container doughnut-container">
            <Doughnut data={stationTypesData} options={doughnutOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>📊 Charger Status</h4>
          <div className="chart-container doughnut-container">
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .analytics-charts { padding: 20px 0; }
        .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
        .chart-card { 
          background: white; 
          border-radius: 12px; 
          padding: 20px; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
          transition: all 0.3s ease; 
        }
        .chart-card:hover { 
          box-shadow: 0 4px 16px rgba(0,0,0,0.12); 
          transform: translateY(-2px); 
        }
        .chart-card h4 { 
          color: #1a1a2e; 
          margin-bottom: 15px; 
          text-align: center; 
          font-size: 16px; 
        }
        .chart-container { height: 220px; position: relative; }
        .doughnut-container { height: 220px; max-width: 280px; margin: 0 auto; }
        
        /* Dark Mode Styles */
        body.dark-mode .chart-card {
          background: #2d2d2d;
        }
        body.dark-mode .chart-card h4 {
          color: #e8e8e8;
        }
        body.dark-mode .chart-card:hover {
          background: #3d3d3d;
        }
        
        @media (max-width: 992px) { 
          .charts-grid { grid-template-columns: repeat(2, 1fr); } 
        }
        @media (max-width: 768px) { 
          .charts-grid { grid-template-columns: 1fr; }
          .chart-container { height: 200px; }
          .doughnut-container { max-width: 220px; }
        }
        @media (max-width: 480px) {
          .chart-container { height: 180px; }
          .doughnut-container { max-width: 180px; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsCharts;