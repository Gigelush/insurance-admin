import { getPolicies, addPolicy } from '@/lib/db';
import { createPolicySchema, validateBody } from '@/lib/validation';
import { ok, created, badRequest, withErrorHandler, generateSequentialId } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
    return ok(getPolicies());
});

export const POST = withErrorHandler(async (request) => {
    const body = await request.json();
    const validation = validateBody(createPolicySchema, body);
    if (!validation.success) return badRequest(validation.error);

    const currentYear = new Date().getFullYear();
    const prefix = `NN-8-${currentYear}-`;
    const existingIds = getPolicies().map(p => p.id);
    const newId = generateSequentialId(prefix, existingIds, 4);

    const newPolicy = { ...validation.data, id: newId, status: (validation.data.status ?? 'Active') as 'Active' };
    addPolicy(newPolicy);
    return created(newPolicy);
});
