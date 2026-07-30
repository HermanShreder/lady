const https = require('https');

const TG_TOKEN = '8548574419:AAGzgN7dnv04TtvKFJiZyu3LOMw6HcsL27Y';
const TG_CHAT = '5253808709';

// ═══════════════════════════════════════════
// СЧЁТЧИКИ
// ═══════════════════════════════════════════
let stats = {
    landing: 0, clicks: 0, viewContent: 0,
    bridgeOpen: 0, leadQueued: 0, bridgeExit: 0,
    tgOpen: 0, tgFail: 0, manualClick: 0,
    humans: 0, bots: 0, total: 0, uniqueVisits: 0,
    totalRequests: 0, lastReset: Date.now()
};

const STATS_INTERVAL = 10 * 60 * 1000;

// ═══════════════════════════════════════════
// КЛАССИФИКАЦИЯ
// ═══════════════════════════════════════════
const INAPP_UA = ['fbav/', 'fban/', 'fb_iab/', 'fbios/', 'instagram', 'tiktok', 'snapchat', 'line/', 'wechat/'];
const BOT_UA = ['facebookexternalhit', 'facebot', 'facebookbot', 'meta-externalagent', 'meta-externalfetcher', 'twitterbot', 'linkedinbot', 'telegrambot', 'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot', 'applebot', 'amazonbot', 'cloudflare-amp', 'wget/', 'curl/', 'python-requests', 'node-fetch', 'scrapy', 'phantomjs', 'headlesschrome'];

function classify(ua, ip) {
    const u = (ua || '').toLowerCase();
    if (INAPP_UA.some(b => u.includes(b))) return 'human';
    if (BOT_UA.some(b => u.includes(b))) return 'bot';
    return 'human';
}

// ═══════════════════════════════════════════
// TELEGRAM API (через https, НЕ fetch)
// ═══════════════════════════════════════════
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

async function sendTG(text, replyMarkup) {
    const payload = { chat_id: TG_CHAT, text, parse_mode: 'HTML' };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    try { await tgApi('sendMessage', payload); } catch (e) { console.error('sendTG error:', e.message); }
}

async function editTG(chatId, messageId, text, replyMarkup) {
    const payload = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    try { await tgApi('editMessageText', payload); } catch (e) { console.error('editTG error:', e.message); }
}

async function answerCB(cbId) {
    try { await tgApi('answerCallbackQuery', { callback_query_id: cbId }); } catch (e) {}
}

// ═══════════════════════════════════════════
// ГЕОЛОКАЦИЯ
// ═══════════════════════════════════════════
function geoIP(ip) {
    return new Promise((resolve) => {
        if (!ip || ip === '127.0.0.1' || ip === '?') { resolve({ country: '?', city: '?', isp: '?' }); return; }
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

// ═══════════════════════════════════════════
// СТАТИСТИКА
// ═══════════════════════════════════════════
function buildStats() {
    const s = stats;
    const clickRate = s.landing > 0 ? Math.round(s.clicks / s.landing * 100) : 0;
    const bridgeToTg = s.bridgeOpen > 0 ? Math.round(s.tgOpen / s.bridgeOpen * 100) : 0;
    const clickToTg = s.clicks > 0 ? Math.round(s.tgOpen / s.clicks * 100) : 0;
    const uptimeMin = Math.round((Date.now() - s.lastReset) / 60000);

    return `📊 <b>Статистика воронки</b>\n\n` +
        `<b>🔹 Лендинг</b>\n` +
        `  👥 Заходов: <b>${s.landing}</b>\n` +
        `  👆 Кликов: <b>${s.clicks}</b> (${clickRate}%)\n` +
        `  👁 ViewContent: <b>${s.viewContent}</b>\n\n` +
        `<b>🔸 Bridge</b>\n` +
        `  🌉 Открыт: <b>${s.bridgeOpen}</b>\n` +
        `  📤 Lead: <b>${s.leadQueued}</b>\n` +
        `  🚪 Покинут: <b>${s.bridgeExit}</b>\n\n` +
        `<b>🔹 Telegram</b>\n` +
        `  ✅ Открыт: <b>${s.tgOpen}</b>\n` +
        `  ❌ Не открылся: <b>${s.tgFail}</b>\n` +
        `  🖱 Ручных: <b>${s.manualClick}</b>\n\n` +
        `<b>📈 Конверсии</b>\n` +
        `  Bridge → TG: <b>${bridgeToTg}%</b>\n` +
        `  <b>🎯 Клик → TG: ${clickToTg}%</b>\n\n` +
        `<b>⚙️ Система</b>\n` +
        `  👤 Людей: <b>${s.humans}</b> | 🤖 Ботов: <b>${s.bots}</b>\n` +
        `  🆕 Уникальных: <b>${s.uniqueVisits}</b>\n` +
        `  ⏱ Аптайм: <b>${uptimeMin} мин</b>\n\n` +
        `<i>🔄 ${new Date().toLocaleTimeString('ru-RU')}</i>`;
}

const statsKB = { inline_keyboard: [[{ text: '🔄 Обновить', callback_data: 'refresh_stats' }]] };

// ═══════════════════════════════════════════
// ПАРСИНГ BODY (поддержка base64 + URLSearchParams + JSON)
// ═══════════════════════════════════════════
function parseBody(event) {
    let raw = event.body || '';
    
    // Декодируем base64 если нужно
    if (event.isBase64Encoded && raw) {
        raw = Buffer.from(raw, 'base64').toString('utf-8');
    }
    
    if (!raw) return {};
    
    // Пробуем JSON
    try {
        return JSON.parse(raw);
    } catch (e) {}
    
    // URLSearchParams (от sendBeacon)
    if (raw.includes('=')) {
        const body = {};
        const params = new URLSearchParams(raw);
        params.forEach((v, k) => { body[k] = v; });
        return body;
    }
    
    return {};
}

// ═══════════════════════════════════════════
// ГЛАВНЫЙ ОБРАБОТЧИК
// ═══════════════════════════════════════════
exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = parseBody(event);

    // ─────────────────────────────────────────
    // TELEGRAM WEBHOOK (есть update_id)
    // ─────────────────────────────────────────
    if (body.update_id !== undefined) {
        // /start или /stats
        if (body.message && body.message.text) {
            const text = body.message.text.trim();
            if (text === '/start' || text === '/stats') {
                await sendTG(buildStats(), statsKB);
            }
        }
        // Нажатие кнопки "Обновить"
        if (body.callback_query && body.callback_query.data === 'refresh_stats') {
            const chatId = body.callback_query.message.chat.id;
            const msgId = body.callback_query.message.message_id;
            await editTG(chatId, msgId, buildStats(), statsKB);
            await answerCB(body.callback_query.id);
        }
        return { statusCode: 200, body: 'OK' };
    }

    // ─────────────────────────────────────────
    // ТРЕКИНГ ОТ САЙТА
    // ─────────────────────────────────────────
    const action = body.action || '';
    const device = body.device || '?';
    const details = body.details || '';
    const screen = body.screen || '?';
    const lang = body.lang || '?';
    const isUnique = body.unique === '1';

    const headers = event.headers || {};
    const ip = (headers['x-forwarded-for'] || '').split(',')[0]?.trim()
            || headers['x-real-ip'] || headers['client-ip'] || '?';
    const ua = headers['user-agent'] || '';
    const ref = headers.referer || headers.referrer || 'Direct';

    const type = classify(ua, ip) === 'bot' ? 'bot' : 'human';
    const typeLabel = type === 'bot' ? '🤖 БОТ' : '👤 ЧЕЛОВЕК';
    const geo = await geoIP(ip);

    // Обновляем счётчики (только для людей)
    if (type === 'human') {
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

    if (isUnique && type === 'human') stats.uniqueVisits++;
    if (type === 'bot') stats.bots++; else stats.humans++;
    stats.total++;
    stats.totalRequests++;

    // Сводка каждые 10 минут
    const now = Date.now();
    if (now - stats.lastReset >= STATS_INTERVAL) {
        const clickToTg = stats.clicks > 0 ? Math.round(stats.tgOpen / stats.clicks * 100) : 0;
        const summary = `📊 <b>Сводка за 10 минут</b>\n\n` +
            `👤 Людей: <b>${stats.humans}</b>\n🆕 Уникальных: <b>${stats.uniqueVisits}</b>\n🤖 Ботов: <b>${stats.bots}</b>\n\n` +
            `🔹 Лендинг: ${stats.landing} → кликов ${stats.clicks}\n` +
            `🔸 Bridge: ${stats.bridgeOpen} (lead ${stats.leadQueued})\n` +
            `🔹 Telegram: ✅ ${stats.tgOpen} | ❌ ${stats.tgFail}\n\n` +
            `🎯 <b>Конверсия Клик → TG: ${clickToTg}%</b>\n\n` +
            `🕐 ${new Date(stats.lastReset).toISOString().slice(0, 19)} → ${new Date(now).toISOString().slice(0, 19)}`;
        await sendTG(summary);
        stats = { landing: 0, clicks: 0, viewContent: 0, bridgeOpen: 0, leadQueued: 0, bridgeExit: 0, tgOpen: 0, tgFail: 0, manualClick: 0, humans: 0, bots: 0, total: 0, uniqueVisits: 0, totalRequests: 0, lastReset: now };
    }

    // Отправляем лог
    let msg = `${typeLabel} 🔔 <b>${action}</b>`;
    if (isUnique) msg += ` 🆕`;
    msg += `\n\n📱 ${device}`;
    msg += `\n🌐 ${ip}`;
    msg += `\n🌍 ${geo.country}, ${geo.city}`;
    msg += `\n📡 ${geo.isp}`;
    msg += `\n📐 ${screen}`;
    msg += `\n🗣 ${lang}`;
    msg += `\n🔗 ${ref}`;
    if (details) msg += `\n📝 ${details}`;
    msg += `\n\n<b>📊 Воронка:</b> Ленд ${stats.landing} → Клик ${stats.clicks} → TG ${stats.tgOpen}`;
    msg += `\n🎯 Конверсия: <b>${stats.clicks > 0 ? Math.round(stats.tgOpen / stats.clicks * 100) : 0}%</b>`;
    msg += `\n🆔 Уникальных: <b>${stats.uniqueVisits}</b>`;
    msg += `\n🕐 ${new Date().toISOString().slice(0, 19)}`;

    await sendTG(msg);

    return { statusCode: 204, body: '' };
};
