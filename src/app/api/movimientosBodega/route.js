import { NextResponse } from 'next/server';

async function authHeader(request) {
    return request.headers.get('authorization') || '';
}

const urlBackend = `${process.env.API_VENTAS}/productosPuntoDeVenta/movimientos`;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const url = new URL(urlBackend);
        const tipo = searchParams.get('tipo');
        const desde = searchParams.get('desde');
        if (tipo) url.searchParams.set('tipo', tipo);
        if (desde) url.searchParams.set('desde', desde);

        const res = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': await authHeader(request)
            },
            cache: 'no-store'
        });

        const texto = await res.text();
        let data;
        try {
            data = JSON.parse(texto);
        } catch {
            data = {
                error: 'El backend respondió con un formato inesperado',
                detalles: texto?.slice(0, 300) || 'Respuesta vacía'
            };
        }
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error al obtener movimientos de bodega desde el frontend:', error);
        return NextResponse.json(
            { error: 'No se pudieron cargar los movimientos de bodega', detalles: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const res = await fetch(urlBackend, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': await authHeader(request)
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        const texto = await res.text();
        let data;
        try {
            data = JSON.parse(texto);
        } catch {
            data = {
                error: 'El backend respondió con un formato inesperado',
                detalles: texto?.slice(0, 300) || 'Respuesta vacía'
            };
        }
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error al registrar movimiento de bodega desde el frontend:', error);
        return NextResponse.json(
            { error: 'No se pudo registrar el movimiento de bodega', detalles: error.message },
            { status: 500 }
        );
    }
}
