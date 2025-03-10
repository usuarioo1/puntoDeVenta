'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import JsBarcode from "jsbarcode";
import Link from "next/link";
import { useCarrito } from "@/context/CarritoContext";

// Credenciales predefinidas
const CREDENCIALES = {
    usuario: 'admin',
    contraseña: 'bodega123'
};

export default function BodegaProtegida() {
    const [autenticado, setAutenticado] = useState(false);
    const [formulario, setFormulario] = useState({
        usuario: '',
        contraseña: ''
    });
    const [error, setError] = useState('');
    const [recordarme, setRecordarme] = useState(false);

    // Componente original de Bodega
    const ComponenteBodega = () => {
        const { agregarAlCarrito } = useCarrito();
        const [productos, setProductos] = useState([]);
        const [filtro, setFiltro] = useState({
            nombre: "",
            codigo_de_barras: "",
            tipo_de_joya: ""
        });

        const tiposDeJoya = [
            "figuras", "anillo", "colgante", "cadena", "pulsera", "abridor", "corbatero",
            "piercing", "reloj", "cajas", "aros", "conjunto", "colleras", "collar", "prendedor"
        ];

        useEffect(() => {
            cargarProductos();
        }, []);

        const cargarProductos = async () => {
            try {
                const res = await axios.get("http://localhost:4000/productosPuntoDeVenta");
                setProductos(res.data.productos);
            } catch (error) {
                console.error("Error al cargar productos:", error);
            }
        };

        const eliminarProducto = async (id) => {
            try {
                await axios.delete(`http://localhost:4000/productosPuntoDeVenta/${id}`);
                cargarProductos();
            } catch (error) {
                console.error("Error al eliminar producto:", error);
            }
        };

        const generarCodigoDeBarras = (codigo) => {
            if (!codigo || typeof codigo !== "string") {
                return "";
            }
            const canvas = document.createElement('canvas');
            try {
                JsBarcode(canvas, codigo, { format: "CODE128", width: 2, height: 40 });
                return canvas.toDataURL();
            } catch (error) {
                console.error("Error al generar código de barras:", error);
                return "";
            }
        };

        const productosFiltrados = productos.filter((producto) => {
            if (!producto || !producto.nombre || !producto.codigo_de_barras) {
                return false;
            }
            const filtroNombre = producto.nombre.toUpperCase().includes(filtro.nombre.toUpperCase());
            const filtroCodigo = producto.codigo_de_barras.toUpperCase().includes(filtro.codigo_de_barras.toUpperCase());
            const filtroTipoJoya = filtro.tipo_de_joya ? producto.tipo_de_joya?.toUpperCase() === filtro.tipo_de_joya.toUpperCase() : true;
            return filtroNombre && filtroCodigo && filtroTipoJoya;
        });

        const cerrarSesion = () => {
            if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                localStorage.removeItem('bodega_autenticado');
                setAutenticado(false);
            }
        };

        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Bodega - Gestión de Productos</h1>
                    <button
                        onClick={cerrarSesion}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {/* Barra de búsqueda */}
                <div className="mb-4 flex flex-wrap gap-2">
                    <input
                        type="text"
                        placeholder="Buscar por nombre"
                        value={filtro.nombre}
                        onChange={(e) => setFiltro({ ...filtro, nombre: e.target.value })}
                        className="border p-2 flex-grow"
                    />
                    <input
                        type="text"
                        placeholder="Buscar por código de barra"
                        value={filtro.codigo_de_barras}
                        onChange={(e) => setFiltro({ ...filtro, codigo_de_barras: e.target.value })}
                        className="border p-2 flex-grow"
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
                    <div className="flex gap-2 flex-wrap">
                        <Link href='/bodega/addproduct'>
                            <button className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 rounded">
                                Agregar Producto
                            </button>
                        </Link>
                        <Link href='/bodega/editproduct'>
                            <button className="bg-yellow-600 text-white px-4 py-2 hover:bg-yellow-800 rounded">
                                Editar Productos
                            </button>
                        </Link>
                        <Link href='/bodega/ventas'>
                            <button className="bg-green-800 text-white px-4 py-2 hover:bg-green-900 rounded">
                                Ver Ventas
                            </button>
                        </Link>
                        <Link href='/bodega/traslado'>
                            <button className="bg-purple-800 text-white px-4 py-2 hover:bg-purple-900 rounded">
                        Traslado de Productos</button>
                        </Link>
                    </div>
                </div>

                {/* Tabla de productos */}
                <div className="overflow-x-auto">
                    <table className="w-full border">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2">Stock</th>
                                <th className="p-2">Imagen</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Tarifa Pública</th>
                                <th className="p-2">Tarifa Mayorista</th>
                                <th className="p-2">Metal</th>
                                <th className="p-2">Producto N/I</th>
                                <th className="p-2">Tipo de Joya</th>
                                <th className="p-2">Código de Barra</th>
                                <th className="p-2">Código Generado</th>
                                <th className="p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productosFiltrados.map((producto) => (
                                <tr key={producto._id} className="border-t hover:bg-gray-50">
                                    <td className="p-2">{producto.stock}</td>
                                    <td className="p-2">
                                        <img
                                            src={producto.imagen || "/placeholder.png"}
                                            alt={producto.nombre}
                                            className="w-16 h-16 object-cover"
                                        />
                                    </td>
                                    <td className="p-2">{producto.nombre}</td>
                                    <td className="p-2">${producto.tarifa_publica}</td>
                                    <td className="p-2">${producto.mayorista}</td>
                                    <td className="p-2">{producto.metal}</td>
                                    <td className="p-2">{producto.prod_nac_imp}</td>
                                    <td className="p-2">{producto.tipo_de_joya}</td>
                                    <td className="p-2">{producto.codigo_de_barras}</td>
                                    <td className="p-2">
                                        {producto.codigo_de_barras && (
                                            <img
                                                src={generarCodigoDeBarras(producto.codigo_de_barras)}
                                                alt="Código de Barra"
                                            />
                                        )}
                                    </td>
                                    <td className="p-2">
                                        <div className="flex flex-col space-y-2">
                                            <button
                                                onClick={() => agregarAlCarrito(producto)}
                                                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-700"
                                            >
                                                Agregar al carrito
                                            </button>
                                            <button
                                                onClick={() => eliminarProducto(producto._id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Componente de inicio de sesión
    const ComponenteLogin = () => {
        const manejarCambio = (e) => {
            const { name, value } = e.target;
            setFormulario({
                ...formulario,
                [name]: value
            });
        };

        const iniciarSesion = (e) => {
            e.preventDefault();

            // Validar credenciales
            if (
                formulario.usuario === CREDENCIALES.usuario &&
                formulario.contraseña === CREDENCIALES.contraseña
            ) {
                setAutenticado(true);
                setError('');

                // Si está activado "recordarme", guardar en localStorage
                if (recordarme) {
                    localStorage.setItem('bodega_autenticado', 'true');
                }
            } else {
                setError('Usuario o contraseña incorrectos');
            }
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center">Acceso a Bodega</h2>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={iniciarSesion}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="usuario">
                                Usuario
                            </label>
                            <input
                                type="text"
                                id="usuario"
                                name="usuario"
                                value={formulario.usuario}
                                onChange={manejarCambio}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contraseña">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                id="contraseña"
                                name="contraseña"
                                value={formulario.contraseña}
                                onChange={manejarCambio}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={recordarme}
                                    onChange={() => setRecordarme(!recordarme)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Recordar sesión</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            >
                                Iniciar Sesión
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Verificar si ya hay una sesión guardada
    useEffect(() => {
        const sesionGuardada = localStorage.getItem('bodega_autenticado');
        if (sesionGuardada === 'true') {
            setAutenticado(true);
        }
    }, []);

    // Renderizar el componente correspondiente según el estado de autenticación
    return autenticado ? <ComponenteBodega /> : <ComponenteLogin />;
}