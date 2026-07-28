const TG_TOKEN = '8548574419:AAGzgN7dnv04TtvKFJiZyu3LOMw6HcsL27Y';
const TG_CHAT = '5253808709';

// Хранилище статистики (сбрасывается каждые 10 минут)
let stats = { humans: 0, bots: 0, total: 0, lastReset: Date.now() };
const STATS_INTERVAL = 10 * 60 * 1000;

// Точные сигнатуры ботов (без коротких слов которые матчат живых людей)
const BOT_UA = [
    'facebookexternalhit', 'facebot', 'facebookbot',
    'fb_iab/', 'fbav/', 'fbios/', 'fban/',
    'meta-externalagent', 'meta-externalfetcher',
    'twitterbot', 'linkedinbot', 'telegrambot',
    'googlebot', 'bingbot', 'yandexbot', 'duckduckbot',
    'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot',
    'applebot', 'amazonbot', 'cloudflare-amp',
    'wget/', 'curl/', 'python-requests', 'node-fetch',
    'scrapy', 'phantomjs', 'headlesschrome'
];

const BOT_IPS_V4 = [
    '31.13.', '66.220.', '69.63.', '157.240.', '173.252.', '179.60.',
    '185.60.216.', '185.89.', '172.64.', '172.65.', '172.66.', '172.67.',
    '172.68.', '172.69.', '172.70.', '172.71.', '104.16.', '104.17.',
    '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.',
    '104.24.', '104.25.', '54.162.', '54.198.', '52.200.', '52.204.'
];

const BOT_IPS_V6 = [
    '2a03:2880:',
    '2620:10d:c0',
    '2600:1f',
    '2600:9000:',
    '2406:da',
    '2607:f8b0:'
];

function isBot(ua, ip) {
    const u = (ua || '').toLowerCase();
    if (BOT_UA.some(b => u.includes(b.toLowerCase()))) return true;
    if (BOT_IPS_V4.some(p => (ip || '').startsWith(p))) return true;
    const ipLower = (ip || '').toLowerCase();
    if (BOT_IPS_V6.some(p => ipLower.startsWith(p.toLowerCase()))) return true;
    return false;
}

async function sendTG(text) {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
    });
}

async function geoIP(ip) {
    if (!ip || ip === '127.0.0.1') return { country: '?', city: '?', isp: '?' };
    try {
        const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`);
        const d = await r.json();
        if (d.status === 'success') return { country: d.country, city: d.city, isp: d.isp };
    } catch (e) {}
    return { country: '?', city: '?', isp: '?' };
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405 };

    // Парсим body (Netlify отдаёт строку URLSearchParams или JSON)
    let body = {};
    try {
        if (typeof event.body === 'string') {
            if (event.body.includes('=')) {
                const params = new URLSearchParams(event.body);
                params.forEach((v, k) => { body[k] = v; });
            } else {
                body = JSON.parse(event.body);
            }
        } else {
            body = event.body || {};
        }
    } catch (e) {
        body = {};
    }

    const action = body.action || '?';
    const device = body.device || '?';
    const details = body.details || '';
    const screen = body.screen || '?';
    const lang = body.lang || '?';

    const headers = event.headers || {};
    const ip = headers['x-forwarded-for']?.split(',')[0]?.trim()
            || headers['x-real-ip']
            || headers['client-ip']
            || '?';
    const ua = headers['user-agent'] || '';
    const ref = headers.referer || headers.referrer || 'Direct';

    const bot = isBot(ua, ip);
    const type = bot ? '🤖 БОТ' : '👤 ЧЕЛОВЕК';
    const geo = await geoIP(ip);

    // Обновляем статистику и отправляем сводку каждые 10 минут
    const now = Date.now();
    if (now - stats.lastReset >= STATS_INTERVAL) {
        const summary = `📊 <b>Статистика за 10 минут</b>\n\n` +
            `👤 Людей: <b>${stats.humans}</b>\n` +
            `🤖 Ботов: <b>${stats.bots}</b>\n` +
            `📈 Всего: <b>${stats.total}</b>\n\n` +
            `🕐 ${new Date(stats.lastReset).toISOString().slice(0, 19)} → ${new Date(now).toISOString().slice(0, 19)}`;
        try { await sendTG(summary); } catch (e) {}
        stats = { humans: 0, bots: 0, total: 0, lastReset: now };
    }

    if (bot) stats.bots++;
    else stats.humans++;
    stats.total++;

    // Формируем сообщение
    let msg = `${type} 🔔 <b>${action}</b>\n\n`;
    msg += `📱 ${device}\n`;
    msg += `🌐 ${ip}\n`;
    msg += `🌍 ${geo.country}, ${geo.city}\n`;
    msg += `📡 ${geo.isp}\n`;
    msg += `📐 ${screen}\n`;
    msg += `🗣 ${lang}\n`;
    msg += `🔗 ${ref}`;
    if (details) msg += `\n📝 ${details}`;
    msg += `\n🕐 ${new Date().toISOString().slice(0, 19)}`;

    try { await sendTG(msg); } catch (e) {}

    return { statusCode: 204 };
};
