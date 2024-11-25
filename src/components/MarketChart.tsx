import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface TimeframeButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function TimeframeButton({ children, active, onClick }: TimeframeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

export default function MarketChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [activeTimeframe, setActiveTimeframe] = React.useState('24H');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1d1f' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
      },
      timeScale: {
        borderColor: '#2b2b43',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const lineSeries = chart.addLineSeries({
      color: '#3B82F6',
      lineWidth: 2,
    });

    // Sample data
    const data = [
      { time: '2024-01-01', value: 48235 },
      { time: '2024-01-02', value: 48500 },
      { time: '2024-01-03', value: 48750 },
      { time: '2024-01-04', value: 48600 },
      { time: '2024-01-05', value: 48900 },
      { time: '2024-01-06', value: 49100 },
      { time: '2024-01-07', value: 49250 },
    ];

    lineSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">BTC/USDT Price Chart</h2>
        <div className="flex space-x-2">
          <TimeframeButton 
            active={activeTimeframe === '24H'} 
            onClick={() => setActiveTimeframe('24H')}
          >
            24H
          </TimeframeButton>
          <TimeframeButton 
            active={activeTimeframe === '1W'} 
            onClick={() => setActiveTimeframe('1W')}
          >
            1W
          </TimeframeButton>
          <TimeframeButton 
            active={activeTimeframe === '1M'} 
            onClick={() => setActiveTimeframe('1M')}
          >
            1M
          </TimeframeButton>
        </div>
      </div>
      
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}