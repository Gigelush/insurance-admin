import { NextResponse } from 'next/server';
import { USERS, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const { username, pin } = body as { username?: string; pin?: string };

    if (!username || !pin) {
        return NextResponse.json({ error: 'Utilizator și PIN sunt obligatorii.' }, { status: 400 });
    }

    const user = USERS.find(u => u.username === username && u.pin === pin);
    if (!user) {
        return NextResponse.json({ error: 'Utilizator sau PIN incorect.' }, { status: 401 });
    }

    // Session token: base64("username:role")
    const token = Buffer.from(`${user.username}:${user.role}`).toString('base64');

    const res = NextResponse.json({
        username: user.username,
        displayName: user.displayName,
        role: user.role,
    });

    res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours
    });

    return res;
}
