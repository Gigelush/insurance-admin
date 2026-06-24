import { getClaims, updateClaim, deleteClaim } from '@/lib/db';
import { ok, notFound, withErrorHandler } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req, { params }: Ctx) => {
    const { id } = await params;
    const claim = getClaims().find(c => c.id === id);
    if (!claim) return notFound('Claim');
    return ok(claim);
});

export const PUT = withErrorHandler(async (request, { params }: Ctx) => {
    const { id } = await params;
    const body = await request.json();
    const updated = updateClaim(id, body);
    if (!updated) return notFound('Claim');
    return ok(updated);
});

export const DELETE = withErrorHandler(async (_req, { params }: Ctx) => {
    const { id } = await params;
    console.log(`[DELETE] Claim: '${id}'`);
    const deleted = deleteClaim(id);
    if (!deleted) return notFound('Claim');
    return ok({ success: true });
});
