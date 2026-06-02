import { NextResponse } from 'next/server';

export async function GET(request) {
    const res = await fetch(process.env.API_VENTAS + '/ventas', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('authorization') || ''
        },
        cache: 'no-store'
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
