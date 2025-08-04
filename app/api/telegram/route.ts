// app/api/telegram/route.ts
import { bot } from '@/bot/bot';
import { webhookCallback } from 'grammy';

export const runtime = 'edge';
export const preferredRegion = 'arn1';

// Создаем обработчик вебхука
const handle = webhookCallback(bot, 'std/http');

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}