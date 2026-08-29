"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useBodega } from "@/context/BodegaContext";

function ResumenInventarioContent() {
  const [fecha, setFecha] = useState(null);
  const {
    todosLosProductos,
    cargando,
    sincronizando,
    error,
    refrescarProductos,
    productosCargados,
  } = useBodega();

  useEffect(() => {
    if (!productosCargados) return;
    setFecha(new Date().toISOString());
  }, [productosCargados, todosLosProductos]);

  const resumen = useMemo(() => {
    const acumulado = {};

    todosLosProductos.forEach((producto) => {
      const tipo = producto.tipo_de_joya || 'SIN TIPO';
      const cantidad = 1;
      const precioBodega = parseFloat(producto.preferentes ?? producto.precio_bodega) || 0;

      if (!acumulado[tipo]) {
        acumulado[tipo] = { tipo, cantidad: 0, valorTotal: 0 };
      }

      acumulado[tipo].cantidad += cantidad;
      acumulado[tipo].valorTotal += precioBodega;
    });

    return Object.values(acumulado).sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [todosLosProductos]);

  const totales = useMemo(() => {
    return resumen.reduce((acc, item) => ({
      cantidadTotal: acc.cantidadTotal + item.cantidad,
      valorTotal: acc.valorTotal + item.valorTotal
    }), { cantidadTotal: 0, valorTotal: 0 });
  }, [resumen]);

  const cargarResumen = async () => {
    try {
      await refrescarProductos();
      setFecha(new Date().toISOString());
    } catch (refreshError) {
      console.error("Error al cargar resumen:", refreshError);
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Resumen de Inventario
          </h1>
          {fecha && (
            <p className="text-sm text-gray-500 mt-1">
              Actualizado: {formatearFecha(fecha)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargarResumen}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            disabled={cargando || sincronizando}
          >
            {cargando || sincronizando ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Actualizando...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualizar
              </>
            )}
          </button>
          <Link
            href="/bodega"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Volver a Bodega
          </Link>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide opacity-80">
                Cantidad Total
              </p>
              <p className="text-4xl font-bold mt-2">
                {totales.cantidadTotal.toLocaleString('es-CL')}
              </p>
              <p className="text-sm mt-1 opacity-80">Unidades</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide opacity-80">
                Valor Total
              </p>
              <p className="text-4xl font-bold mt-2">
                {formatearPrecio(totales.valorTotal)}
              </p>
              <p className="text-sm mt-1 opacity-80">Precio de Bodega</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de resumen */}
      {cargando && !productosCargados ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Cargando resumen de inventario...</p>
        </div>
      ) : resumen.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No hay productos en el inventario.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Tipo de Joya
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">
                    % del Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resumen.map((item, index) => {
                  const porcentaje = ((item.valorTotal / totales.valorTotal) * 100).toFixed(1);
                  return (
                    <tr
                      key={item.tipo}
                      className={`${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {item.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-900 font-medium">
                          {item.cantidad.toLocaleString('es-CL')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-900 font-medium">
                          {formatearPrecio(item.valorTotal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex-grow max-w-[100px] bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {porcentaje}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-800 text-white font-bold">
                <tr>
                  <td className="px-6 py-4 text-left uppercase">Total</td>
                  <td className="px-6 py-4 text-right">
                    {totales.cantidadTotal.toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatearPrecio(totales.valorTotal)}
                  </td>
                  <td className="px-6 py-4 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResumenInventarioPage() {
    return (
        <ProtectedRoute requireAdmin>
            <ResumenInventarioContent />
        </ProtectedRoute>
    );
}
