import { getPolicies, deletePolicy, updatePolicy } from '@/lib/db';
import { updatePolicySchema, validateBody } from '@/lib/validation';
import { ok, badRequest, notFound, withErrorHandler } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req, { params }: Ctx) => {
    const { id } = await params;
    const policy = getPolicies().find(p => p.id === id);
    if (!policy) return notFound('Policy');
    return ok(policy);
});

export const PUT = withErrorHandler(async (request, { params }: Ctx) => {
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(updatePolicySchema, body);
    if (!validation.success) return badRequest(validation.error);

    const updated = updatePolicy(id, body);
    if (!updated) return notFound('Policy');
    return ok(updated);
});

export const DELETE = withErrorHandler(async (_req, { params }: Ctx) => {
    const { id } = await params;
    const deleted = deletePolicy(id);
    if (!deleted) return notFound('Policy');
    return ok({ success: true });
});
