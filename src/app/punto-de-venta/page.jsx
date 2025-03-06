'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import { useCarrito } from "@/context/CarritoContext";

export default function Venta() {
    const { carrito, vaciarCarrito, agregarAlCarrito, eliminarDelCarrito } = useCarrito();
    const [codigoBarras, setCodigoBarras] = useState("");
    const [ventaIniciada, setVentaIniciada] = useState(false);
    const [productos, setProductos] = useState([]);

    // Estados para los nuevos campos
    const [tipoVenta, setTipoVenta] = useState("mayor"); // Valor por defecto
    const [tipoPago, setTipoPago] = useState("efectivo"); // Valor por defecto
    const [numeroBoleta, setNumeroBoleta] = useState("");

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
        let total = carrito.reduce((sum, item) => sum + item.tarifa_publica * item.cantidad, 0);

        await axios.post("http://localhost:4000/registrar", {
            productos: carrito.map(item => ({
                producto: item._id,
                cantidad: item.cantidad,
                nombre: item.nombre,   // Enviar el nombre
                codigo: item.codigo_de_barras, // Enviar el código
                tipoVenta: tipoVenta, // Enviar el tipo de venta
                tipoPago: tipoPago,   // Enviar el tipo de pago
                numeroBoleta: numeroBoleta // Enviar el número de boleta
            })),
            total
        });

        alert("Venta realizada con éxito");
        vaciarCarrito();
        setVentaIniciada(false);
        cargarProductos();
    };

    useEffect(() => {
        let buffer = "";
        let timeout = null;
    
        const handleKeyPress = (e) => {
            if (timeout) clearTimeout(timeout);
    
            if (e.key.length === 1) {
                buffer += e.key;
            }
    
            if (e.key === "Enter") {
                setCodigoBarras(buffer);
                agregarAlCarritoHandler();
                buffer = "";
            }
    
            timeout = setTimeout(() => (buffer = ""), 300);
        };
    
        window.addEventListener("keydown", handleKeyPress);
    
        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            if (timeout) clearTimeout(timeout);
        };
    }, [productos]);
    
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
                                <th className="py-2 px-4 border">Acciones</th>
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
                                    <td className="py-2 px-4 border">${item.tarifa_publica.toFixed(0)}</td>
                                    <td className="py-2 px-4 border">${item.mayorista.toFixed(0)}</td>
                                    <td className="py-2 px-4 border">
                                        <button 
                                            onClick={() => eliminarDelCarrito(item._id)} 
                                            className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

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

                    <div className="container mx-auto p-4 flex flex-col">
                        <label htmlFor="tipoVenta" className="text-2xl mt-5"> Tipo de Venta:</label>
                        <select 
                            className="rounded-md text-2xl mt-5" 
                            name="Tipo de venta" 
                            id="tipoVenta"
                            value={tipoVenta}
                            onChange={(e) => setTipoVenta(e.target.value)}
                        >
                            <option value="mayor">Venta Por Mayor</option>
                            <option value="detalle">Venta al detalle</option>
                        </select>
                    </div>
                    <div className="container mx-auto p-4 flex flex-col">
                        <label htmlFor="tipoPago" className="text-2xl"> Tipo de Pago:</label>
                        <select 
                            name="Tipo de Pago" 
                            id="tipoPago" 
                            className="text-2xl mt-5"
                            value={tipoPago}
                            onChange={(e) => setTipoPago(e.target.value)}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                        </select>
                    </div>
                    <div className="container mx-auto p-4">
                        <label htmlFor="numeroBoleta" className="text-2xl">Numero de Boleta</label>
                        <input 
                            type="text" 
                            id="numeroBoleta" 
                            className='w-full p-2 border rounded'
                            placeholder='Ingrese el número de boleta'
                            value={numeroBoleta}
                            onChange={(e) => setNumeroBoleta(e.target.value)}
                        />
                    </div>

                    <div className="container mx-auto p-4 flex flex-col">
                        <label htmlFor="boletaOfactura" className="text-2xl">Boleta - Factura</label>
                        <select name="boleta o factura" id="boletaFactura" className="text-2xl mt-5">
                            <option value="boleta">Boleta</option>
                            <option value="factura">Factura</option>
                        </select>
                    </div>

                    <button onClick={confirmarVenta} className="bg-green-500 text-white px-4 py-2 mt-4">
                        Confirmar Venta
                    </button>
                </>
            )}
        </div>
    );
}