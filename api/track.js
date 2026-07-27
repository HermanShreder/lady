const TG_TOKEN = '8548574419:AAGzgN7dnv04TtvKFJiZyu3LOMw6HcsL27Y';
const TG_CHAT = '5253808709';

async function sendTG(text) {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
    });
}

async function geoIP(ip) {
    try {
        const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`);
        const d = await r.json();
        if (d.status === 'success') return { country: d.country, city: d.city, isp: d.isp };
    } catch (e) {}
    return { country: '?', city: '?', isp: '?' };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { action = '?', device = '?', details = '', screen = '?', lang = '?' } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '?';
    const ref = req.headers.referer || 'Direct';
    const geo = await geoIP(ip);

    let msg = `🔔 <b>${action}</b>\n\n📱 ${device}\n🌐 ${ip}\n🌍 ${geo.country}, ${geo.city}\n📡 ${geo.isp}\n📐 ${screen}\n🗣 ${lang}\n🔗 ${ref}`;
    if (details) msg += `\n📝 ${details}`;
    msg += `\n🕐 ${new Date().toISOString()}`;

    try { await sendTG(msg); } catch (e) {}
    return res.status(204).end();
}
