import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const res = await fetch(process.env.API_VENTAS + '/productosPuntoDeVenta', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('authorization') || ''
            },
            cache: 'no-store'
        });
        const data = await res.json();
        const productos = data.productos || [];

        const resumen = {};
        productos.forEach(producto => {
            const tipo = producto.tipo_de_joya || 'SIN TIPO';
            const cantidad = 1;
            const precioBodega = parseFloat(producto.precio_bodega) || 0;
            if (!resumen[tipo]) resumen[tipo] = { tipo, cantidad: 0, valorTotal: 0 };
            resumen[tipo].cantidad += cantidad;
            resumen[tipo].valorTotal += precioBodega;
        });

        const resumenArray = Object.values(resumen).sort((a, b) => a.tipo.localeCompare(b.tipo));
        const totales = resumenArray.reduce((acc, item) => ({
            cantidadTotal: acc.cantidadTotal + item.cantidad,
            valorTotal: acc.valorTotal + item.valorTotal
        }), { cantidadTotal: 0, valorTotal: 0 });

        return NextResponse.json({
            resumen: resumenArray,
            totales,
            fecha: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error al generar resumen de inventario:', error);
        return NextResponse.json({ error: 'Error al generar resumen de inventario' }, { status: 500 });
    }
}
