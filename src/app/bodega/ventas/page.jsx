'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import { apiVentas } from "@/endpoints/api";

// Función para formatear la fecha
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function VentasListado() {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtro, setFiltro] = useState("mes");
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const response = await axios.get(`${apiVentas}/ventas`);
                setVentas(response.data);
            } catch (err) {
                setError("Error al cargar las ventas");
            } finally {
                setLoading(false);
            }
        };
        fetchVentas();
    }, []);

    useEffect(() => {
        const filtrarVentas = () => {
            let filtradas = ventas;

            if (filtro === "semana") {
                const inicioFiltro = new Date(fechaSeleccionada);
                inicioFiltro.setDate(fechaSeleccionada.getDate() - 7);
                filtradas = ventas.filter(venta => new Date(venta.fecha) >= inicioFiltro);
            } else if (filtro === "mes") {
                const inicioFiltro = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
                filtradas = ventas.filter(venta => new Date(venta.fecha) >= inicioFiltro);
            } else if (filtro === "fecha") {
                const fechaInicio = new Date(fechaSeleccionada);
                fechaInicio.setHours(0, 0, 0, 0);
                const fechaFin = new Date(fechaSeleccionada);
                fechaFin.setHours(23, 59, 59, 999);
                filtradas = ventas.filter(venta => {
                    const fechaVenta = new Date(venta.fecha);
                    return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
                });
            }

            setVentasFiltradas(filtradas);
        };

        filtrarVentas();
    }, [ventas, filtro, fechaSeleccionada]);

    const totalVentas = ventasFiltradas.reduce((acc, venta) => acc + venta.total, 0);

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
                        value={formatDate(fechaSeleccionada)}
                        onChange={(e) => setFechaSeleccionada(new Date(e.target.value))}
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
                                <th className="py-2 px-4 border">Total</th>
                                <th className="py-2 px-4 border">Productos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasFiltradas.map((venta) => (
                                <tr key={venta._id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-4 border text-center">{formatDate(venta.fecha)}</td>
                                    <td className="py-2 px-4 border text-center">${venta.total.toFixed(0)}</td>
                                    <td className="py-2 px-4 border">
                                        <ul>
                                            {venta.productos.map((item) => (
                                                <li key={item._id} className="flex items-center gap-2 py-1">
                                                    {item.producto ? (
                                                        <>
                                                            <img 
                                                                src={item.producto.imagen || "/noimagen.png"} 
                                                                alt={item.producto.nombre} 
                                                                className="w-10 h-10 object-cover rounded" 
                                                            />
                                                            {item.producto.nombre} x{item.cantidad}
                                                        </>
                                                    ) : (
                                                        <span>{item.nombre} x{item.cantidad}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="text-right mt-4 font-bold text-lg">
                Total de Ventas: ${totalVentas.toFixed(0)}
            </div>
        </div>
    );
}