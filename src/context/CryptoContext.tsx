import React, { createContext, useContext, useState, useEffect } from 'react';

interface CryptoData {
  symbol: string;
  price: string;
  priceChange: string;
}

interface CryptoContextType {
  selectedCryptos: CryptoData[];
  addCrypto: (crypto: CryptoData) => void;
  removeCrypto: (symbol: string) => void;
  updateCrypto: (crypto: CryptoData) => void;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [selectedCryptos, setSelectedCryptos] = useState<CryptoData[]>(() => {
    const saved = localStorage.getItem('selectedCryptos');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('selectedCryptos', JSON.stringify(selectedCryptos));
  }, [selectedCryptos]);

  const addCrypto = (crypto: CryptoData) => {
    if (!selectedCryptos.some(c => c.symbol === crypto.symbol)) {
      setSelectedCryptos(prev => [...prev, crypto]);
    }
  };

  const removeCrypto = (symbol: string) => {
    setSelectedCryptos(prev => prev.filter(c => c.symbol !== symbol));
  };

  const updateCrypto = (crypto: CryptoData) => {
    setSelectedCryptos(prev =>
      prev.map(c => (c.symbol === crypto.symbol ? crypto : c))
    );
  };

  return (
    <CryptoContext.Provider value={{ selectedCryptos, addCrypto, removeCrypto, updateCrypto }}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
}