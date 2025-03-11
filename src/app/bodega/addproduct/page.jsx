'use client';
import { useState, useEffect } from "react";
import axios from "axios";

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
    
    const tiposDeJoya = [
        "figuras", "anillo", "colgante", "cadena", "pulsera", "abridor", "corbatero", 
        "piercing", "reloj", "cajas", "aros", "conjunto", "colleras", "collar", "prendedor"
    ];

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        const res = await axios.get("http://localhost:4000/productosPuntoDeVenta");
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
            // Crear un nuevo objeto con todos los datos actualizados
            const productoCompleto = {
                ...nuevoProducto,
                codigo_de_barras: codigoUnico
            };
            
            // Depuración: Verifica que el objeto contiene el campo stock
            console.log("Producto a enviar:", productoCompleto);
            
            // Enviar el objeto completo
            await axios.post("http://localhost:4000/productosPuntoDeVenta", productoCompleto);
            
            // Actualizar el estado después
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
        </div>
    );
}