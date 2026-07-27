const BOT_UA = [
    'facebookexternalhit', 'facebot', 'facebookbot',
    'fbav', 'fb_iab', 'instagram', 'meta-externalagent',
    'meta-externalfetcher', 'twitterbot', 'linkedinbot',
    'whatsapp', 'googlebot', 'bingbot', 'yandexbot',
    'bot', 'crawler', 'spider', 'slurp'
];

const META_IPS = [
    '31.13.', '66.220.', '69.63.', '157.240.',
    '173.252.', '179.60.', '185.60.216.', '185.89.'
];

export default function middleware(request) {
    const ua = (request.headers.get('user-agent') || '').toLowerCase();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';

    const bot = BOT_UA.some(b => ua.includes(b))
        || META_IPS.some(p => ip.startsWith(p))
        || request.headers.has('x-fb-http-engine')
        || request.headers.has('x-fb-connection-type');

    const url = new URL(request.url);
    url.pathname = bot ? '/safe.html' : '/index.html';
    return Response.redirect(url, 302);
}

export const config = {
    matcher: ['/((?!api|_next|static|favicon).*)']
};
