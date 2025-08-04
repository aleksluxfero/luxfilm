// bot/helpers.ts
import axios from 'axios';
import { MediaItem, ApiResponse } from '@/types/api';

const API_BASE = 'https://portal.lumex.host/api';
const API_TOKEN = process.env.API_TOKEN;

export async function searchMedia(query: string): Promise<MediaItem[]> {
  const endpoints = [
    `${API_BASE}/movies?api_token=${API_TOKEN}&query=${encodeURIComponent(query)}&limit=20`,
    `${API_BASE}/animes?api_token=${API_TOKEN}&query=${encodeURIComponent(query)}&limit=20`,
    `${API_BASE}/tv-series?api_token=${API_TOKEN}&query=${encodeURIComponent(query)}&limit=20`,
    `${API_BASE}/anime-tv-series?api_token=${API_TOKEN}&query=${encodeURIComponent(query)}&limit=20`,
    `${API_BASE}/show-tv-series?api_token=${API_TOKEN}&query=${encodeURIComponent(query)}&limit=20`,
  ];

  const results: MediaItem[] = [];
  
  for (const url of endpoints) {
    try {
      const res = await axios.get<ApiResponse>(url);
      results.push(...res.data.data);
    } catch (e) {
      console.error('API request error:', e);
    }
  }

  results.sort((a, b) => new Date(a.released).getTime() - new Date(b.released).getTime());
  return results.slice(0, 20);
}

export function formatMediaList(items: MediaItem[], page: number) {
  const perPage = 5;
  const start = page * perPage;
  const pageItems = items.slice(start, start + perPage);

  const buttons = pageItems.map((item) => [
    { text: item.ru_title, callback_data: `item_${item.id}` },
  ]);

  const navButtons: { text: string; callback_data: string }[] = [];
  if (page > 0) navButtons.push({ text: '⬅️ Назад', callback_data: `page_${page - 1}` });
  if (items.length > start + perPage)
    navButtons.push({ text: '➡️ Далее', callback_data: `page_${page + 1}` });

  if (navButtons.length) buttons.push(navButtons);

  return { inline_keyboard: buttons };
}

export async function getRating(kinopoiskId: number): Promise<number> {
  try {
    const url = `https://rating.kinopoisk.ru/${kinopoiskId}.xml`;
    const res = await axios.get<string>(url);
    const xmlText = res.data;
    
    // Парсинг регулярным выражением
    const match = xmlText.match(/<kp_rating[^>]*>([^<]+)<\/kp_rating>/);
    if (match && match[1]) {
      const rating = parseFloat(match[1]);
      return isNaN(rating) ? 0 : Math.round(rating * 10) / 10;
    }
    return 0;
  } catch (e) {
    console.error('Rating fetch error:', e);
    return 0;
  }
}

export async function formatMediaDetails(item: MediaItem) {
  const rating = await getRating(item.kinopoisk_id);
  const typeMap: Record<string, string> = {
    movie: 'Фильм',
    'tv-series': 'Сериал',
    anime: 'Аниме',
    'anime-tv-series': 'Аниме-сериал',
    'show-tv-series': 'ТВ-шоу',
  };

  const type = typeMap[item.content_type] || 'Неизвестно';

  const text = `
🎬 <b>${item.ru_title}</b> (${item.orig_title})

📝 Оригинальное название: ${item.orig_title}
🏷️ Тип: ${type}
📅 Год: ${new Date(item.released).getFullYear()}
🆔 Рейтинг: <a href="https://www.kinopoisk.ru/film/${item.kinopoisk_id}">${rating}</a>
▶️ <a href="${item.iframe_src}">Смотреть онлайн</a>
`.trim();

  return { text };
}