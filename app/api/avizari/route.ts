import { getAvizari, createAvizare, getPolicies } from '@/lib/db';
import { createAvizareSchema, validateBody } from '@/lib/validation';
import { ok, created, badRequest, withErrorHandler, generateSequentialId, isPolicyExpired } from '@/lib/api-helpers';
import { Avizare } from '@/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
    return ok(getAvizari());
});

export const POST = withErrorHandler(async (request) => {
    const body = await request.json();
    const validation = validateBody(createAvizareSchema, body);
    if (!validation.success) return badRequest(validation.error);

    // Verify the policy exists and is not expired
    const policy = getPolicies().find(p => p.id === validation.data.policyId);
    if (!policy) {
        return badRequest(`Polița '${validation.data.policyId}' nu a fost găsită.`);
    }
    if (isPolicyExpired(policy)) {
        return NextResponse.json(
            { error: `Polița '${policy.id}' (${policy.holder}) este expirată din ${policy.expiry}. Nu se poate crea o avizare pe o poliță expirată.` },
            { status: 409 }
        );
    }

    // Use generateSequentialId for monotonically-increasing, collision-resistant IDs
    const existing = getAvizari();
    const newId = generateSequentialId('AVZ-', existing.map(a => a.id), 4);

    const newAvizare: Avizare = {
        id: newId,
        policyId: validation.data.policyId,
        holderName: validation.data.holderName,
        date: validation.data.date,
        time: validation.data.time ?? '',
        description: validation.data.description ?? '',
        status: 'Nou',
        createdAt: new Date().toISOString(),
        dataAvizare: validation.data.dataAvizare ?? new Date().toISOString().split('T')[0],
        ...(validation.data.cause ? { cause: validation.data.cause } : {}),
    } as any;

    return created(createAvizare(newAvizare));
});
