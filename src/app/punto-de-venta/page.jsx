'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import { useCarrito } from "@/context/CarritoContext";

export default function Venta() {
    const { carrito, vaciarCarrito, agregarAlCarrito } = useCarrito();
    const [codigoBarras, setCodigoBarras] = useState("");
    const [ventaIniciada, setVentaIniciada] = useState(false);
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        const res = await axios.get("http://localhost:4000/productosPuntoDeVenta");
        setProductos(res.data.productos);
    };

    const iniciarVenta = () => {
        setVentaIniciada(true);
        vaciarCarrito();
    };

    const agregarAlCarritoHandler = () => {
        if (!Array.isArray(productos)) {
            console.error("productos no es un array");
            return;
        }
        const producto = productos.find((p) => p.codigo_de_barras === codigoBarras);
        if (producto) {
            agregarAlCarrito(producto);
            setCodigoBarras("");
        } else {
            alert("Producto no encontrado");
        }
    };

    const confirmarVenta = async () => {
        let total = carrito.reduce((sum, item) => sum + item.costo * item.cantidad, 0);

        for (let item of carrito) {
            await axios.put(`http://localhost:4000/productosPuntoDeVenta/${item._id}/reduceStock`, { cantidad: item.cantidad });
        }

        await axios.post("http://localhost:4000/registrar", { 
            productos: carrito.map(item => ({ producto: item._id, cantidad: item.cantidad })), 
            total 
        });

        alert("Venta realizada con éxito");
        vaciarCarrito();
        setVentaIniciada(false);
        cargarProductos();
    };

    // Calcular totales
    const totalTarifaPublica = carrito.reduce((sum, item) => sum + item.tarifa_publica * item.cantidad, 0);
    const totalMayorista = carrito.reduce((sum, item) => sum + item.mayorista * item.cantidad, 0);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Punto de Venta</h1>
            {!ventaIniciada ? (
                <button onClick={iniciarVenta} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                    Iniciar Venta
                </button>
            ) : (
                <>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Escanear código de barras"
                            value={codigoBarras}
                            onChange={(e) => setCodigoBarras(e.target.value)}
                            className="border p-2 mr-2"
                        />
                        <button onClick={agregarAlCarritoHandler} className="bg-blue-500 text-white px-4 py-2">
                            Agregar
                        </button>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Carrito</h2>
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border">Imagen</th>
                                <th className="py-2 px-4 border">Descripción</th>
                                <th className="py-2 px-4 border">Cantidad</th>
                                <th className="py-2 px-4 border">Tarifa Pública</th>
                                <th className="py-2 px-4 border">Mayorista</th>
                            </tr>
                        </thead>
                        <tbody>
                            {carrito.map((item, index) => (
                                <tr key={index} className="border">
                                    <td className="py-2 px-4 border">
                                        <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover" />
                                    </td>
                                    <td className="py-2 px-4 border">{item.nombre}</td>
                                    <td className="py-2 px-4 border">{item.cantidad}</td>
                                    <td className="py-2 px-4 border">${item.tarifa_publica.toFixed(2)}</td>
                                    <td className="py-2 px-4 border">${item.mayorista.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Tabla de totales */}
                    <h2 className="text-xl font-bold mt-6">Totales</h2>
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border">Total Tarifa Pública</th>
                                <th className="py-2 px-4 border">Total Mayorista</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-2 px-4 border text-center">${totalTarifaPublica.toFixed(2)}</td>
                                <td className="py-2 px-4 border text-center">${totalMayorista.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <button onClick={confirmarVenta} className="bg-green-500 text-white px-4 py-2 mt-4">
                        Confirmar Venta
                    </button>
                </>
            )}
        </div>
    );
}
