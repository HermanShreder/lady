import { NextResponse } from 'next/server';

const BOTS = [
    'facebookexternalhit','facebot','facebookbot','fbav','fb_iab',
    'instagram','meta-externalagent','meta-externalfetcher',
    'twitterbot','linkedinbot','whatsapp','bot','crawler','spider'
];

export function middleware(req) {
    const ua = (req.headers.get('user-agent') || '').toLowerCase();
    const ip = req.headers.get('x-forwarded-for') || req.ip || '';
    const isBot = BOTS.some(b => ua.includes(b)) ||
        ip.startsWith('31.13.') || ip.startsWith('66.220.') ||
        ip.startsWith('69.63.') || ip.startsWith('157.240.') ||
        ip.startsWith('173.252.') || ip.startsWith('179.60.');

    if (isBot) return NextResponse.rewrite(new URL('/safe.html', req.url));
    return NextResponse.rewrite(new URL('/index.html', req.url));
}

export const config = { matcher: ['/((?!api|_next|static|favicon).*)'] };
