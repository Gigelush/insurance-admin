import { getClaims, createClaim, getPolicies } from '@/lib/db';
import { Policy } from '@/types';
import { createClaimSchema, validateBody } from '@/lib/validation';
import { ok, created, badRequest, withErrorHandler, generateSequentialId, isPolicyExpired } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── County code lookup table ───────────────────────────────────────────────

const COUNTY_CODES: Record<string, string> = {
    "Alba": "AB", "Arad": "AR", "Argeș": "AG", "Bacău": "BC", "Bihor": "BH",
    "Bistrița-Năsăud": "BN", "Botoșani": "BT", "Brăila": "BR", "Brașov": "BV",
    "București": "B", "București - Sector 1": "B", "București - Sector 2": "B",
    "București - Sector 3": "B", "București - Sector 4": "B",
    "București - Sector 5": "B", "București - Sector 6": "B",
    "Buzău": "BZ", "Călărași": "CL", "Caraș-Severin": "CS", "Cluj": "CJ",
    "Constanța": "CT", "Covasna": "CV", "Dâmbovița": "DB", "Dolj": "DJ",
    "Galați": "GL", "Giurgiu": "GR", "Gorj": "GJ", "Harghita": "HR",
    "Hunedoara": "HD", "Ialomița": "IL", "Iași": "IS", "Ilfov": "IF",
    "Maramureș": "MM", "Mehedinți": "MH", "Mureș": "MS", "Neamț": "NT",
    "Olt": "OT", "Prahova": "PH", "Sălaj": "SJ", "Satu Mare": "SM",
    "Sibiu": "SB", "Suceava": "SV", "Teleorman": "TR", "Timiș": "TM",
    "Tulcea": "TL", "Vâlcea": "VL", "Vaslui": "VS", "Vrancea": "VN",
};

function getCountyCode(address: string, localitate?: string): string {
    for (const [name, code] of Object.entries(COUNTY_CODES)) {
        if (address.includes(name) || localitate === name) return code;
    }
    return "XX";
}

/** Strip base64 file content for list responses — large payloads stay server-side */
function stripFileContent(claim: any) {
    if (!claim.files?.length) return claim;
    return {
        ...claim,
        files: claim.files.map(({ name, type, category, fileId, uploadedAt }: any) => ({
            name, type, category, fileId, uploadedAt,
        })),
    };
}

// ─── Route handlers ─────────────────────────────────────────────────────────

export const GET = withErrorHandler(async () => {
    return ok(getClaims().map(stripFileContent));
});

export const POST = withErrorHandler(async (request) => {
    const body = await request.json();
    const validation = validateBody(createClaimSchema, body);
    if (!validation.success) return badRequest(validation.error);

    const data = validation.data;

    // Resolve county code from linked policy and verify it's not expired
    const policy = getPolicies().find((p: Policy) => p.id === data.policyId);

    if (!policy) {
        return badRequest(`Polița '${data.policyId}' nu a fost găsită.`);
    }
    if (isPolicyExpired(policy)) {
        return NextResponse.json(
            { error: `Polița '${policy.id}' (${policy.holder}) este expirată din ${policy.expiry}. Nu se poate crea un dosar nou pe o poliță expirată.` },
            { status: 409 }
        );
    }
    const countyCode = policy
        ? getCountyCode(policy.address || '', policy.details?.localitate || policy.address)
        : 'XX';

    // Use provided ID or generate a sequential one
    const newId = data.id ?? generateSequentialId(
        `NN-${countyCode}-99-`,
        getClaims().map(c => c.id),
        4
    );

    const now = new Date().toISOString();
    const newClaim = {
        id: newId,
        ...data,
        status: data.status ?? 'Deschis',
        submittedAt: data.submittedAt ?? now,
        reserve: {
            materials: '3000',
            contractor: '500',
            other: '0',
            legal: '0',
            total: '3500',
            status: 'Preliminară',
        },
        history: [
            { date: now, event: 'Dosar creat', details: 'Inițializare automată', user: 'System' },
            { date: now, event: 'Rezervă Inițială', details: 'Setat automat: 3000/500/0/0 RON', user: 'System' },
        ],
    };

    return created(createClaim(newClaim));
});
