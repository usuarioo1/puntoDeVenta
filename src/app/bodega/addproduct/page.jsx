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

    const [productosExistentes, setProductosExistentes] = useState([]);
    const [productoRecienAgregado, setProductoRecienAgregado] = useState(null);
    const productoRef = useRef(null);

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
        const res = await axios.get(`${apiBase}/productosPuntoDeVenta`);
        setProductosExistentes(res.data.productos);
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setNuevoProducto({
            ...nuevoProducto,
            [name]: value
        });
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

            await axios.post(`${apiBase}/productosPuntoDeVenta`, productoCompleto);

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

            alert("Producto agregado correctamente");

            setProductoRecienAgregado(productoCompleto); // guardar producto nuevo
            cargarProductos();
        } catch (error) {
            console.error("Error al agregar el producto", error.response ? error.response.data : error);
            alert(`Hubo un error al agregar el producto: ${error.message}`);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard de Productos</h1>

            <div className="mb-4">
                <input type="text" name="nombre" placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={manejarCambio} className="border p-2 mr-2" />
                <input type="text" name="costo" placeholder="Costo" value={nuevoProducto.costo} onChange={manejarCambio} className="border p-2 mr-2" />
                <input type="text" name="tarifa_publica" placeholder="Tarifa Pública" value={nuevoProducto.tarifa_publica} onChange={manejarCambio} className="border p-2 mr-2" />
                <input type="text" name="mayorista" placeholder="Tarifa Mayorista" value={nuevoProducto.mayorista} onChange={manejarCambio} className="border p-2 mr-2" />
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
                <input type="text" name="imagen" placeholder="URL de la Imagen" value={nuevoProducto.imagen} onChange={manejarCambio} className="border p-2 mr-2" />
                <input type="number" name="stock" placeholder="Stock" value={nuevoProducto.stock} onChange={manejarCambio} className="border p-2 mr-2" />
            </div>

            <div className="mb-4">
                <button onClick={agregarProducto} className="bg-blue-500 text-white px-4 py-2">
                    Agregar Producto
                </button>
            </div>

            {productoRecienAgregado && (
                <div ref={productoRef} className="mt-6 p-4 border border-green-500 bg-green-50 rounded">
                    <h2 className="text-xl font-semibold mb-2">Producto agregado recientemente:</h2>
                    <p><strong>Nombre:</strong> {productoRecienAgregado.nombre}</p>
                    <p><strong>Código de Barras:</strong> {productoRecienAgregado.codigo_de_barras}</p>
                    <p><strong>Costo:</strong> {productoRecienAgregado.costo}</p>
                    <p><strong>Tarifa Pública:</strong> {productoRecienAgregado.tarifa_publica}</p>
                    <p><strong>Tipo de Joya:</strong> {productoRecienAgregado.tipo_de_joya}</p>
                    {productoRecienAgregado.imagen && (
                        <img src={productoRecienAgregado.imagen} alt="Imagen del producto" className="w-32 mt-2" />
                    )}
                </div>
            )}
        </div>
    );
}
