import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(process.env.API_VENTAS + '/productosPuntoDeVenta', {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }
  const res = await fetch(`${process.env.API_VENTAS}/productosPuntoDeVenta/${id}` , {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
