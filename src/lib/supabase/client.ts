import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Инициализируем клиент ТОЛЬКО по требованию (в обработчиках/эффектах).
 * Ничего не делаем при импорте, чтобы SSR/пререндер не падал.
 */
export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Добавь их в .env.local и в Vercel → Project → Settings → Environment Variables."
    );
  }

  _client = createClient(url, key);
  return _client;
}
