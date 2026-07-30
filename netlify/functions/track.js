const https = require('https');

const TG_TOKEN = '8548574419:AAGzgN7dnv04TtvKFJiZyu3LOMw6HcsL27Y';
const TG_CHAT = '5253808709';

let stats = { humans: 0, bots: 0, total: 0, uniqueVisits: 0, landing: 0, clicks: 0, viewContent: 0, bridgeOpen: 0, leadQueued: 0, bridgeExit: 0, tgOpen: 0, tgFail: 0, manualClick: 0, lastReset: Date.now() };
const STATS_INTERVAL = 10 * 60 * 1000;

const INAPP_UA = ['fbav/', 'fban/', 'fb_iab/', 'fbios/', 'instagram', 'tiktok', 'snapchat', 'line/', 'wechat/'];
const BOT_UA = ['facebookexternalhit', 'facebot', 'facebookbot', 'meta-externalagent', 'meta-externalfetcher', 'twitterbot', 'linkedinbot', 'telegrambot', 'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot', 'applebot', 'amazonbot', 'cloudflare-amp', 'wget/', 'curl/', 'python-requests', 'node-fetch', 'scrapy', 'phantomjs', 'headlesschrome'];
const BOT_IPS_V4 = ['31.13.', '66.220.', '69.63.', '157.240.', '173.252.', '179.60.', '185.60.216.', '185.89.', '172.64.', '172.65.', '172.66.', '172.67.', '172.68.', '172.69.', '172.70.', '172.71.', '104.16.', '104.17.', '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.', '104.24.', '104.25.', '54.162.', '54.198.', '52.200.', '52.204.'];
const BOT_IPS_V6 = ['2a03:2880:', '2620:10d:c0', '2600:1f', '2600:9000:', '2406:da', '2607:f8b0:'];

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

function tgApi(method, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${TG_TOKEN}/${method}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function sendTG(text) {
    try { await tgApi('sendMessage', { chat_id: TG_CHAT, text, parse_mode: 'HTML' }); } catch (e) {}
}

function geoIP(ip) {
    return new Promise((resolve) => {
        if (!ip || ip === '127.0.0.1') { resolve({ country: '?', city: '?', isp: '?' }); return; }
        https.get(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const d = JSON.parse(body);
                    if (d.status === 'success') resolve({ country: d.country, city: d.city, isp: d.isp });
                    else resolve({ country: '?', city: '?', isp: '?' });
                } catch (e) { resolve({ country: '?', city: '?', isp: '?' }); }
            });
        }).on('error', () => resolve({ country: '?', city: '?', isp: '?' }));
    });
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405 };

    let body = {};
    try {
        let raw = event.body || '';
        if (event.isBase64Encoded && raw) raw = Buffer.from(raw, 'base64').toString('utf-8');
        if (raw.includes('=')) {
            const params = new URLSearchParams(raw);
            params.forEach((v, k) => { body[k] = v; });
        } else {
            body = JSON.parse(raw);
        }
    } catch (e) { body = {}; }

    const action = body.action || '?';
    const device = body.device || '?';
    const details = body.details || '';
    const screen = body.screen || '?';
    const lang = body.lang || '?';
    const isUnique = body.unique === '1';

    const headers = event.headers || {};
    const ip = (headers['x-forwarded-for'] || '').split(',')[0]?.trim() || headers['x-real-ip'] || headers['client-ip'] || '?';
    const ua = headers['user-agent'] || '';
    const ref = headers.referer || headers.referrer || 'Direct';

    const classification = classify(ua, ip);
    const type = classification === 'bot' ? '🤖 БОТ' : '👤 ЧЕЛОВЕК';
    const geo = await geoIP(ip);

    if (isUnique && classification === 'human') stats.uniqueVisits++;

    if (classification === 'human') {
        if (action === 'УНИКАЛЬНЫЙ_ЗАХОД' || action === 'ПОВТОРНЫЙ_ЗАХОД') stats.landing++;
        if (action.startsWith('КЛИК_')) stats.clicks++;
        if (action.startsWith('ПРОСМОТР_КОНТЕНТА_')) stats.viewContent++;
        if (action === 'BRIDGE_OPEN') stats.bridgeOpen++;
        if (action === 'LEAD_QUEUED') stats.leadQueued++;
        if (action === 'BRIDGE_EXIT') stats.bridgeExit++;
        if (action === 'TG_OPEN') stats.tgOpen++;
        if (action === 'TG_FAIL') stats.tgFail++;
        if (action === 'BRIDGE_MANUAL_CLICK') stats.manualClick++;
    }

    const now = Date.now();
    if (now - stats.lastReset >= STATS_INTERVAL) {
        const clickToTg = stats.clicks > 0 ? Math.round(stats.tgOpen / stats.clicks * 100) : 0;
        const summary = `📊 <b>Сводка за 10 минут</b>\n\n👤 Людей: <b>${stats.humans}</b>\n🆕 Уникальных: <b>${stats.uniqueVisits}</b>\n🤖 Ботов: <b>${stats.bots}</b>\n\n🔹 Лендинг: ${stats.landing} → кликов ${stats.clicks}\n🔸 Bridge: ${stats.bridgeOpen}\n🔹 TG открыт: <b>${stats.tgOpen}</b> | не открыт: ${stats.tgFail}\n\n🎯 <b>Конверсия Клик → TG: ${clickToTg}%</b>`;
        try { await sendTG(summary); } catch (e) {}
        stats = { humans: 0, bots: 0, total: 0, uniqueVisits: 0, landing: 0, clicks: 0, viewContent: 0, bridgeOpen: 0, leadQueued: 0, bridgeExit: 0, tgOpen: 0, tgFail: 0, manualClick: 0, lastReset: now };
    }

    if (classification === 'bot') stats.bots++; else stats.humans++;
    stats.total++;

    let msg = `${type} 🔔 <b>${action}</b>`;
    if (isUnique) msg += ` 🆕`;
    msg += `\n\n📱 ${device}\n🌐 ${ip}\n🌍 ${geo.country}, ${geo.city}\n📡 ${geo.isp}\n📐 ${screen}\n🗣 ${lang}\n🔗 ${ref}`;
    if (details) msg += `\n📝 ${details}`;
    msg += `\n\n📊 Ленд ${stats.landing} → Клик ${stats.clicks} → TG ${stats.tgOpen}`;
    msg += `\n🎯 Конверсия: <b>${stats.clicks > 0 ? Math.round(stats.tgOpen / stats.clicks * 100) : 0}%</b>`;
    msg += `\n🆔 Уникальных: <b>${stats.uniqueVisits}</b>\n🕐 ${new Date().toISOString().slice(0, 19)}`;

    try { await sendTG(msg); } catch (e) {}

    return { statusCode: 204 };
};
