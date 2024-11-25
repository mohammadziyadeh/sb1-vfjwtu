import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart2,
  Calculator,
  Settings as SettingsIcon,
  LogOut,
  Brain,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { icon: BarChart2, label: t('nav.marketStatus'), path: '/dashboard' },
    { icon: Brain, label: t('nav.smartTrading'), path: '/dashboard/smart-trading' },
    { icon: Bot, label: 'Trading Bot', path: '/dashboard/bot' },
    { icon: Calculator, label: t('nav.investmentCalculator'), path: '/dashboard/calculator' },
    { icon: SettingsIcon, label: t('nav.settings'), path: '/dashboard/settings' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-500">Trading Bot</h1>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4">
        <button
          onClick={logout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </div>
  );
}