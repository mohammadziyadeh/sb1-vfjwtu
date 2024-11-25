import React, { createContext, useContext, useState, useEffect } from 'react';
import { sendTelegramMessage } from '../services/telegramService';

interface NotificationSettings {
  telegramChatId: string;
  notifyStrongBuy: boolean;
  notifyStrongSell: boolean;
  minimumStrength: number;
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  sendNotification: (message: string) => Promise<boolean>;
  isConnected: boolean;
}

const defaultSettings: NotificationSettings = {
  telegramChatId: '',
  notifyStrongBuy: true,
  notifyStrongSell: false,
  minimumStrength: 80
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('notificationSettings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return defaultSettings;
    }
  });

  const [isConnected, setIsConnected] = useState(!!settings.telegramChatId);

  useEffect(() => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      setIsConnected(!!updated.telegramChatId);
      return updated;
    });
  };

  const sendNotification = async (message: string): Promise<boolean> => {
    if (!settings.telegramChatId) return false;

    try {
      return await sendTelegramMessage(settings.telegramChatId, message);
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  const value = {
    settings,
    updateSettings,
    sendNotification,
    isConnected
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}