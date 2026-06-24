import { NextResponse } from 'next/server';
import { Policy } from '@/types';

// ─────────────────────────────────────────────────────────────────
// Policy expiry helpers — single source of truth for expiry logic
// ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the policy's expiry date is strictly in the past (today = still valid).
 */
export function isPolicyExpired(policy: Pick<Policy, 'expiry'>): boolean {
    if (!policy.expiry) return false;
    const expiry = new Date(policy.expiry);
    expiry.setHours(23, 59, 59, 999); // expires at end of day
    return expiry < new Date();
}

/**
 * Returns the effective status of a policy, overriding 'Active' with 'Expired'
 * when the expiry date has passed. Does not mutate the database — use syncPolicyStatuses for that.
 */
export function resolveEffectiveStatus(policy: Policy): Policy['status'] {
    if (policy.status !== 'Expired' && isPolicyExpired(policy)) return 'Expired';
    return policy.status;
}


export type ApiError = { error: string };
export type ApiSuccess<T = unknown> = T;

/**
 * Wrap a route handler with standardized error catching.
 * Catches any thrown error and returns a consistent 500 response.
 */
export function withErrorHandler(
    handler: (req: Request, ctx: any) => Promise<NextResponse>
) {
    return async (req: Request, ctx: any): Promise<NextResponse> => {
        try {
            return await handler(req, ctx);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Internal server error';
            console.error(`[API ERROR] ${req.method} ${req.url}:`, message);
            return NextResponse.json<ApiError>(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}

/** 200 OK with JSON body */
export function ok<T>(data: T): NextResponse {
    return NextResponse.json(data);
}

/** 400 Bad Request */
export function badRequest(message: string): NextResponse {
    return NextResponse.json<ApiError>({ error: message }, { status: 400 });
}

/** 404 Not Found */
export function notFound(resource = 'Resource'): NextResponse {
    return NextResponse.json<ApiError>(
        { error: `${resource} not found` },
        { status: 404 }
    );
}

/** 201 Created */
export function created<T>(data: T): NextResponse {
    return NextResponse.json(data, { status: 201 });
}

/**
 * Generate a sequential ID with the given prefix by inspecting
 * existing records — monotonically increasing, collision-resistant.
 *
 * @example generateSequentialId('NN-B-99-', claims, 4) → 'NN-B-99-0007'
 */
export function generateSequentialId(
    prefix: string,
    existingIds: string[],
    padLength = 4
): string {
    const sequences = existingIds
        .filter(id => id.startsWith(prefix))
        .map(id => parseInt(id.slice(prefix.length), 10))
        .filter(n => !isNaN(n));

    const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
    return `${prefix}${(maxSeq + 1).toString().padStart(padLength, '0')}`;
}
