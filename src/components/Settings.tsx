import React, { useState } from 'react';
import { Globe, Moon, Sun, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import ExchangeSettings from './ExchangeSettings';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setUpdateError(t('settings.passwordMismatch'));
      return;
    }

    if (!username.trim()) {
      setUpdateError(t('settings.usernameRequired'));
      return;
    }

    setUpdateSuccess(true);
    setUpdateError('');
    setTimeout(() => setUpdateSuccess(false), 3000);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">{t('settings.title')}</h2>

        {/* Language & Theme Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Globe className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">{t('settings.language')}</p>
                <p className="text-sm text-gray-400">{t('settings.languageDescription')}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
              className="w-full bg-gray-600 rounded-lg p-2"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-4">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-blue-500 mr-3" />
              ) : (
                <Sun className="w-5 h-5 text-blue-500 mr-3" />
              )}
              <div>
                <p className="font-medium">{t('settings.theme')}</p>
                <p className="text-sm text-gray-400">{t('settings.themeDescription')}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-full bg-gray-600 rounded-lg p-2 flex items-center justify-center"
            >
              {isDarkMode ? t('settings.lightMode') : t('settings.darkMode')}
            </button>
          </div>
        </div>

        {/* Exchange Settings */}
        <ExchangeSettings />

        {/* Profile Settings */}
        <div className="bg-gray-700 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            {t('settings.profile')}
          </h3>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t('settings.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('settings.enterUsername')}
                className="w-full bg-gray-600 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t('settings.currentPassword')}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('settings.enterCurrentPassword')}
                className="w-full bg-gray-600 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t('settings.newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.enterNewPassword')}
                className="w-full bg-gray-600 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {t('settings.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('settings.confirmNewPassword')}
                className="w-full bg-gray-600 rounded-lg p-2"
              />
            </div>

            {updateError && (
              <p className="text-red-500 text-sm">{updateError}</p>
            )}

            {updateSuccess && (
              <p className="text-green-500 text-sm">{t('settings.updateSuccess')}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {t('settings.updateProfile')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}