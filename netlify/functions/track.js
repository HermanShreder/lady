const TG_TOKEN = '8548574419:AAGzgN7dnv04TtvKFJiZyu3LOMw6HcsL27Y';
const TG_CHAT = '5253808709';

let stats = { 
    humans: 0, bots: 0, total: 0, uniqueVisits: 0,
    bridgeOpen: 0, tgOpen: 0, tgFail: 0,
    leadQueued: 0, bridgeExit: 0, manualClick: 0,
    lastReset: Date.now() 
};
const visitors = new Map();
const STATS_INTERVAL = 10 * 60 * 1000;

const INAPP_UA = [
    'fbav/', 'fban/', 'fb_iab/', 'fbios/',
    'instagram', 'tiktok', 'snapchat',
    'line/', 'wechat/'
];

const BOT_UA = [
    'facebookexternalhit', 'facebot', 'facebookbot',
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
    '2a03:2880:', '2620:10d:c0', '2600:1f',
    '2600:9000:', '2406:da', '2607:f8b0:'
];

function classify(ua, ip) {
    const u = (ua || '').toLowerCase();
    const ipStr = ip || '';
    const ipLower = ipStr.toLowerCase();
    if (INAPP_UA.some(b => u.includes(b.toLowerCase()))) return 'human';
    if (BOT_UA.some(b => u.includes(b.toLowerCase()))) return 'bot';
    if (BOT_IPS_V4.some(p => ipStr.startsWith(p))) return 'bot';
    if (BOT_IPS_V6.some(p => ipLower.startsWith(p.toLowerCase()))) return 'bot';
    return 'human';
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
    const visitor = body.visitor || 'unknown';

    const headers = event.headers || {};
    const ip = headers['x-forwarded-for']?.split(',')[0]?.trim()
            || headers['x-real-ip']
            || headers['client-ip']
            || '?';
    const ua = headers['user-agent'] || '';
    const ref = headers.referer || headers.referrer || 'Direct';

    const classification = classify(ua, ip);
    const type = classification === 'bot' ? '🤖 БОТ' : '👤 ЧЕЛОВЕК';
    const geo = await geoIP(ip);

    // Считаем уникальных по visitor ID
    if (classification === 'human') {
        if (!visitors.has(visitor)) {
            visitors.set(visitor, 1);
            stats.uniqueVisits++;
        } else {
            visitors.set(visitor, visitors.get(visitor) + 1);
        }

        if (action === 'BRIDGE_OPEN') stats.bridgeOpen++;
        if (action === 'LEAD_QUEUED') stats.leadQueued++;
        if (action === 'BRIDGE_EXIT') stats.bridgeExit++;
        if (action === 'TG_OPEN') stats.tgOpen++;
        if (action === 'TG_FAIL') stats.tgFail++;
        if (action === 'BRIDGE_MANUAL_CLICK') stats.manualClick++;
    }

    // Сводка каждые 10 минут
    const now = Date.now();
    if (now - stats.lastReset >= STATS_INTERVAL) {
        // Конверсия = TG_OPEN / BRIDGE_OPEN
        const conversion = stats.bridgeOpen > 0 
            ? Math.round(stats.tgOpen * 100 / stats.bridgeOpen) 
            : 0;

        // Считаем повторные заходы
        let repeats = 0;
        for (const count of visitors.values()) {
            if (count > 1) repeats += count - 1;
        }
        
        const summary = `📊 <b>Статистика за 10 минут</b>\n\n` +
            `👤 Людей: <b>${stats.humans}</b>\n` +
            `🆕 Уникальных: <b>${stats.uniqueVisits}</b>\n` +
            `🔁 Повторных заходов: <b>${repeats}</b>\n` +
            `🤖 Ботов: <b>${stats.bots}</b>\n` +
            `📈 Всего событий: <b>${stats.total}</b>\n\n` +
            `🌉 <b>Bridge открыт: ${stats.bridgeOpen}</b>\n` +
            `📤 Lead отправлен: ${stats.leadQueued}\n` +
            `🚪 Bridge покинут: ${stats.bridgeExit}\n\n` +
            `✅ <b>ТГ открыт: ${stats.tgOpen}</b>\n` +
            `❌ ТГ не открылся: ${stats.tgFail}\n` +
            `🖱 Ручных кликов: ${stats.manualClick}\n\n` +
            `🎯 <b>Конверсия Bridge → TG: ${conversion}%</b>\n\n` +
            `🕐 ${new Date(stats.lastReset).toISOString().slice(0, 19)} → ${new Date(now).toISOString().slice(0, 19)}`;
        try { await sendTG(summary); } catch (e) {}
        
        stats = { humans: 0, bots: 0, total: 0, uniqueVisits: 0, bridgeOpen: 0, tgOpen: 0, tgFail: 0, leadQueued: 0, bridgeExit: 0, manualClick: 0, lastReset: now };
        visitors.clear();
    }

    if (classification === 'bot') stats.bots++;
    else stats.humans++;
    stats.total++;

    let msg = `${type} 🔔 <b>${action}</b>`;
    msg += `\n\n📱 ${device}`;
    msg += `\n🌐 ${ip}`;
    msg += `\n🌍 ${geo.country}, ${geo.city}`;
    msg += `\n📡 ${geo.isp}`;
    msg += `\n📐 ${screen}`;
    msg += `\n🗣 ${lang}`;
    msg += `\n🔗 ${ref}`;
    if (details) msg += `\n📝 ${details}`;
    msg += `\n🆔 ${visitor.substring(0, 8)}...`;
    msg += `\n🕐 ${new Date().toISOString().slice(0, 19)}`;

    try { await sendTG(msg); } catch (e) {}

    return { statusCode: 204 };
};
