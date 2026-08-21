export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Микро-API для получения страны пользователя (по IP)
    if (url.pathname === '/api/geo') {
      // Cloudflare автоматически определяет страну и кладет в request.cf.country
      const country = request.cf?.country || 'Unknown';
      return new Response(JSON.stringify({ country }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Отдаем наш единственный белый лендинг
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
    }

    // Все остальные запросы пропускаем к файлам
    return env.ASSETS.fetch(request);
  }
};
