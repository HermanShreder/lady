export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';

    // Паттерны ботов
    const botPatterns = [
      "facebookexternalhit", "Facebot", "meta-externalagent",
      "LinkedInBot", "Twitterbot", "TelegramBot", "WhatsApp", 
      "Viber", "Discordbot"
    ];

    const isBot = botPatterns.some(pattern =>
      new RegExp(pattern, 'i').test(userAgent)
    );

    // Перехватываем запрос только к главной странице
    if (url.pathname === '/' || url.pathname === '/index.html') {
        if (isBot) {
          // Ботам отдаем белую страницу
          return env.ASSETS.fetch(new Request(new URL('/safe_page.html', request.url)));
        } else {
          // Людям отдаем боевой лендинг
          return env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
        }
    }

    // Все остальные запросы пропускаем к файлам
    return env.ASSETS.fetch(request);
  }
};
