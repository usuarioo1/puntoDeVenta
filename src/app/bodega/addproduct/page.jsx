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
        setNuevoProducto({
            ...nuevoProducto,
            [name]: value
        });
    };

    const manejarSeleccionImagen = (e) => {
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
    };

    const generarCodigoDeBarras = () => {
        let codigo = Math.floor(100000000 + Math.random() * 900000000).toString();
        while (productosExistentes.some(producto => producto.codigo_de_barras === codigo)) {
            codigo = Math.floor(100000000 + Math.random() * 900000000).toString();
        }
        return codigo;
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

            // Reseteamos el formulario
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

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard de Productos</h1>

            <div className="mb-4">
                <input type="text" name="nombre" placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={manejarCambio} className="border p-2 mr-2" />
                <input type="text" name="preferentes" placeholder="Precio Bodega" value={nuevoProducto.preferentes} onChange={manejarCambio} className="border p-2 mr-2" />
                <input type="text" name="mayorista" placeholder="Precio Mayorista" value={nuevoProducto.mayorista} onChange={manejarCambio} className="border p-2 mr-2" />
                <input type="text" name="tarifa_publica" placeholder="Precio al detalle local" value={nuevoProducto.tarifa_publica} onChange={manejarCambio} className="border p-2 mr-2" />
            </div>

            <div className="mb-4">
                <select name="metal" value={nuevoProducto.metal} onChange={manejarCambio} className="border p-2 mr-2">
                    <option value="">Seleccionar Metal</option>
                    <option value="oro">Oro</option>
                    <option value="plata">Plata</option>
                    <option value="piedra">Piedra</option>
                </select>
                <select name="prod_nac_imp" value={nuevoProducto.prod_nac_imp} onChange={manejarCambio} className="border p-2 mr-2">
                    <option value="">Producto Nacional/Importado</option>
                    <option value="nacional">Nacional</option>
                    <option value="importado">Importado</option>
                </select>
                <select name="tipo_de_joya" value={nuevoProducto.tipo_de_joya} onChange={manejarCambio} className="border p-2 mr-2">
                    <option value="">Seleccionar Tipo de Joya</option>
                    {tiposDeJoya.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                </select>
                <input type="text" name="codigo_de_barras" placeholder="Código de Barras (Automático)" value={nuevoProducto.codigo_de_barras} disabled className="border p-2 mr-2" />
                <input type="number" name="stock" placeholder="Stock" value={nuevoProducto.stock} onChange={manejarCambio} className="border p-2 mr-2" />
            </div>

            <div className="mb-4">
                <div className="flex items-center">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={manejarSeleccionImagen} 
                        className="hidden" 
                        ref={fileInputRef}
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()} 
                        className="bg-gray-500 text-white px-4 py-2 mr-2"
                    >
                        Seleccionar Imagen
                    </button>
                    {previewImagen && (
                        <div className="relative">
                            <img src={previewImagen} alt="Vista previa" className="h-16 w-16 object-cover rounded" />
                            <button 
                                onClick={() => {
                                    setImagenSeleccionada(null);
                                    setPreviewImagen("");
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }} 
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <button 
                    onClick={agregarProducto} 
                    className={`bg-blue-500 text-white px-4 py-2 ${cargandoImagen ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={cargandoImagen}
                >
                    {cargandoImagen ? 'Subiendo imagen...' : 'Agregar Producto'}
                </button>
            </div>

            {productoRecienAgregado && (
                <div ref={productoRef} className="mt-6 p-4 border border-green-500 bg-green-50 rounded">
                    <h2 className="text-xl font-semibold mb-2">Producto agregado recientemente:</h2>
                    <p><strong>Nombre:</strong> {productoRecienAgregado.nombre}</p>
                    <p><strong>Código de Barras:</strong> {productoRecienAgregado.codigo_de_barras}</p>
                    <p><strong>Costo:</strong> {productoRecienAgregado.costo}</p>
                    <p><strong>Precio Bodega:</strong> {productoRecienAgregado.preferentes}</p>
                    <p><strong>Precio Mayorista:</strong> {productoRecienAgregado.mayorista}</p>
                    <p><strong>Tarifa Pública:</strong> {productoRecienAgregado.tarifa_publica}</p>
                    <p><strong>Tipo de Joya:</strong> {productoRecienAgregado.tipo_de_joya}</p>
                    {productoRecienAgregado.imagen && (
                        <div>
                            <p><strong>Imagen:</strong></p>
                            <img src={productoRecienAgregado.imagen} alt="Imagen del producto" className="w-32 mt-2" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}