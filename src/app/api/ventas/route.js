import { NextResponse } from 'next/server';

async function authHeader(request) {
    return request.headers.get('authorization') || '';
}

export async function GET(request) {
    const res = await fetch(process.env.API_VENTAS + '/ventas', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': await authHeader(request)
        },
        cache: 'no-store'
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        const res = await fetch(`${process.env.API_VENTAS}/ventas/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': await authHeader(request)
            },
            cache: 'no-store'
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error al eliminar la venta desde el frontend:', error);
        return NextResponse.json(
            { error: 'No se pudo eliminar la venta', detalles: error.message },
            { status: 500 }
        );
    }
}
