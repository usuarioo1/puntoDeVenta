import { NextResponse } from 'next/server';

async function authHeader(request) {
    return request.headers.get('authorization') || '';
}

export async function POST(request) {
    try {
        if (!process.env.API_VENTAS) {
            return NextResponse.json(
                { error: 'API_VENTAS no está configurado en las variables de entorno' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const res = await fetch(`${process.env.API_VENTAS}/registrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': await authHeader(request)
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error al registrar la venta desde el frontend:', error);
        return NextResponse.json(
            { error: 'No se pudo registrar la venta', detalles: error.message },
            { status: 500 }
        );
    }
}