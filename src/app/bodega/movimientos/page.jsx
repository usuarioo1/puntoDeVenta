'use client';

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import ProtectedRoute from "@/components/ProtectedRoute";

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateTime = (date) => `${formatDate(date)} ${new Date(date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;

const parseLocalDate = (dateString) => {
    const [year, month, day] = String(dateString).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const ETIQUETA_TIPO = {
    traslado: 'Traslado',
    abastecer: 'Abastecer Tienda',
};

const BADGE_TIPO = {
    traslado: 'bg-purple-100 text-purple-800',
    abastecer: 'bg-emerald-100 text-emerald-800',
};

const generarImagenCodigoBarras = (codigo) => {
    if (!codigo || typeof codigo !== "string") return "";
    const canvas = document.createElement('canvas');
    try {
        JsBarcode(canvas, codigo, { format: "CODE128", width: 2, height: 40 });
        return canvas.toDataURL();
    } catch (error) {
        console.error("Error al generar código de barras:", error);
        return "";
    }
};

// Exporta el PDF del movimiento con el mismo formato que el de /bodega/traslado
const exportarMovimientoPDF = (movimiento) => {
    const doc = new jsPDF();

    const tituloPDF = movimiento.tipo === 'abastecer'
        ? 'Detalle de Productos que salen de bodega hacia tienda'
        : 'Detalle de Productos que salen de bodega';

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(tituloPDF, 10, 15);

    let y = 25;

    const destino = String(movimiento.destino || '').trim();
    if (destino) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Destino: ${destino}`, 10, y);
        y += 10;
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${formatDateTime(movimiento.fecha)}`, 10, y);
    y += 10;

    doc.setDrawColor(200);
    doc.line(10, y, 200, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");

    doc.text("Cantidad", 10, y);
    doc.text("Nombre", 30, y);
    doc.text("Precio por Mayor", 95, y);
    doc.text("Código de Barras", 155, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);

    (movimiento.productos || []).forEach((producto) => {
        doc.text(String(producto.cantidad), 10, y);
        doc.text(producto.nombre || '-', 30, y, { maxWidth: 60 });
        doc.text(
            producto.mayorista != null ? `$${producto.mayorista}` : '-',
            95,
            y
        );

        const codigoBarras = generarImagenCodigoBarras(producto.codigo_de_barras);
        if (codigoBarras) {
            doc.addImage(codigoBarras, "PNG", 155, y - 5, 30, 15);
        }

        y += 15;

        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total de productos: ${movimiento.productos?.length || 0}`, 10, y);
    doc.text(
        `Total de unidades: ${(movimiento.productos || []).reduce((total, p) => total + (Number(p.cantidad) || 0), 0)}`,
        10,
        y + 10
    );

    const slugDestino = destino
        ? `_${destino.replace(/[^a-zA-Z0-9]/g, '_')}`
        : '';
    doc.save(`movimiento_${movimiento.tipo}${slugDestino}_${formatDate(movimiento.fecha)}.pdf`);
};

function MovimientosListadoContent() {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [filtro, setFiltro] = useState("mes");
    const [fechaSeleccionada, setFechaSeleccionada] = useState(() => formatDate(new Date()));

    useEffect(() => {
        const fetchMovimientos = async () => {
            try {
                const response = await axios.get('/api/movimientosBodega');
                setMovimientos(response.data);
            } catch (err) {
                setError("Error al cargar los movimientos de bodega");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMovimientos();
    }, []);

    const movimientosFiltrados = useMemo(() => {
        let filtrados = movimientos;

        if (filtroTipo !== 'todos') {
            filtrados = filtrados.filter((m) => m.tipo === filtroTipo);
        }

        const fechaBase = parseLocalDate(fechaSeleccionada);

        if (filtro === "semana") {
            const inicioFiltro = new Date(fechaBase);
            inicioFiltro.setHours(0, 0, 0, 0);
            inicioFiltro.setDate(inicioFiltro.getDate() - 7);
            filtrados = filtrados.filter((m) => new Date(m.fecha) >= inicioFiltro);
        } else if (filtro === "mes") {
            const inicioFiltro = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
            filtrados = filtrados.filter((m) => new Date(m.fecha) >= inicioFiltro);
        } else if (filtro === "fecha") {
            filtrados = filtrados.filter((m) => formatDate(m.fecha) === fechaSeleccionada);
        }

        return filtrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [movimientos, filtroTipo, filtro, fechaSeleccionada]);

    const totalUnidades = movimientosFiltrados.reduce(
        (total, m) => total + (m.productos || []).reduce((suma, p) => suma + (Number(p.cantidad) || 0), 0),
        0
    );

    if (loading) return <p className="text-center text-gray-500">Cargando movimientos...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Historial de Movimientos de Bodega</h1>

            <div className="flex flex-wrap justify-between gap-2 mb-4">
                <select
                    className="border border-gray-300 p-2 rounded"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                >
                    <option value="todos">Todos los tipos</option>
                    <option value="traslado">Traslado</option>
                    <option value="abastecer">Abastecer Tienda</option>
                </select>
                <select
                    className="border border-gray-300 p-2 rounded"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                >
                    <option value="mes">Último mes</option>
                    <option value="semana">Última semana</option>
                    <option value="fecha">Fecha específica</option>
                    <option value="todo">Todo el historial</option>
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

            {movimientosFiltrados.length === 0 ? (
                <p className="text-center text-gray-500">No hay movimientos registrados en este período.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-4 text-left">Fecha</th>
                                <th className="py-3 px-4 text-left">Tipo</th>
                                <th className="py-3 px-4 text-left">Destino</th>
                                <th className="py-3 px-4 text-left">Usuario</th>
                                <th className="py-3 px-4 text-left">Productos</th>
                                <th className="py-3 px-4 text-left">Unidades</th>
                                <th className="py-3 px-4 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {movimientosFiltrados.map((movimiento) => (
                                <tr key={movimiento._id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-4 whitespace-nowrap">{formatDateTime(movimiento.fecha)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${BADGE_TIPO[movimiento.tipo] || 'bg-gray-100 text-gray-700'}`}>
                                            {ETIQUETA_TIPO[movimiento.tipo] || movimiento.tipo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{movimiento.destino || '-'}</td>
                                    <td className="py-3 px-4">{movimiento.usuario || '-'}</td>
                                    <td className="py-3 px-4">{movimiento.totalProductos ?? movimiento.productos?.length ?? 0}</td>
                                    <td className="py-3 px-4">{movimiento.totalUnidades ?? 0}</td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => exportarMovimientoPDF(movimiento)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-700 transition"
                                        >
                                            Exportar PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="text-right mt-4 font-bold text-lg">
                Total de unidades movidas: {totalUnidades}
            </div>
        </div>
    );
}

export default function MovimientosListadoPage() {
    return (
        <ProtectedRoute requireAdmin>
            <MovimientosListadoContent />
        </ProtectedRoute>
    );
}
