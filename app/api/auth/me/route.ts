import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, USERS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE)?.value;
    if (!session) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    try {
        const decoded = Buffer.from(session, 'base64').toString('utf-8');
        const [username, role] = decoded.split(':');
        const user = USERS.find(u => u.username === username && u.role === role);
        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }
        return NextResponse.json({
            user: {
                username: user.username,
                displayName: user.displayName,
                role: user.role,
            }
        });
    } catch {
        return NextResponse.json({ user: null }, { status: 401 });
    }
}
