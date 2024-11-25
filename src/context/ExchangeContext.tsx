import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getExchangeBalance, validateExchangeAPI } from '../services/exchangeService';

interface ExchangeConfig {
  exchange: string;
  apiKey: string;
  apiSecret: string;
}

interface ExchangeContextType {
  configs: ExchangeConfig[];
  balances: Record<string, number>;
  validationStatus: Record<string, boolean>;
  addExchange: (config: ExchangeConfig) => Promise<boolean>;
  removeExchange: (exchange: string) => void;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

const BALANCE_UPDATE_INTERVAL = 30000; // 30 seconds

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [configs, setConfigs] = useState<ExchangeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('exchangeConfigs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});

  // Persist configs
  useEffect(() => {
    localStorage.setItem('exchangeConfigs', JSON.stringify(configs));
  }, [configs]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    const newBalances: Record<string, number> = {};
    const newValidationStatus: Record<string, boolean> = {};
    
    for (const config of configs) {
      try {
        const isValid = await validateExchangeAPI(config);
        newValidationStatus[config.exchange] = isValid;
        
        if (isValid) {
          const balance = await getExchangeBalance(config);
          newBalances[config.exchange] = balance.available;
        }
      } catch (error) {
        console.error(`Error fetching balance for ${config.exchange}:`, error);
        newValidationStatus[config.exchange] = false;
      }
    }
    
    setBalances(newBalances);
    setValidationStatus(newValidationStatus);
  }, [configs]);

  // Initial fetch and periodic updates
  useEffect(() => {
    if (configs.length > 0) {
      fetchBalances();
      const interval = setInterval(fetchBalances, BALANCE_UPDATE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [configs, fetchBalances]);

  const addExchange = async (config: ExchangeConfig): Promise<boolean> => {
    try {
      const isValid = await validateExchangeAPI(config);
      if (isValid) {
        const balance = await getExchangeBalance(config);
        setConfigs(prev => [...prev.filter(c => c.exchange !== config.exchange), config]);
        setValidationStatus(prev => ({ ...prev, [config.exchange]: true }));
        setBalances(prev => ({ ...prev, [config.exchange]: balance.available }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding exchange:', error);
      return false;
    }
  };

  const removeExchange = (exchange: string) => {
    setConfigs(prev => prev.filter(c => c.exchange !== exchange));
    setValidationStatus(prev => {
      const { [exchange]: _, ...rest } = prev;
      return rest;
    });
    setBalances(prev => {
      const { [exchange]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <ExchangeContext.Provider 
      value={{ 
        configs, 
        balances, 
        validationStatus, 
        addExchange, 
        removeExchange 
      }}
    >
      {children}
    </ExchangeContext.Provider>
  );
}

export function useExchange() {
  const context = useContext(ExchangeContext);
  if (!context) {
    throw new Error('useExchange must be used within an ExchangeProvider');
  }
  return context;
}