const TG_TOKEN = '8548574419:AAGzgN7dnv04TtvKFJiZyu3LOMw6HcsL27Y';
const TG_CHAT = '5253808709';

// ═══════════════════════════════════════════
// СЧЁТЧИКИ ВОРОНКИ
// ═══════════════════════════════════════════
let stats = {
    // Лендинг
    landing: 0,
    clicks: 0,
    viewContent: 0,
    // Bridge
    bridgeOpen: 0,
    leadQueued: 0,
    bridgeExit: 0,
    // Telegram
    tgOpen: 0,
    tgFail: 0,
    manualClick: 0,
    // Общие
    humans: 0,
    bots: 0,
    total: 0,
    uniqueVisits: 0,
    totalRequests: 0,
    lastReset: Date.now()
};

const STATS_INTERVAL = 10 * 60 * 1000;

// ═══════════════════════════════════════════
// КЛАССИФИКАЦИЯ БОТОВ
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// TELEGRAM API
// ═══════════════════════════════════════════
async function tgApi(method, payload) {
    try {
        const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await r.json();
    } catch (e) {
        console.error(`TG ${method} error:`, e);
        return null;
    }
}

async function sendTG(text, replyMarkup) {
    const payload = { chat_id: TG_CHAT, text, parse_mode: 'HTML' };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    return await tgApi('sendMessage', payload);
}

async function editTG(chatId, messageId, text, replyMarkup) {
    const payload = {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML'
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;
    return await tgApi('editMessageText', payload);
}

async function answerCallback(callbackQueryId, text) {
    return await tgApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: text || ''
    });
}

// ═══════════════════════════════════════════
// ФОРМИРОВАНИЕ СТАТИСТИКИ
// ═══════════════════════════════════════════
function buildStatsMessage() {
    const s = stats;

    // Конверсии
    const clickRate = s.landing > 0 ? Math.round(s.clicks / s.landing * 100) : 0;
    const landToBridge = s.clicks > 0 ? Math.round(s.bridgeOpen / s.clicks * 100) : 0;
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
        `  Ленд → Bridge: <b>${landToBridge}%</b>\n` +
        `  Bridge → TG: <b>${bridgeToTg}%</b>\n` +
        `  <b>🎯 Клик → TG: <b>${clickToTg}%</b></b>\n\n` +
        `<b>⚙️ Система</b>\n` +
        `  👤 Людей: <b>${s.humans}</b> | 🤖 Ботов: <b>${s.bots}</b>\n` +
        `  🆕 Уникальных: <b>${s.uniqueVisits}</b>\n` +
        `  📨 Запросов: <b>${s.totalRequests}</b>\n` +
        `  ⏱ Аптайм: <b>${uptimeMin} мин</b>\n\n` +
        `<i>🔄 ${new Date().toLocaleTimeString('ru-RU')}</i>`;
}

function statsKeyboard() {
    return { inline_keyboard: [[{ text: '🔄 Обновить', callback_data: 'refresh_stats' }]] };
}

// ═══════════════════════════════════════════
// ГЕОЛОКАЦИЯ
// ═══════════════════════════════════════════
async function geoIP(ip) {
    if (!ip || ip === '127.0.0.1') return { country: '?', city: '?', isp: '?' };
    try {
        const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`);
        const d = await r.json();
        if (d.status === 'success') return { country: d.country, city: d.city, isp: d.isp };
    } catch (e) {}
    return { country: '?', city: '?', isp: '?' };
}

// ═══════════════════════════════════════════
// ОБРАБОТКА TELEGRAM WEBHOOK
// ═══════════════════════════════════════════
async function handleTelegramWebhook(data) {
    // Команда /start или /stats
    if (data.message && data.message.text) {
        const text = data.message.text.trim();
        if (text === '/start' || text === '/stats') {
            await sendTG(buildStatsMessage(), statsKeyboard());
            return { statusCode: 200, body: 'OK' };
        }
    }

    // Нажатие inline кнопки
    if (data.callback_query && data.callback_query.data === 'refresh_stats') {
        const chatId = data.callback_query.message.chat.id;
        const messageId = data.callback_query.message.message_id;
        const cbId = data.callback_query.id;

        // Обновляем сообщение с актуальной статистикой
        await editTG(chatId, messageId, buildStatsMessage(), statsKeyboard());
        await answerCallback(cbId, '✅ Обновлено');
        return { statusCode: 200, body: 'OK' };
    }

    return { statusCode: 200, body: 'OK' };
}

// ═══════════════════════════════════════════
// ОБРАБОТКА ТРЕКИНГ ЗАПРОСА
// ═══════════════════════════════════════════
async function handleTrackingRequest(event) {
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
    const isUnique = body.unique === '1';

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

    // ─────────────────────────────────────
    // ОБНОВЛЯЕМ СЧЁТЧИКИ ВОРОНКИ
    // ─────────────────────────────────────
    if (classification === 'human') {
        if (action === 'УНИКАЛЬНЫЙ_ЗАХОД' || action === 'ПОВТОРНЫЙ_ЗАХОД') {
            stats.landing++;
        }
        if (action.startsWith('КЛИК_')) {
            stats.clicks++;
        }
        if (action.startsWith('ПРОСМОТР_КОНТЕНТА_')) {
            stats.viewContent++;
        }
        if (action === 'BRIDGE_OPEN') {
            stats.bridgeOpen++;
        }
        if (action === 'LEAD_QUEUED') {
            stats.leadQueued++;
        }
        if (action === 'BRIDGE_EXIT') {
            stats.bridgeExit++;
        }
        if (action === 'TG_OPEN') {
            stats.tgOpen++;
        }
        if (action === 'TG_FAIL') {
            stats.tgFail++;
        }
        if (action === 'BRIDGE_MANUAL_CLICK') {
            stats.manualClick++;
        }
    }

    // ─────────────────────────────────────
    // УНИКАЛЬНЫЕ И ОБЩИЕ СЧЁТЧИКИ
    // ─────────────────────────────────────
    if (isUnique && classification === 'human') {
        stats.uniqueVisits++;
    }
    if (classification === 'bot') stats.bots++;
    else stats.humans++;
    stats.total++;
    stats.totalRequests++;

    // ─────────────────────────────────────
    // СВОДКА КАЖДЫЕ 10 МИНУТ
    // ─────────────────────────────────────
    const now = Date.now();
    if (now - stats.lastReset >= STATS_INTERVAL) {
        const summary = `📊 <b>Сводка за 10 минут</b>\n\n` +
            `👤 Людей: <b>${stats.humans}</b>\n` +
            `🆕 Уникальных: <b>${stats.uniqueVisits}</b>\n` +
            `🤖 Ботов: <b>${stats.bots}</b>\n` +
            `📈 Всего событий: <b>${stats.total}</b>\n\n` +
            `<b>🔹 Лендинг</b>: ${stats.landing} → кликов ${stats.clicks}\n` +
            `<b>🔸 Bridge</b>: ${stats.bridgeOpen} (lead ${stats.leadQueued})\n` +
            `<b>🔹 Telegram</b>: ✅ ${stats.tgOpen} | ❌ ${stats.tgFail}\n\n` +
            `🎯 <b>Конверсия Клик → TG: ${stats.clicks > 0 ? Math.round(stats.tgOpen / stats.clicks * 100) : 0}%</b>\n\n` +
            `🕐 ${new Date(stats.lastReset).toISOString().slice(0, 19)} → ${new Date(now).toISOString().slice(0, 19)}`;
        try { await sendTG(summary); } catch (e) {}
        stats = {
            landing: 0, clicks: 0, viewContent: 0,
            bridgeOpen: 0, leadQueued: 0, bridgeExit: 0,
            tgOpen: 0, tgFail: 0, manualClick: 0,
            humans: 0, bots: 0, total: 0, uniqueVisits: 0,
            totalRequests: 0, lastReset: now
        };
    }

    // ─────────────────────────────────────
    // ЛОГ СОБЫТИЯ В TELEGRAM
    // ─────────────────────────────────────
    let msg = `${type} 🔔 <b>${action}</b>`;
    if (isUnique) msg += ` 🆕`;
    msg += `\n\n📱 ${device}`;
    msg += `\n🌐 ${ip}`;
    msg += `\n🌍 ${geo.country}, ${geo.city}`;
    msg += `\n📡 ${geo.isp}`;
    msg += `\n📐 ${screen}`;
    msg += `\n🗣 ${lang}`;
    msg += `\n🔗 ${ref}`;
    if (details) msg +=
