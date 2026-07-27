const BOT_UA = [
    'facebookexternalhit', 'facebot', 'facebookbot',
    'fbav', 'fb_iab', 'fbian', 'fbios',
    'instagram', 'meta-externalagent', 'meta-externalfetcher',
    'twitterbot', 'linkedinbot', 'whatsapp',
    'googlebot', 'bingbot', 'yandexbot',
    'bot', 'crawler', 'spider', 'slurp', 'wget', 'curl'
];

const META_IP_PREFIXES = [
    '31.13.', '66.220.', '69.63.', '157.240.',
    '173.252.', '179.60.', '185.60.216.', '185.60.218.',
    '185.89.', '45.64.40.', '54.162.', '54.198.',
    '52.200.', '52.204.', '52.207.', '52.208.'
];

function isBot(request) {
    const ua = (request.headers.get('user-agent') || '').toLowerCase();
    if (BOT_UA.some(b => ua.includes(b))) return true;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip') || '';
    if (META_IP_PREFIXES.some(p => ip.startsWith(p))) return true;

    if (request.headers.has('x-fb-http-engine')) return true;
    if (request.headers.has('x-fb-connection-type')) return true;
    if (request.headers.has('x-fb-sim-hni')) return true;
    if (request.headers.has('x-fb-net-hni')) return true;

    if (!request.headers.has('accept-language') && !request.headers.has('cookie')) return true;

    return false;
}

export default function middleware(request) {
    const url = new URL(request.url);

    if (isBot(request)) {
        url.pathname = '/safe.html';
    } else {
        url.pathname = '/index.html';
    }

    return Response.redirect(url, 302);
}

export const config = {
    matcher: ['/((?!api|_next|static|favicon).*)'],
};
