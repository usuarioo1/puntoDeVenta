'use client';
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useBodega } from "@/context/BodegaContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiBase } from "@/endpoints/api";

function EditarProductosContent() {
    const { user } = useAuth();
    const {
        todosLosProductos: productos,
        cargando,
        actualizarProductoEnCache,
        eliminarProductoDelCache,
    } = useBodega();
    const isAdmin = user?.role === 'admin';
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [manualOverride, setManualOverride] = useState({
        mayorista: false,
        tarifa_publica: false
    });
    const fileInputRef = useRef(null);

    const manejarBusqueda = (e) => {
        const valorBusqueda = e.target.value;
        setBusqueda(valorBusqueda);
        if (!valorBusqueda) { setProductoSeleccionado(null); return; }
        const productoEncontrado = productos.find(p => {
            if (!p) return false;
            const coincideNombre = p.nombre && p.nombre.toLowerCase().includes(valorBusqueda.toLowerCase());
            const coincideCodigo = p.codigo_de_barras && p.codigo_de_barras.includes(valorBusqueda);
            return coincideNombre || coincideCodigo;
        });
        setProductoSeleccionado(productoEncontrado || null);
        setManualOverride({ mayorista: false, tarifa_publica: false });
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        const updatedProducto = { ...productoSeleccionado, [name]: value };
        if (name === "preferentes") {
            const precioBodega = parseFloat(value) || 0;
            const precioMayorista = precioBodega * 1.5;
            updatedProducto.mayorista = precioMayorista.toFixed(0);
            const tarifaPublica = precioMayorista * 1.5;
            updatedProducto.tarifa_publica = tarifaPublica.toFixed(0);
            setManualOverride({ mayorista: false, tarifa_publica: false });
        } else if (name === "mayorista") {
            setManualOverride({ ...manualOverride, mayorista: true });
            const precioMayorista = parseFloat(value) || 0;
            updatedProducto.tarifa_publica = (precioMayorista * 1.5).toFixed(0);
        } else if (name === "tarifa_publica") {
            setManualOverride({ ...manualOverride, tarifa_publica: true });
        }
        setProductoSeleccionado(updatedProducto);
    };

    const subirImagen = async (e) => {
        if (!productoSeleccionado?._id) { alert("Selecciona un producto"); return; }
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('imagen', file);
        setIsUploading(true);
        try {
            const response = await axios.post(
                `${apiBase}/productosPuntoDeVenta/${productoSeleccionado._id}/subirImagen`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            if (response.data?.imageUrl) {
                const productoConImagen = { ...productoSeleccionado, imagen: response.data.imageUrl };
                setProductoSeleccionado(productoConImagen);
                actualizarProductoEnCache(productoConImagen);
                alert("Imagen subida correctamente");
            }
        } catch (error) {
            console.error("Error al subir la imagen", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const actualizarProducto = async () => {
        try {
            const { data } = await axios.put(`${apiBase}/productosPuntoDeVenta/${productoSeleccionado._id}`, productoSeleccionado);
            actualizarProductoEnCache(data);
            alert("Producto actualizado correctamente");
            setProductoSeleccionado(null);
            setBusqueda("");
            setManualOverride({ mayorista: false, tarifa_publica: false });
        } catch (error) {
            console.error("Error al actualizar", error);
            alert(`Error: ${error.message}`);
        }
    };

    const eliminarProducto = async () => {
        if (!productoSeleccionado?._id) return;
        if (!window.confirm(`¿Eliminar "${productoSeleccionado.nombre}"?`)) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${apiBase}/productosPuntoDeVenta/${productoSeleccionado._id}`);
            eliminarProductoDelCache(productoSeleccionado._id);
            alert("Producto eliminado");
            setProductoSeleccionado(null);
            setBusqueda("");
        } catch (error) {
            console.error("Error al eliminar", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Editar Productos</h1>
            <Link href='/bodega'>
                <button className="bg-red-800 text-white px-2 py-1 rounded-md hover:bg-red-600 mb-4">
                    Volver a Bodega
                </button>
            </Link>

            <input
                type="text"
                placeholder="Buscar por nombre o código de barras"
                value={busqueda}
                onChange={manejarBusqueda}
                className="border p-2 w-full mb-4"
            />

            {cargando && productos.length === 0 && (
                <p className="text-sm text-gray-500 mb-4">Cargando catálogo de productos...</p>
            )}

            {productoSeleccionado && (
                <div>
                    <h2 className="text-xl font-bold mb-2">Editar Producto</h2>

                    <label className="block font-semibold mb-1">Nombre</label>
                    <input type="text" name="nombre" value={productoSeleccionado.nombre || ""} onChange={manejarCambio} disabled={!isAdmin} className="border p-2 w-full mb-2 disabled:bg-gray-100" />

                    <label className="block font-semibold mb-1">Costo</label>
                    <input type="text" name="costo" value={productoSeleccionado.costo || ""} onChange={manejarCambio} disabled={!isAdmin} className="border p-2 w-full mb-2 disabled:bg-gray-100" />

                    <label className="block font-semibold mb-1">Precio Bodega</label>
                    <input type="text" name="preferentes" value={productoSeleccionado.preferentes || ""} onChange={manejarCambio} disabled={!isAdmin} className="border p-2 w-full mb-2 disabled:bg-gray-100" />

                    <label className="block font-semibold mb-1">Precio x Mayor</label>
                    <input type="text" name="mayorista" value={productoSeleccionado.mayorista || ""} onChange={manejarCambio} disabled={!isAdmin} className="border p-2 w-full mb-2 disabled:bg-gray-100" />

                    <label className="block font-semibold mb-1">Tarifa Pública</label>
                    <input type="text" name="tarifa_publica" value={productoSeleccionado.tarifa_publica || ""} onChange={manejarCambio} disabled={!isAdmin} className="border p-2 w-full mb-2 disabled:bg-gray-100" />

                    <label className="block font-semibold mb-1">Stock Bodega</label>
                    <input type="number" min="0" name="stock" value={productoSeleccionado.stock || ""} onChange={manejarCambio} disabled={!isAdmin} className="border p-2 w-full mb-2 disabled:bg-gray-100" />

                    <label className="block font-semibold mb-1">Stock Tienda</label>
                    <input type="number" min="0" name="stock_tienda" value={productoSeleccionado.stock_tienda || ""} onChange={manejarCambio} disabled={!isAdmin} className="border p-2 w-full mb-2 disabled:bg-gray-100" />

                    {productoSeleccionado.imagen && (
                        <div className="mb-2">
                            <img src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} className="h-40 object-contain" />
                        </div>
                    )}

                    {isAdmin && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={subirImagen}
                                className="hidden"
                                id="fileInput"
                            />
                            <label htmlFor="fileInput" className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 inline-block mb-4">
                                {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                            </label>
                        </>
                    )}

                    {isAdmin && (
                        <div className="flex space-x-4">
                            <button onClick={actualizarProducto} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                                Actualizar Producto
                            </button>
                            <button onClick={eliminarProducto} disabled={isDeleting} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50">
                                {isDeleting ? 'Eliminando...' : 'Eliminar Producto'}
                            </button>
                        </div>
                    )}

                    {!isAdmin && (
                        <p className="text-sm text-gray-500 italic mt-2">
                            Tu rol (user) no permite editar ni eliminar productos.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function EditarProductosPage() {
    return (
        <ProtectedRoute>
            <EditarProductosContent />
        </ProtectedRoute>
    );
}
