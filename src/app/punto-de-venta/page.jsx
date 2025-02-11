'use client';
import { useEffect, useState } from "react";
import axios from "axios";

export default function Venta() {
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [codigoBarras, setCodigoBarras] = useState("");

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        const res = await axios.get("http://localhost:4000/productosPuntoDeVenta");
        setProductos(res.data);
    };

    const agregarAlCarrito = () => {
        const producto = productos.find((p) => p.codigo_de_barras === codigoBarras);
        if (producto) {
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
            setCodigoBarras("");
        } else {
            alert("Producto no encontrado");
        }
    };

    const confirmarVenta = async () => {
        let total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

        for (let item of carrito) {
            await axios.put(`http://localhost:4000/productosPuntoDeVenta/${item._id}/reduceStock`, { cantidad: item.cantidad });
        }

        await axios.post("http://localhost:4000/registrar", { productos: carrito.map(item => ({ producto: item._id, cantidad: item.cantidad })), total });

        alert("Venta realizada con éxito");
        setCarrito([]);
        cargarProductos();
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Punto de Venta</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Escanear código de barras"
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    className="border p-2 mr-2"
                />
                <button onClick={agregarAlCarrito} className="bg-blue-500 text-white px-4 py-2">Agregar</button>
            </div>
            <h2 className="text-xl font-bold mb-2">Carrito</h2>
            <ul>
                {carrito.map((item, index) => (
                    <li key={index} className="border p-2 my-1">
                        {item.nombre} - {item.cantidad} unidad(es)
                    </li>
                ))}
            </ul>
            <button onClick={confirmarVenta} className="bg-green-500 text-white px-4 py-2 mt-4">Confirmar Venta</button>
        </div>
    );
}
