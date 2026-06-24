import { getUserProfile, updateUserProfile } from '@/lib/db';
import { updateUserProfileSchema, validateBody } from '@/lib/validation';
import { ok, badRequest, withErrorHandler } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
    return ok(getUserProfile());
});

export const POST = withErrorHandler(async (request) => {
    const body = await request.json();
    const validation = validateBody(updateUserProfileSchema, body);
    if (!validation.success) return badRequest(validation.error);

    const updated = updateUserProfile(validation.data);
    return ok(updated);
});
