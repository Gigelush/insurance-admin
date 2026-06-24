import { NextResponse } from 'next/server';
import { getAvizari, updateAvizare, createClaim, getPolicies, getClaims } from '@/lib/db';
import { Avizare, Policy, Claim } from '@/types';

/**
 * POST /api/avizari/[id]/convert
 * Atomically converts an avizare into a dosar (claim).
 * Returns 409 if the avizare was already converted.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 1. Find the avizare
    const avizari = getAvizari();
    const avizare = avizari.find((a: Avizare) => a.id === id);

    if (!avizare) {
        return NextResponse.json({ error: 'Avizarea nu a fost găsită.' }, { status: 404 });
    }

    // 2. Guard: prevent duplicate conversion
    if (avizare.claimId) {
        return NextResponse.json(
            { error: 'Această avizare a fost deja transformată în dosar.', claimId: avizare.claimId },
            { status: 409 }
        );
    }

    // 3. Determine county code for claim ID generation
    const policies = getPolicies();
    const policy = policies.find((p: any) => p.id === avizare.policyId);

    // Strip Romanian diacritics for reliable matching
    const stripDiacritics = (str: string) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ț/gi, 't').replace(/ș/gi, 's').replace(/Ț/g, 'T').replace(/Ș/g, 'S');

    const COUNTY_CODES: Record<string, string> = {
        "Alba": "AB", "Arad": "AR", "Arges": "AG", "Bacau": "BC", "Bihor": "BH",
        "Bistrita-Nasaud": "BN", "Botosani": "BT", "Braila": "BR", "Brasov": "BV",
        "Bucuresti": "B", "Buzau": "BZ", "Calarasi": "CL", "Caras-Severin": "CS", "Cluj": "CJ",
        "Constanta": "CT", "Covasna": "CV", "Dambovita": "DB", "Dolj": "DJ",
        "Galati": "GL", "Giurgiu": "GR", "Gorj": "GJ", "Harghita": "HR",
        "Hunedoara": "HD", "Ialomita": "IL", "Iasi": "IS", "Ilfov": "IF",
        "Maramures": "MM", "Mehedinti": "MH", "Mures": "MS", "Neamt": "NT",
        "Olt": "OT", "Prahova": "PH", "Salaj": "SJ", "Satu Mare": "SM",
        "Sibiu": "SB", "Suceava": "SV", "Teleorman": "TR", "Timis": "TM",
        "Tulcea": "TL", "Valcea": "VL", "Vaslui": "VS", "Vrancea": "VN"
    };

    let countyCode = "XX";
    if (policy) {
        const loc = stripDiacritics((policy as any).details?.localitate || (policy as any).address || "").toLowerCase();
        for (const [name, code] of Object.entries(COUNTY_CODES)) {
            if (loc.includes(name.toLowerCase())) { countyCode = code; break; }
        }
    }

    // 4. Generate claim ID
    const claims = getClaims();
    const prefix = `NN-${countyCode}-99-`;
    const existingSequences = claims
        .filter((c: any) => c.id?.startsWith(prefix))
        .map((c: any) => parseInt(c.id.replace(prefix, ""), 10))
        .filter((n: number) => !isNaN(n));
    const maxSeq = existingSequences.length > 0 ? Math.max(...existingSequences) : 0;
    const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
    const claimId = `${prefix}${nextSeq}`;

    // 5. Create the claim
    const newClaim = createClaim({
        id: claimId,
        avizareId: avizare.id,
        policyId: avizare.policyId,
        holderName: avizare.holderName,
        date: avizare.date,
        time: avizare.time,
        description: avizare.description,
        dataAvizare: avizare.dataAvizare || '',
        status: "Deschis",
        submittedAt: new Date().toISOString(),
        reserve: {
            materials: '3000',
            contractor: '500',
            other: '0',
            legal: '0',
            total: '3500',
        },
        history: [
            { date: new Date().toISOString(), event: 'Dosar creat din avizare', details: `Avizare: #${avizare.id}`, user: 'System' },
            { date: new Date().toISOString(), event: 'Rezerva Initiala', details: 'Setat automat: 3000/500/0/0 RON', user: 'System' },
        ],
    } as any);

    // 6. Link the avizare to the claim
    updateAvizare(id, { status: 'In Lucru', claimId: newClaim.id });

    return NextResponse.json({ success: true, claim: newClaim });
}
