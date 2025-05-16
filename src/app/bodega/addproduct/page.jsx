'use client';
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiBase } from "@/endpoints/api";

export default function DashboardProductos() {
    const [nuevoProducto, setNuevoProducto] = useState({
        nombre: "",
        costo: "",
        tarifa_publica: "",
        mayorista: "",
        preferentes: "",
        interno: "",
        metal: "",
        prod_nac_imp: "",
        taller_externa: "",
        importado: "",
        tipo_de_joya: "",
        codigo_de_barras: "",
        stock: "",
        imagen: ""
    });

    const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
    const [previewImagen, setPreviewImagen] = useState("");
    const [productosExistentes, setProductosExistentes] = useState([]);
    const [productoRecienAgregado, setProductoRecienAgregado] = useState(null);
    const [cargandoImagen, setCargandoImagen] = useState(false);
    const productoRef = useRef(null);
    const fileInputRef = useRef(null);

    const tiposDeJoya = [
        "figuras", "anillo", "colgante", "cadena", "pulsera", "abridor", "corbatero", 
        "piercing", "reloj", "cajas", "aros", "conjunto", "colleras", "collar", "prendedor"
    ];

    useEffect(() => {
        cargarProductos();
    }, []);

    useEffect(() => {
        if (productoRef.current) {
            productoRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [productoRecienAgregado]);

    const cargarProductos = async () => {
        try {
            const res = await axios.get(`${apiBase}/productosPuntoDeVenta`);
            setProductosExistentes(res.data.productos);
        } catch (error) {
            console.error("Error al cargar productos", error);
            alert("No se pudieron cargar los productos existentes");
        }
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        
        // Actualiza el campo modificado
        setNuevoProducto(prevDatos => {
            const nuevosDatos = {
                ...prevDatos,
                [name]: value
            };
            
            // Solo si se cambió el precio de bodega (preferentes), actualizamos automáticamente los otros precios
            if (name === 'preferentes' && value) {
                const precioBodega = parseFloat(value);
                if (!isNaN(precioBodega)) {
                    // Calcula el precio mayorista (50% más que el precio de bodega)
                    const precioMayorista = Math.round(precioBodega * 1.5);
                    nuevosDatos.mayorista = precioMayorista.toString();
                    
                    // Calcula el precio al detalle local (50% más que el precio mayorista)
                    const precioDetalle = Math.round(precioMayorista * 1.5);
                    nuevosDatos.tarifa_publica = precioDetalle.toString();
                }
            }
            
            return nuevosDatos;
        });
    };

    const manejarSeleccionImagen = (e) => {
        // Aseguramos que el evento tenga archivos
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file) {
                setImagenSeleccionada(file);
                
                // Crear una URL para previsualizar la imagen
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    setPreviewImagen(fileReader.result);
                };
                fileReader.readAsDataURL(file);
            }
        }
    };

    const generarCodigoDeBarras = () => {
        let codigo = Math.floor(100000000 + Math.random() * 900000000).toString();
        while (productosExistentes.some(producto => producto.codigo_de_barras === codigo)) {
            codigo = Math.floor(100000000 + Math.random() * 900000000).toString();
        }
        return codigo;
    };

    const resetearFormulario = () => {
        setNuevoProducto({
            nombre: "",
            costo: "",
            tarifa_publica: "",
            mayorista: "",
            preferentes: "",
            interno: "",
            metal: "",
            prod_nac_imp: "",
            taller_externa: "",
            importado: "",
            tipo_de_joya: "",
            codigo_de_barras: "",
            stock: "",
            imagen: ""
        });
        setImagenSeleccionada(null);
        setPreviewImagen("");
        
        // Importante: resetear el valor del input file
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const agregarProducto = async () => {
        try {
            const codigoUnico = generarCodigoDeBarras();
            const productoCompleto = {
                ...nuevoProducto,
                codigo_de_barras: codigoUnico
            };

            console.log("Producto a enviar:", productoCompleto);

            // Primero agregamos el producto sin imagen
            const respuesta = await axios.post(`${apiBase}/productosPuntoDeVenta`, productoCompleto);
            const productoGuardado = respuesta.data;

            // Si hay una imagen seleccionada, la subimos
            if (imagenSeleccionada) {
                await subirImagen(productoGuardado._id);
            }

            // Actualizamos la lista de productos después de agregar uno nuevo
            await cargarProductos();

            // Reseteamos el formulario usando la función separada
            resetearFormulario();
            
            // Si la subida fue exitosa, obtenemos el producto actualizado
            const productoActualizado = await axios.get(`${apiBase}/productosPuntoDeVenta/${productoGuardado._id}`);
            setProductoRecienAgregado(productoActualizado.data);

            alert("Producto agregado correctamente");
        } catch (error) {
            console.error("Error al agregar el producto", error.response ? error.response.data : error);
            alert(`Hubo un error al agregar el producto: ${error.message}`);
        }
    };

    const subirImagen = async (productoId) => {
        if (!imagenSeleccionada) return;
        
        setCargandoImagen(true);
        
        try {
            const formData = new FormData();
            formData.append('imagen', imagenSeleccionada);
            
            const respuesta = await axios.post(
                `${apiBase}/productosPuntoDeVenta/${productoId}/subirImagen`, 
                formData, 
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            console.log("Imagen subida:", respuesta.data);
            return respuesta.data.imageUrl;
        } catch (error) {
            console.error("Error al subir la imagen", error);
            alert("Error al subir la imagen");
            throw error;
        } finally {
            setCargandoImagen(false);
        }
    };

    const limpiarSeleccionImagen = () => {
        setImagenSeleccionada(null);
        setPreviewImagen("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard de Productos</h1>

            <div className="flex flex-wrap">
                {/* Formulario (lado izquierdo) */}
                <div className="w-full lg:w-1/2 pr-0 lg:pr-4 mb-4 lg:mb-0">
                    <div className="border p-4 rounded shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Producto</h2>
                        
                        <div className="mb-4">
                            <input 
                                type="text" 
                                name="nombre" 
                                placeholder="Nombre del producto" 
                                value={nuevoProducto.nombre} 
                                onChange={manejarCambio} 
                                className="border p-2 w-full mb-2" 
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input 
                                    type="text" 
                                    name="preferentes" 
                                    placeholder="Precio Bodega" 
                                    value={nuevoProducto.preferentes} 
                                    onChange={manejarCambio} 
                                    className="border p-2" 
                                />
                                <input 
                                    type="text" 
                                    name="mayorista" 
                                    placeholder="Precio Mayorista (Auto +50%)" 
                                    value={nuevoProducto.mayorista} 
                                    onChange={manejarCambio} 
                                    className="border p-2" 
                                />
                                <input 
                                    type="text" 
                                    name="tarifa_publica" 
                                    placeholder="Precio Detalle (Auto +50%)" 
                                    value={nuevoProducto.tarifa_publica} 
                                    onChange={manejarCambio} 
                                    className="border p-2" 
                                />
                            </div>
                        </div>

                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <select name="metal" value={nuevoProducto.metal} onChange={manejarCambio} className="border p-2">
                                <option value="">Seleccionar Metal</option>
                                <option value="oro">Oro</option>
                                <option value="plata">Plata</option>
                                <option value="piedra">Piedra</option>
                            </select>
                            <select name="prod_nac_imp" value={nuevoProducto.prod_nac_imp} onChange={manejarCambio} className="border p-2">
                                <option value="">Producto Nacional/Importado</option>
                                <option value="nacional">Nacional</option>
                                <option value="importado">Importado</option>
                            </select>
                        </div>
                        
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <select name="tipo_de_joya" value={nuevoProducto.tipo_de_joya} onChange={manejarCambio} className="border p-2">
                                <option value="">Seleccionar Tipo de Joya</option>
                                {tiposDeJoya.map((tipo) => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                            <input type="text" name="stock" placeholder="Stock" value={nuevoProducto.stock} onChange={manejarCambio} className="border p-2" />
                        </div>
                        
                        <div className="mb-4">
                            <input type="text" name="codigo_de_barras" placeholder="Código de Barras (Automático)" value={nuevoProducto.codigo_de_barras} disabled className="border p-2 w-full bg-gray-100" />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={manejarSeleccionImagen} 
                                    className="hidden" 
                                    ref={fileInputRef}
                                    key={Date.now()} // Forzar actualización del componente input
                                />
                                <button 
                                    onClick={() => fileInputRef.current.click()} 
                                    className="bg-gray-500 text-white px-4 py-2 mr-2 rounded"
                                    type="button"
                                >
                                    Seleccionar Imagen
                                </button>
                                {previewImagen && (
                                    <div className="relative">
                                        <img src={previewImagen} alt="Vista previa" className="h-16 w-16 object-cover rounded" />
                                        <button 
                                            onClick={limpiarSeleccionImagen} 
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                                            type="button"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <button 
                                onClick={agregarProducto} 
                                className={`bg-blue-500 text-white px-6 py-2 rounded ${cargandoImagen ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                                disabled={cargandoImagen}
                                type="button"
                            >
                                {cargandoImagen ? 'Subiendo imagen...' : 'Agregar Producto'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Producto recién agregado (lado derecho) */}
                <div className="w-full lg:w-1/2 pl-0 lg:pl-4">
                    {productoRecienAgregado ? (
                        <div ref={productoRef} className="border border-green-500 bg-green-50 rounded p-4 h-full">
                            <h2 className="text-xl font-semibold mb-4">Producto Agregado</h2>
                            <div className="flex flex-wrap">
                                <div className="w-full md:w-2/3">
                                    <p className="mb-2"><strong>Nombre:</strong> {productoRecienAgregado.nombre}</p>
                                    <p className="mb-2"><strong>Código de Barras:</strong> {productoRecienAgregado.codigo_de_barras}</p>
                                    <p className="mb-2"><strong>Precio Bodega:</strong> {productoRecienAgregado.preferentes}</p>
                                    <p className="mb-2"><strong>Precio Mayorista:</strong> {productoRecienAgregado.mayorista}</p>
                                    <p className="mb-2"><strong>Tarifa Pública:</strong> {productoRecienAgregado.tarifa_publica}</p>
                                    <p className="mb-2"><strong>Stock:</strong> {productoRecienAgregado.stock}</p>
                                    <p className="mb-2"><strong>Metal:</strong> {productoRecienAgregado.metal}</p>
                                    <p className="mb-2"><strong>Tipo de Joya:</strong> {productoRecienAgregado.tipo_de_joya}</p>
                                    <p className="mb-2"><strong>Origen:</strong> {productoRecienAgregado.prod_nac_imp}</p>
                                </div>
                                {productoRecienAgregado.imagen && (
                                    <div className="w-full md:w-1/3 flex justify-center items-center">
                                        <div className="text-center">
                                            <img 
                                                src={productoRecienAgregado.imagen} 
                                                alt="Imagen del producto" 
                                                className="max-w-full h-auto border rounded shadow-sm mx-auto" 
                                            />
                                            <p className="mt-2 text-sm text-gray-600">Imagen del producto</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-300 rounded p-4 h-full flex items-center justify-center bg-gray-50">
                            <div className="text-center text-gray-500">
                                <p className="text-xl mb-2">No hay productos recientes</p>
                                <p>Los productos agregados se mostrarán aquí</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}