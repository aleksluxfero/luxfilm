// bot/bot.ts
import { Bot } from 'grammy';
import { 
  startHandler,
  searchHandler,
  showItemHandler,
  backToListHandler,
  paginationHandler
} from './handlers';
import { MediaItem } from '@/types/api';

interface Session {
  results?: MediaItem[];
  currentPage?: number;
}

type MyContext = import('grammy').Context & { session: Session };

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}

export const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

// Настройка сессии для хранения результатов поиска
bot.use(async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  await next();
});

// Автоматическое формирование webhook URL
const getWebhookUrl = () => {
  if (process.env.WEBHOOK_URL) {
    return process.env.WEBHOOK_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/telegram`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('WEBHOOK_URL or VERCEL_URL must be set in production');
  }
  
  // Для локальной разработки
  return 'https://your-ngrok-url.ngrok.io/api/telegram';
};

// Установка вебхука
if (process.env.NODE_ENV === 'production' || process.env.VERCEL_URL) {
  const setWebhook = async () => {
    try {
      const webhookUrl = getWebhookUrl();
      console.log('Setting webhook to:', webhookUrl);
      await bot.api.setWebhook(webhookUrl);
      console.log('Webhook set successfully');
    } catch (error) {
      console.error('Failed to set webhook:', error);
    }
  };
  
  // Отложенный запуск установки вебхука
  setTimeout(setWebhook, 1000);
}

// Регистрация обработчиков
bot.command('start', startHandler);
bot.on('message:text', searchHandler);
bot.callbackQuery(/^item_(\d+)/, showItemHandler);
bot.callbackQuery(/^back_(\d+)/, backToListHandler);
bot.callbackQuery(/^page_(\d+)/, paginationHandler);

// Обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  console.error(err.error);
});