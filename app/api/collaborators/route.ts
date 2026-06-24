import { getCollaborators, addCollaborator } from '@/lib/db';
import { createCollaboratorSchema, validateBody } from '@/lib/validation';
import { ok, created, badRequest, withErrorHandler } from '@/lib/api-helpers';

export const GET = withErrorHandler(async () => {
    return ok(getCollaborators());
});

export const POST = withErrorHandler(async (request) => {
    const body = await request.json();
    const validation = validateBody(createCollaboratorSchema, body);
    if (!validation.success) return badRequest(validation.error);

    return created(addCollaborator(validation.data));
});
