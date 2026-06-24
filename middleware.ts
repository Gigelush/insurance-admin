import { NextResponse, NextRequest } from "next/server";
import { SESSION_COOKIE, USERS, canAccess } from "@/lib/auth";

const ALLOWED_ORIGINS = (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001"
).split(",");

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/me'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get("origin");

    // ── CORS: handle preflight ──────────────────────────────────────
    if (request.method === "OPTIONS") {
        const preflightRes = new NextResponse(null, { status: 204 });
        if (origin && ALLOWED_ORIGINS.includes(origin)) {
            preflightRes.headers.set("Access-Control-Allow-Origin", origin);
        }
        preflightRes.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        preflightRes.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        preflightRes.headers.set("Access-Control-Max-Age", "86400");
        return preflightRes;
    }

    // ── CORS: add headers to all API responses ──────────────────────
    if (pathname.startsWith('/api/')) {
        // Auth API routes are always public
        if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
            const res = NextResponse.next();
            if (origin && ALLOWED_ORIGINS.includes(origin)) {
                res.headers.set("Access-Control-Allow-Origin", origin);
            }
            res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return res;
        }

        // For other API calls, verify session cookie
        const session = request.cookies.get(SESSION_COOKIE)?.value;
        const response = NextResponse.next();
        if (origin && ALLOWED_ORIGINS.includes(origin)) {
            response.headers.set("Access-Control-Allow-Origin", origin);
        }
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        // API: allow through — page-level auth is enforced by the client
        return response;
    }

    // ── Page route protection ────────────────────────────────────────
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Check session cookie
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Decode session (format: "username:role")
    try {
        const decoded = Buffer.from(session, 'base64').toString('utf-8');
        const [username, role] = decoded.split(':');
        const user = USERS.find(u => u.username === username);

        if (!user || user.role !== role) {
            const loginUrl = new URL('/login', request.url);
            const res = NextResponse.redirect(loginUrl);
            res.cookies.delete(SESSION_COOKIE);
            return res;
        }

        // Check if user can access this route
        if (!canAccess(user.role, pathname)) {
            // Redirect to their default page
            const defaultPage = user.role === 'basic_user' ? '/avizari' : '/claims';
            return NextResponse.redirect(new URL(defaultPage, request.url));
        }

    } catch {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png|.*\\.svg).*)',
    ],
};
