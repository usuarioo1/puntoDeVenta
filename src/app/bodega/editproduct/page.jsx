'use client';
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { apiBase } from "@/endpoints/api";

export default function EditarProductos() {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        const res = await axios.get(`${apiBase}/productosPuntoDeVenta`);
        setProductos(res.data.productos);
    };

    const manejarBusqueda = (e) => {
        const valorBusqueda = e.target.value;
        setBusqueda(valorBusqueda);
        
        if (!valorBusqueda) {
            setProductoSeleccionado(null);
            return;
        }
        
        const productoEncontrado = productos.find(p => {
            if (!p) return false;
            
            // Verificar nombre (coincidencia parcial)
            const coincideNombre = p.nombre && 
                p.nombre.toLowerCase().includes(valorBusqueda.toLowerCase());
            
            // Verificar código de barras (coincidencia exacta o parcial)
            const coincideCodigo = p.codigo_de_barras && 
                p.codigo_de_barras.includes(valorBusqueda);
                
            return coincideNombre || coincideCodigo;
        });
        
        setProductoSeleccionado(productoEncontrado || null);
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setProductoSeleccionado({ ...productoSeleccionado, [name]: value });
    };

    const subirImagen = async (e) => {
        if (!productoSeleccionado || !productoSeleccionado._id) {
            alert("Debes seleccionar un producto primero");
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        // Agregar el archivo al FormData
        formData.append('imagen', file);

        setIsUploading(true);
        
        try {
            // Ruta para subir una sola imagen al producto seleccionado
            const response = await axios.post(
                `${apiBase}/productosPuntoDeVenta/${productoSeleccionado._id}/subirImagen`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            // Actualizar la URL de la imagen en el estado local
            if (response.data && response.data.imageUrl) {
                setProductoSeleccionado({
                    ...productoSeleccionado,
                    imagen: response.data.imageUrl
                });
                alert("Imagen subida correctamente");
            }
        } catch (error) {
            console.error("Error al subir la imagen", error.response ? error.response.data : error);
            alert(`Error al subir la imagen: ${error.message}`);
        } finally {
            setIsUploading(false);
            // Limpiar el input de archivo
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const actualizarProducto = async () => {
        try {
            await axios.put(`${apiBase}/productosPuntoDeVenta/${productoSeleccionado._id}`, productoSeleccionado);
            alert("Producto actualizado correctamente");
            cargarProductos();
            setProductoSeleccionado(null);
            setBusqueda("");
        } catch (error) {
            console.error("Error al actualizar el producto", error.response ? error.response.data : error);
            alert(`Hubo un error al actualizar el producto: ${error.message}`);
        }
    };

    const eliminarProducto = async () => {
        if (!productoSeleccionado || !productoSeleccionado._id) {
            alert("Debes seleccionar un producto primero");
            return;
        }

        // Confirmación de eliminación
        const confirmar = window.confirm(`¿Estás seguro de eliminar el producto "${productoSeleccionado.nombre}"? Esta acción no se puede deshacer.`);
        if (!confirmar) return;

        setIsDeleting(true);
        
        try {
            await axios.delete(`${apiBase}/productosPuntoDeVenta/${productoSeleccionado._id}`);
            alert("Producto eliminado correctamente");
            
            // Actualizar la lista de productos y limpiar la selección
            cargarProductos();
            setProductoSeleccionado(null);
            setBusqueda("");
        } catch (error) {
            console.error("Error al eliminar el producto", error.response ? error.response.data : error);
            alert(`Hubo un error al eliminar el producto: ${error.message}`);
        } finally {
            setIsDeleting(false);
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

                    <label className="block font-semibold mb-1">Nombre</label>
                    <input 
                        type="text" 
                        name="nombre" 
                        value={productoSeleccionado.nombre || ""} 
                        onChange={manejarCambio} 
                        className="border p-2 w-full mb-2" 
                    />

                    <label className="block font-semibold mb-1">Costo</label>
                    <input 
                        type="number" 
                        name="costo" 
                        value={productoSeleccionado.costo || ""} 
                        onChange={manejarCambio} 
                        className="border p-2 w-full mb-2" 
                    />

                    <label className="block font-semibold mb-1">Precio Bodega</label>
                    <input 
                        type="text" 
                        name="preferentes" 
                        value={productoSeleccionado.preferentes || ""} 
                        onChange={manejarCambio} 
                        className="border p-2 w-full mb-2" 
                    />

                    <label className="block font-semibold mb-1">Precio x Mayor</label>
                    <input
                        type="text"
                        name="mayorista" 
                        value={productoSeleccionado.mayorista || ""} 
                        onChange={manejarCambio} 
                        className="border p-2 w-full mb-2"
                    />
                    <label className="block font-semibold mb-1">Tarifa Pública</label>
                    <input 
                        type="text" 
                        name="tarifa_publica" 
                        value={productoSeleccionado.tarifa_publica || ""} 
                        onChange={manejarCambio} 
                        className="border p-2 w-full mb-2" 
                    />

                    <label className="block font-semibold mb-1">Stock</label>
                    <input 
                        type="text" 
                        name="stock" 
                        placeholder="stock" 
                        value={productoSeleccionado.stock || ""} 
                        onChange={manejarCambio} 
                        className="border p-2 w-full mb-2" 
                    />

                    <div className="mb-4">
                        <label className="block font-semibold mb-1">Imagen del Producto</label>
                        
                        {/* Preview de la imagen */}
                        {productoSeleccionado.imagen && (
                            <div className="mb-2">
                                <img 
                                    src={productoSeleccionado.imagen} 
                                    alt={productoSeleccionado.nombre} 
                                    className="h-40 object-contain"
                                />
                            </div>
                        )}
                        
                        {/* Input para URL manual */}
                        <input 
                            type="text" 
                            name="imagen" 
                            placeholder="URL de la imagen" 
                            value={productoSeleccionado.imagen || ""} 
                            onChange={manejarCambio} 
                            className="border p-2 w-full mb-2" 
                        />
                        
                        {/* Input para subir archivo */}
                        <div className="flex items-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={subirImagen}
                                className="hidden"
                                id="fileInput"
                            />
                            <label 
                                htmlFor="fileInput" 
                                className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
                            >
                                {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                            </label>
                            {isUploading && <span className="ml-2">Procesando, espere por favor...</span>}
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button 
                            onClick={actualizarProducto} 
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Actualizar Producto
                        </button>
                        
                        <button 
                            onClick={eliminarProducto} 
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Eliminando...' : 'Eliminar Producto'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}