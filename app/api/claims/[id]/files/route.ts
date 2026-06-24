
import { NextResponse } from 'next/server';
import { getClaims, updateClaim } from '@/lib/db';


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const claims = getClaims();
    const claim = claims.find((c: any) => c.id === id);

    if (!claim) {
        return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(claim.files || []);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const category = formData.get('category') as string || 'document';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const claims = getClaims();
        const claim = claims.find((c: any) => c.id === id);

        if (!claim) {
            console.error("POST files: Claim not found:", id);
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        // Read file into base64 data URL for storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        const fileData = {
            name: file.name,
            type: file.type,
            content: dataUrl,
            category: category as 'photo' | 'document' | 'estimate' | 'other',
            uploadedAt: new Date().toISOString(),
            fileId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        };

        const currentFiles = claim.files || [];
        const newFiles = [...currentFiles, fileData];

        const updated = updateClaim(id, { files: newFiles });
        console.log(`POST files: Successfully added file "${file.name}" (${(buffer.length / 1024).toFixed(1)}KB) to claim ${id}. Total files: ${newFiles.length}`);

        return NextResponse.json(updated);
    } catch (e) {
        console.error("POST files error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json(); // Expect { fileId?: string, name: string, category?: string }

        const claims = getClaims();
        const claim = claims.find((c: any) => c.id === id);

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        const currentFiles = claim.files || [];
        let newFiles;

        if (body.fileId) {
            // Best case: delete by unique fileId
            newFiles = currentFiles.filter((f: any) => f.fileId !== body.fileId);
        } else if (body.category) {
            // Fallback: delete by name + category (removes only the match in that category)
            let removed = false;
            newFiles = currentFiles.filter((f: any) => {
                if (!removed && f.name === body.name && f.category === body.category) {
                    removed = true;
                    return false;
                }
                return true;
            });
        } else {
            // Legacy: delete first occurrence by name only
            let removed = false;
            newFiles = currentFiles.filter((f: any) => {
                if (!removed && f.name === body.name) {
                    removed = true;
                    return false;
                }
                return true;
            });
        }

        const updated = updateClaim(id, { files: newFiles });

        return NextResponse.json(updated);
    } catch (e) {
        console.error("DELETE files error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
