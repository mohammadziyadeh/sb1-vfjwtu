import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import MarketStatus from './MarketStatus';
import InvestmentCalculator from './InvestmentCalculator';
import SmartTrading from './SmartTrading';
import Settings from './Settings';
import Bot from './Bot';

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-900 p-6">
        <Routes>
          <Route path="/" element={<MarketStatus />} />
          <Route path="/smart-trading" element={<SmartTrading />} />
          <Route path="/bot" element={<Bot />} />
          <Route path="/calculator" element={<InvestmentCalculator />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}