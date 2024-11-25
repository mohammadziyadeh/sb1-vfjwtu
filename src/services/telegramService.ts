import axios from 'axios';

// Use a secure way to store the token
const TELEGRAM_BOT_TOKEN = '7590066822:AAEOKf5GuRsNytBuh_bTUQfvYliHrpu1yDE';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

export async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  try {
    const response = await axios.post<TelegramResponse>(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });

    if (response.data.ok) {
      return true;
    } else {
      console.error('Failed to send message:', response.data.description);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Telegram API Error:', error.response?.data);
    } else {
      console.error('Error sending Telegram message:', error);
    }
    return false;
  }
}

export async function validateTelegramChatId(chatId: string): Promise<boolean> {
  try {
    const success = await sendTelegramMessage(
      chatId,
      '✅ Successfully connected to Trading Bot!\n\nYou will now receive Strong Buy signals notifications.'
    );

    return success;
  } catch (error) {
    console.error('Error validating Telegram chat ID:', error);
    return false;
  }
}

export async function testTelegramConnection(): Promise<boolean> {
  try {
    const response = await axios.get<TelegramResponse>(`${TELEGRAM_API_URL}/getMe`);
    return response.data.ok;
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    return false;
  }
}