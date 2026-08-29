'use client';

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";

const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateString) => {
    const [year, month, day] = String(dateString).split('-').map(Number);
    return new Date(year, month - 1, day);
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

        return filtradas;
    }, [ventas, filtro, fechaSeleccionada]);

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
            {ventasFiltradas.length === 0 ? (
                <p className="text-center text-gray-500">Aún no hay ventas en este período.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="py-2 px-4 border">Fecha</th>
                                <th className="py-2 px-4 border">Código producto</th>
                                <th className="py-2 px-4 border">Método de pago</th>
                                <th className="py-2 px-4 border">Número de boleta</th>
                                <th className="py-2 px-4 border">Monto total</th>
                                <th className="py-2 px-4 border">Productos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasFiltradas.map((venta) => {
                                const codigos = getUniqueValues(venta.productos, (item) => item.codigo || item.producto?.codigo_de_barras);
                                const metodosPago = getUniqueValues(venta.productos, (item) => item.tipoPago);
                                const numerosBoleta = getUniqueValues(venta.productos, (item) => item.numeroBoleta);

                                return (
                                <tr key={venta._id} className="border-b hover:bg-gray-50 align-top">
                                    <td className="py-2 px-4 border text-center whitespace-nowrap">{formatDate(venta.fecha)}</td>
                                    <td className="py-2 px-4 border text-sm">
                                        {codigos.length > 0 ? codigos.join(', ') : 'Sin código'}
                                    </td>
                                    <td className="py-2 px-4 border text-center whitespace-nowrap">
                                        {metodosPago.length > 0 ? metodosPago.join(', ') : '-'}
                                    </td>
                                    <td className="py-2 px-4 border text-center whitespace-nowrap">
                                        {numerosBoleta.length > 0 ? numerosBoleta.join(', ') : '-'}
                                    </td>
                                    <td className="py-2 px-4 border text-center whitespace-nowrap">{formatCurrency(venta.total)}</td>
                                    <td className="py-2 px-4 border">
                                        <ul>
                                            {venta.productos.map((item, index) => (
                                                <li key={item._id || `${venta._id}-${item.producto?._id || item.codigo || index}`} className="flex items-center gap-2 py-1">
                                                    {item.producto ? (
                                                        <>
                                                            <img 
                                                                src={item.producto.imagen || "/noimagen.png"} 
                                                                alt={item.producto.nombre} 
                                                                className="w-10 h-10 object-cover rounded" 
                                                            />
                                                            <span>
                                                                {item.producto.nombre} x{item.cantidad}
                                                                <span className="block text-xs text-gray-500">Código: {item.codigo || item.producto.codigo_de_barras || '-'}</span>
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span>
                                                            {item.nombre} x{item.cantidad}
                                                            <span className="block text-xs text-gray-500">Código: {item.codigo || '-'}</span>
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
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