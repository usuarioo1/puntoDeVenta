'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import JsBarcode from "jsbarcode";

export default function Bodega() {
    const [productos, setProductos] = useState([]);
    const [filtro, setFiltro] = useState({
        nombre: "",
        codigo_de_barras: "",
        tipo_de_joya: ""
    });
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
        imagen: ""
    });

    const tiposDeJoya = [
        "figuras", "anillo", "colgante", "cadena", "pulsera", "abridor", "corbatero", 
        "piercing", "reloj", "cajas", "aros", "conjunto", "colleras", "collar", "prendedor"
    ];

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        const res = await axios.get("http://localhost:4000/productosPuntoDeVenta");
        setProductos(res.data.productos);
    };

    const agregarProducto = async () => {
        if (!nuevoProducto.codigo_de_barras) {
            alert("El código de barras es obligatorio");
            return;
        }
        await axios.post("http://localhost:4000/productosPuntoDeVenta", nuevoProducto);
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
            imagen: ""
        });
        cargarProductos();
    };

    const eliminarProducto = async (id) => {
        await axios.delete(`http://localhost:4000/productosPuntoDeVenta/${id}`);
        cargarProductos();
    };

    const generarCodigoDeBarras = (codigo) => {
        if (!codigo || typeof codigo !== "string") {
            return ""; // Devuelve una cadena vacía o una URL de imagen por defecto
        }
        const canvas = document.createElement('canvas');
        try {
            JsBarcode(canvas, codigo, { format: "CODE128", width: 2, height: 40 });
            return canvas.toDataURL();
        } catch (error) {
            console.error("Error al generar código de barras:", error);
            return ""; // O una imagen de error
        }
    };

    // Filtrar los productos según el filtro de búsqueda
    const productosFiltrados = productos.filter((producto) => {
        // Convertir los valores a mayúsculas para una comparación insensible a mayúsculas/minúsculas
        const filtroNombre = producto.nombre.toUpperCase().includes(filtro.nombre.toUpperCase());
        const filtroCodigo = producto.codigo_de_barras.toUpperCase().includes(filtro.codigo_de_barras.toUpperCase());
        const filtroTipoJoya = filtro.tipo_de_joya ? producto.tipo_de_joya.toUpperCase() === filtro.tipo_de_joya.toUpperCase() : true;
        return filtroNombre && filtroCodigo && filtroTipoJoya;
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Bodega - Gestión de Productos</h1>

            {/* Barra de búsqueda */}
            <div className="mb-4 flex space-x-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre"
                    value={filtro.nombre}
                    onChange={(e) => setFiltro({ ...filtro, nombre: e.target.value })}
                    className="border p-2"
                />
                <input
                    type="text"
                    placeholder="Buscar por código de barra"
                    value={filtro.codigo_de_barras}
                    onChange={(e) => setFiltro({ ...filtro, codigo_de_barras: e.target.value })}
                    className="border p-2"
                />
                <select
                    value={filtro.tipo_de_joya}
                    onChange={(e) => setFiltro({ ...filtro, tipo_de_joya: e.target.value })}
                    className="border p-2"
                >
                    <option value="">Filtrar por tipo de joya</option>
                    {tiposDeJoya.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                </select>
            </div>


            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2">Imagen</th>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Tarifa Pública</th>
                        <th className="p-2">Tarifa Mayorista</th>
                        <th className="p-2">Metal</th>
                        <th className="p-2">Producto Nacional/Importado</th>
                        <th className="p-2">Tipo de Joya</th>
                        <th className="p-2">Código de Barra</th>
                        <th className="p-2">Código Generado</th>
                        <th className="p-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {productosFiltrados.map((producto) => (
                        <tr key={producto._id} className="border-t">
                            <td className="p-2">
                                <img src={producto.imagen} alt="Imagen del Producto" className="w-16 h-16 object-cover" />
                            </td>
                            <td className="p-2">{producto.nombre}</td>
                            <td className="p-2">{producto.tarifa_publica}</td>
                            <td className="p-2">{producto.mayorista}</td>
                            <td className="p-2">{producto.metal}</td>
                            <td className="p-2">{producto.prod_nac_imp}</td>
                            <td className="p-2">{producto.tipo_de_joya}</td>
                            <td className="p-2">{producto.codigo_de_barras}</td>
                            <td className="p-2">
                                {producto.codigo_de_barras && (
                                    <img 
                                        src={generarCodigoDeBarras(producto.codigo_de_barras)} 
                                        alt="Código de Barra" 
                                        onError={(e) => {
                                            e.target.src = "/ruta/a/imagen-por-defecto.png"; // Imagen de error
                                        }}
                                    />
                                )}
                            </td>
                            <td className="p-2">
                                <button onClick={() => eliminarProducto(producto._id)} className="bg-red-500 text-white px-2 py-1">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}