import { getSystemSettings, updateSystemSettings } from '@/lib/db';
import { ok, withErrorHandler } from '@/lib/api-helpers';

export const GET = withErrorHandler(async () => {
    return ok(getSystemSettings());
});

export const POST = withErrorHandler(async (request) => {
    const body = await request.json();
    return ok(updateSystemSettings(body));
});
