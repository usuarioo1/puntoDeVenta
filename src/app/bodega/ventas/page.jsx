'use client';

import { useEffect, useState } from "react";
import axios from "axios";

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
                const response = await axios.get("http://localhost:4000/ventas");
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
            let inicioFiltro;
            if (filtro === "semana") {
                inicioFiltro = new Date(fechaSeleccionada);
                inicioFiltro.setDate(fechaSeleccionada.getDate() - 7);
            } else if (filtro === "mes") {
                inicioFiltro = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
            } else {
                inicioFiltro = fechaSeleccionada;
            }
            
            const filtradas = ventas.filter(venta => new Date(venta.fecha) >= inicioFiltro);
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
                        value={fechaSeleccionada.toISOString().split('T')[0]}
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
                                <th className="py-2 px-4 border flex">Productos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasFiltradas.map((venta) => (
                                <tr key={venta._id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-4 border text-center">{new Date(venta.fecha).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 border text-center">${venta.total.toFixed(0)}</td>
                                    <td className="py-2 px-4 border">
                                        <ul>
                                            {venta.productos.map((item) => (
                                                <li key={item._id} className="flex items-center gap-2 py-1">
                                                    <img src={item.producto.imagen} alt={item.producto.nombre} className="w-10 h-10 object-cover rounded" />
                                                    {item.producto.nombre} x{item.cantidad}
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
