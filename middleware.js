// ✅ ТОЛЬКО настоящие боты-парсеры
// FBAV, FB_IAB, instagram, whatsapp — УБРАНЫ (это живые люди)
// 'bot', 'crawler', 'spider' — УБРАНЫ (слишком широкие, ловят легитимные UA)
const BOT_UA = [
    'facebookexternalhit', 'facebot', 'facebookbot',
    'meta-externalagent', 'meta-externalfetcher',
    'twitterbot', 'linkedinbot', 'telegrambot',
    'googlebot', 'bingbot', 'yandexbot', 'duckduckbot',
    'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot',
    'applebot', 'amazonbot', 'cloudflare-amp',
    'wget/', 'curl/', 'python-requests', 'node-fetch',
    'scrapy', 'go-http-client', 'headlesschrome', 'phantomjs'
];

// ❌ META_IPS УБРАНЫ ПОЛНОСТЬЮ
// Часть пользователей Instagram идёт через прокси Meta
// Блокировка этих IP отправляла реальных людей на safe.html

export default function middleware(request: Request) {
    const ua = (request.headers.get('user-agent') || '').toLowerCase();

    // Проверяем ТОЛЬКО по UA ботов-парсеров
    // БЕЗ проверки IP Meta
    // БЕЗ проверки accept-language / cookie
    // БЕЗ проверки x-fb-http-engine / x-fb-connection-type
    //   (эти хедеры есть у ЖИВЫХ пользователей в FB/IG приложении)
    const isBot = BOT_UA.some(b => ua.includes(b));

    const url = new URL(request.url);
    url.pathname = isBot ? '/safe.html' : '/index.html';
    return Response.redirect(url, 302);
}

export const config = {
    matcher: ['/((?!api|_next|static|favicon).*)']
};
