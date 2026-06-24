import { addRequest, getRequests } from '@/lib/db';
import { createRequestSchema, validateBody } from '@/lib/validation';
import { ok, created, badRequest, withErrorHandler } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
    return ok(getRequests());
});

export const POST = withErrorHandler(async (request) => {
    const body = await request.json();
    const validation = validateBody(createRequestSchema, body);
    if (!validation.success) return badRequest(validation.error);

    return created(addRequest(validation.data));
});
