import { useState, useEffect, useCallback } from 'react';
import { WebSocketManager } from '../services/WebSocketManager';
import { fetchPrice, PriceData } from '../services/marketData';

export function useRealtimePrice(symbol: string) {
  const [price, setPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);

  const fetchPriceData = useCallback(async () => {
    try {
      const data = await fetchPrice(symbol);
      if (data.price > 0) {
        setPrice(data.price);
        setPriceChange(data.priceChange);
        setVolume(data.volume);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [symbol]);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const initializePrice = async () => {
      if (!mounted) return;
      
      const success = await fetchPriceData();
      if (!success && retryCount < 3) {
        retryTimeout = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000 * (retryCount + 1));
      }
    };

    initializePrice();

    const wsManager = WebSocketManager.getInstance();

    const handleData = (data: any) => {
      if (!mounted) return;
      
      const newPrice = Number(data.c);
      if (newPrice > 0) {
        setPrice(newPrice);
        setPriceChange(Number(data.P));
        setVolume(Number(data.v));
        setIsLive(true);
      }
    };

    const handleError = async () => {
      if (!mounted) return;
      
      setIsLive(false);
      await fetchPriceData();
    };

    const unsubscribe = wsManager.subscribe(symbol, handleData);
    wsManager.on(`error:${symbol.toLowerCase()}`, handleError);

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      unsubscribe();
      wsManager.off(`error:${symbol.toLowerCase()}`, handleError);
    };
  }, [symbol, fetchPriceData, retryCount]);

  return { price, priceChange, volume, isLive };
}