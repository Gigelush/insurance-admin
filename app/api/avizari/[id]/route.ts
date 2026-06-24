import { deleteAvizare, updateAvizare } from '@/lib/db';
import { ok, notFound, withErrorHandler } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrorHandler(async (request, { params }: Ctx) => {
    const { id } = await params;
    const body = await request.json();
    const updated = updateAvizare(id, body);
    if (!updated) return notFound('Avizare');
    return ok(updated);
});

export const DELETE = withErrorHandler(async (_req, { params }: Ctx) => {
    const { id } = await params;
    const success = deleteAvizare(id);
    if (!success) return notFound('Avizare');
    return ok({ success: true });
});
