import { removeRequest } from '@/lib/db';
import { ok, withErrorHandler } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withErrorHandler(async (_req, { params }: Ctx) => {
    const { id } = await params;
    removeRequest(id);
    return ok({ success: true });
});
