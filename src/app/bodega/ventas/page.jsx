'use client';

import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatHora = (date) => new Date(date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const parseLocalDate = (dateString) => {
    const [year, month, day] = String(dateString).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDiaLabel = (dateString) => {
    const d = parseLocalDate(dateString);
    const label = d.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatCurrency = (amount) => new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
}).format(Number(amount) || 0);

const getUniqueValues = (items, selector) => (
    Array.from(
        new Set(
            (items || [])
                .map(selector)
                .map((value) => String(value ?? '').trim())
                .filter(Boolean)
        )
    )
);

function VentasListadoContent() {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtro, setFiltro] = useState("mes");
    const [fechaSeleccionada, setFechaSeleccionada] = useState(() => formatDate(new Date()));
    const [diasExpandidos, setDiasExpandidos] = useState(() => new Set());
    const [ventasExpandidas, setVentasExpandidas] = useState(() => new Set());

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const response = await axios.get('/api/ventas');
                setVentas(response.data);
            } catch (err) {
                setError("Error al cargar las ventas");
            } finally {
                setLoading(false);
            }
        };
        fetchVentas();
    }, []);

    const eliminarVenta = async (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta venta?\n\nEl stock de tienda NO se modificará.")) {
            return;
        }

        try {
            await axios.delete(`/api/ventas?id=${id}`);
            setVentas((prevVentas) => prevVentas.filter((venta) => venta._id !== id));
            setVentasExpandidas((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (err) {
            setError("Error al eliminar la venta");
            console.error(err);
        }
    };

    const ventasFiltradas = useMemo(() => {
        let filtradas = ventas;
        const fechaBase = parseLocalDate(fechaSeleccionada);

        if (filtro === "semana") {
            const inicioFiltro = new Date(fechaBase);
            inicioFiltro.setHours(0, 0, 0, 0);
            inicioFiltro.setDate(inicioFiltro.getDate() - 7);
            filtradas = ventas.filter((venta) => new Date(venta.fecha) >= inicioFiltro);
        } else if (filtro === "mes") {
            const inicioFiltro = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
            filtradas = ventas.filter((venta) => new Date(venta.fecha) >= inicioFiltro);
        } else if (filtro === "fecha") {
            filtradas = ventas.filter((venta) => formatDate(venta.fecha) === fechaSeleccionada);
        }

        return filtradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [ventas, filtro, fechaSeleccionada]);

    const ventasPorDia = useMemo(() => {
        const grupos = new Map();

        ventasFiltradas.forEach((venta) => {
            const dia = formatDate(venta.fecha);
            if (!grupos.has(dia)) {
                grupos.set(dia, []);
            }
            grupos.get(dia).push(venta);
        });

        return Array.from(grupos.entries())
            .sort(([diaA], [diaB]) => diaB.localeCompare(diaA))
            .map(([dia, ventasDia]) => ({
                dia,
                ventas: ventasDia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
                total: ventasDia.reduce((acc, venta) => acc + Number(venta.total || 0), 0),
            }));
    }, [ventasFiltradas]);

    const toggleDia = (dia) => {
        setDiasExpandidos((prev) => {
            const next = new Set(prev);
            if (next.has(dia)) {
                next.delete(dia);
            } else {
                next.add(dia);
            }
            return next;
        });
    };

    const toggleVenta = (id) => {
        setVentasExpandidas((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const totalVentas = ventasFiltradas.reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    if (loading) return <p className="text-center text-gray-500">Cargando ventas...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Listado de Ventas</h1>
            <div className="flex justify-between mb-4">
                <select
                    className="border border-gray-300 p-2 rounded"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                >
                    <option value="mes">Último mes</option>
                    <option value="semana">Última semana</option>
                    <option value="fecha">Fecha específica</option>
                </select>
                {filtro === "fecha" && (
                    <input
                        type="date"
                        className="border border-gray-300 p-2 rounded"
                        value={fechaSeleccionada}
                        onChange={(e) => setFechaSeleccionada(e.target.value)}
                    />
                )}
            </div>
            {ventasPorDia.length === 0 ? (
                <p className="text-center text-gray-500">Aún no hay ventas en este período.</p>
            ) : (
                <div className="grid gap-4">
                    {ventasPorDia.map(({ dia, ventas: ventasDia, total: totalDia }) => {
                        const diaExpandido = diasExpandidos.has(dia);

                        return (
                            <div key={dia} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleDia(dia)}
                                    className="w-full bg-gray-100 px-4 py-3 flex flex-wrap justify-between items-center gap-2 border-b hover:bg-gray-200 transition-colors text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-gray-500 transition-transform ${diaExpandido ? 'rotate-90' : ''}`}>▶</span>
                                        <span className="font-semibold text-gray-800">{formatDiaLabel(dia)}</span>
                                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                                            {ventasDia.length} venta(s)
                                        </span>
                                    </div>
                                    <span className="font-bold text-lg text-gray-900 whitespace-nowrap">
                                        {formatCurrency(totalDia)}
                                    </span>
                                </button>

                                {diaExpandido && (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-sm text-gray-600">
                                                <th className="px-4 py-2">Hora</th>
                                                <th className="px-4 py-2">Documento</th>
                                                <th className="px-4 py-2">Pago</th>
                                                <th className="px-4 py-2 text-right">Total</th>
                                                <th className="px-4 py-2 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ventasDia.map((venta) => {
                                                const metodosPago = getUniqueValues(venta.productos, (item) => item.tipoPago);
                                                const numerosBoleta = getUniqueValues(venta.productos, (item) => item.numeroBoleta);
                                                const tipoDocumento = venta.productos[0]?.tipoDocumento || 'boleta';
                                                const detalleExpandido = ventasExpandidas.has(venta._id);

                                                return (
                                                    <Fragment key={venta._id}>
                                                        <tr className="border-t border-gray-100 hover:bg-gray-50">
                                                            <td className="px-4 py-2 whitespace-nowrap">{formatHora(venta.fecha)}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap">
                                                                <span className="text-sm bg-blue-50 text-blue-800 px-2 py-0.5 rounded whitespace-nowrap">
                                                                    {tipoDocumento === 'factura' ? 'Factura' : 'Boleta'}: {numerosBoleta.length > 0 ? numerosBoleta.join(', ') : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap">
                                                                <span className="text-sm bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded whitespace-nowrap">
                                                                    Pago: {metodosPago.length > 0 ? metodosPago.join(', ') : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-right font-semibold whitespace-nowrap">
                                                                {formatCurrency(venta.total)}
                                                            </td>
                                                            <td className="px-4 py-2 whitespace-nowrap">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => toggleVenta(venta._id)}
                                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded transition-colors"
                                                                    >
                                                                        {detalleExpandido ? 'Ocultar detalle' : 'Ver detalle'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => eliminarVenta(venta._id)}
                                                                        className="bg-red-500 hover:bg-red-700 text-white text-sm px-3 py-1 rounded transition-colors"
                                                                        title="Eliminar venta"
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {detalleExpandido && (
                                                            <tr className="bg-gray-50/60">
                                                                <td colSpan={5} className="px-4 py-3">
                                                                    <ul className="divide-y divide-gray-100">
                                                                        {venta.productos.map((item, index) => (
                                                                            <li key={item._id || `${venta._id}-${item.producto?._id || item.codigo || index}`} className="flex items-center gap-3 py-2">
                                                                                <img
                                                                                    src={item.producto?.imagen || "/noimagen.png"}
                                                                                    alt={item.producto?.nombre || item.nombre}
                                                                                    className="w-10 h-10 object-cover rounded"
                                                                                />
                                                                                <div className="flex-1">
                                                                                    <span className="font-medium text-gray-800">
                                                                                        {item.producto ? item.producto.nombre : item.nombre} x{item.cantidad}
                                                                                    </span>
                                                                                    <span className="block text-xs text-gray-500">
                                                                                        Código: {item.codigo || item.producto?.codigo_de_barras || '-'} | Tipo venta: {item.tipoVenta === 'mayor' ? 'Por mayor' : 'Detalle'}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap">
                                                                                    {item.tipoPago || '-'}
                                                                                </span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="text-right mt-4 font-bold text-lg">
                Total de Ventas: {formatCurrency(totalVentas)}
            </div>
        </div>
    );
}

export default function VentasListadoPage() {
    return (
        <ProtectedRoute requireAdmin>
            <VentasListadoContent />
        </ProtectedRoute>
    );
}
