'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";


export default function EditarProductos() {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        const res = await axios.get("http://localhost:4000/productosPuntoDeVenta");
        setProductos(res.data.productos);
    };

    const manejarBusqueda = (e) => {
        setBusqueda(e.target.value);
        const productoEncontrado = productos.find(p => 
            p.nombre.toLowerCase() === e.target.value.toLowerCase() ||
            p.codigo_de_barras === e.target.value
        );
        setProductoSeleccionado(productoEncontrado || null);
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setProductoSeleccionado({ ...productoSeleccionado, [name]: value });
    };

    const actualizarProducto = async () => {
        try {
            await axios.put(`http://localhost:4000/productosPuntoDeVenta/${productoSeleccionado._id}`, productoSeleccionado);
            alert("Producto actualizado correctamente");
            cargarProductos();
            setProductoSeleccionado(null);
            setBusqueda("");
        } catch (error) {
            console.error("Error al actualizar el producto", error.response ? error.response.data : error);
            alert(`Hubo un error al actualizar el producto: ${error.message}`);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Editar Productos</h1>
            <Link href='/bodega'><button className="bg-red-800 text-white px-2 py-1 rounded-md hover:bg-red-600 mb-4">Volver a Bodega</button>
            </Link>
            
            <input type="text" placeholder="Buscar por nombre o código de barras" value={busqueda} onChange={manejarBusqueda} className="border p-2 w-full mb-4" />
            
            {productoSeleccionado && (
                <div>
                    <h2 className="text-xl font-bold mb-2">Editar Producto</h2>
                    <input type="text" name="nombre" value={productoSeleccionado.nombre} onChange={manejarCambio} className="border p-2 w-full mb-2" />
                    <input type="number" name="costo" value={productoSeleccionado.costo} onChange={manejarCambio} className="border p-2 w-full mb-2" />
                    <input type="number" name="tarifa_publica" value={productoSeleccionado.tarifa_publica} onChange={manejarCambio} className="border p-2 w-full mb-2" />
                    <input type="number" name="stock" placeholder="stock" value={productoSeleccionado.stock} onChange={manejarCambio} className="border p-2 w-full mb-2" />
                    <input type="text" name="imagen" placeholder="imagen" value={productoSeleccionado.imagen} onChange={manejarCambio} className="border p-2 w-full mb-2" />
                    <button onClick={actualizarProducto} className="bg-green-500 text-white px-4 py-2">Actualizar Producto</button>
                </div>
            )}
        </div>
    );
}
