import { NextResponse } from 'next/server';

async function authHeader(request) {
    return request.headers.get('authorization') || '';
}

export async function GET(request) {
    try {
        if (!process.env.API_VENTAS) {
            return NextResponse.json(
                { error: 'API_VENTAS no está configurado en las variables de entorno' },
                { status: 500 }
            );
        }
        const requestUrl = new URL(request.url);
        const query = requestUrl.searchParams.toString();
        const url = process.env.API_VENTAS + '/productosPuntoDeVenta' + (query ? `?${query}` : '');
        const res = await fetch(url, {
            headers: {
                'Accept-Encoding': 'gzip',
                'Authorization': await authHeader(request)
            },
            cache: 'no-store'
        });
        if (!res.ok) {
            const body = await res.text();
            return NextResponse.json(
                { error: `Backend ${res.status}`, body, url },
                { status: res.status }
            );
        }
        const headers = new Headers();
        headers.set('Content-Type', res.headers.get('content-type') || 'application/json');
        // undici ya descomprimio el body (aunque conserve el header content-encoding),
        // por lo que el stream que llega al navegador es JSON plano.
        return new NextResponse(res.body, { status: res.status, headers });
    } catch (error) {
        console.error('Error al conectar con el backend:', error);
        return NextResponse.json(
            { error: 'No se pudo conectar con el servidor backend', detalles: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    if (!process.env.API_VENTAS) {
        return NextResponse.json(
            { error: 'API_VENTAS no está configurado en las variables de entorno' },
            { status: 500 }
        );
    }
    const res = await fetch(`${process.env.API_VENTAS}/productosPuntoDeVenta/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': await authHeader(request)
        },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
