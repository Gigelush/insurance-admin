import { updateCollaborator, deleteCollaborator } from '@/lib/db';
import { ok, notFound, withErrorHandler } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrorHandler(async (request, { params }: Ctx) => {
    const { id } = await params;
    const body = await request.json();
    const updated = updateCollaborator(id, body);
    if (!updated) return notFound('Collaborator');
    return ok(updated);
});

export const DELETE = withErrorHandler(async (_req, { params }: Ctx) => {
    const { id } = await params;
    const success = deleteCollaborator(id);
    if (!success) return notFound('Collaborator');
    return ok({ success: true });
});
