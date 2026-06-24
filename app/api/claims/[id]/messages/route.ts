import { NextResponse } from 'next/server';
import { getMessages, addMessage } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    console.log(`[API] Fetching messages for claim: ${id}`);
    const messages = getMessages(id);
    return NextResponse.json(messages, {
        headers: {
            'Access-Control-Allow-Origin': '*',
        }
    });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const newMessage = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...body
        };
        addMessage(id, newMessage);
        return NextResponse.json(newMessage, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (e) {
        return NextResponse.json({ error: 'Data error' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
