import { getAllMessages } from '@/lib/db';
import { ok, withErrorHandler } from '@/lib/api-helpers';

export const GET = withErrorHandler(async () => {
    return ok(getAllMessages());
});
