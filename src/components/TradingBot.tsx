import React, { useState } from 'react';

const ApiKeyForm = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [exchange, setExchange] = useState('binance');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const credentials = { apiKey, apiSecret, exchange };
      const balance = await getExchangeBalance(credentials);
      setMessage(
        `API connected. Your available balance is: ${balance.available} USDT`
      );
    } catch (error) {
      setMessage('Failed to connect API.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key"
        />
        <input
          type="text"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          placeholder="API Secret"
        />
        <select value={exchange} onChange={(e) => setExchange(e.target.value)}>
          <option value="binance">Binance</option>
          <option value="huobi">Huobi</option>
        </select>
        <button type="submit">Connect API</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default ApiKeyForm;
