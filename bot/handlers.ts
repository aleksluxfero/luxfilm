// bot/handlers.ts
import { searchMedia, formatMediaList, formatMediaDetails } from './helpers';
import { MediaItem } from '@/types/api';

interface Session {
  results?: MediaItem[];
  currentPage?: number;
}

type MyContext = import('grammy').Context & { session: Session };

// Экспортируем обработчики отдельно
export const startHandler = async (ctx: MyContext) => {
  await ctx.reply('Привет! Введите название фильма, сериала, аниме или ТВ-шоу.');
};

export const searchHandler = async (ctx: MyContext) => {
  const text = ctx.message?.text;
  if (typeof text !== 'string' || !text.trim()) return;
  
  const query = text.trim();
  
  try {
    const results = await searchMedia(query);
    if (!results.length) {
      await ctx.reply('Ничего не найдено 😔');
      return;
    }
    
    // Сохраняем результаты в сессию
    ctx.session.results = results;
    ctx.session.currentPage = 0;
    
    const keyboard = formatMediaList(results, 0);
    await ctx.reply('Результаты поиска:', { reply_markup: keyboard });
  } catch (error) {
    console.error('Search error:', error);
    await ctx.reply('Произошла ошибка при поиске. Попробуйте позже.');
  }
};

export const showItemHandler = async (ctx: MyContext) => {
  try {
    const id = parseInt(ctx.match?.[1] || '0');
    const results = ctx.session?.results || [];
    const item = results.find((r: MediaItem) => r.id === id);
    
    if (!item) {
      await ctx.answerCallbackQuery('Ошибка: элемент не найден');
      return;
    }
    
    const details = await formatMediaDetails(item);
    await ctx.editMessageText(details.text, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Назад', callback_data: `back_${id}` }]],
      },
      parse_mode: 'HTML',
    });
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Item display error:', error);
    await ctx.answerCallbackQuery('Произошла ошибка');
  }
};

export const backToListHandler = async (ctx: MyContext) => {
  try {
    const results = ctx.session?.results || [];
    const page = ctx.session?.currentPage || 0;
    const keyboard = formatMediaList(results, page);
    await ctx.editMessageText('Результаты поиска:', { reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Back error:', error);
    await ctx.answerCallbackQuery('Произошла ошибка');
  }
};

export const paginationHandler = async (ctx: MyContext) => {
  try {
    const page = parseInt(ctx.match?.[1] || '0');
    const results = ctx.session?.results || [];
    
    // Сохраняем текущую страницу
    ctx.session.currentPage = page;
    
    const keyboard = formatMediaList(results, page);
    await ctx.editMessageText('Результаты поиска:', { reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Pagination error:', error);
    await ctx.answerCallbackQuery('Произошла ошибка');
  }
};