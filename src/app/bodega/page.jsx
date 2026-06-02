"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import JsBarcode from "jsbarcode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";
import { useBodega } from "@/context/BodegaContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const TIPOS_DE_JOYAS = [
    "AROS",
    "CONJUNTO",
    "COLGANTE",
    "CADENA",
    "ANILLO",
    "CAJA",
    "PIERCING",
];

function BodegaContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const isAdmin = user?.role === 'admin';
    const { agregarAlCarrito } = useCarrito();
    const {
        todosLosProductos,
        setTodosLosProductos,
        productosCargados,
        setProductosCargados,
        cargando,
        setCargando,
    } = useBodega();

    const [filtroTipoJoya, setFiltroTipoJoya] = useState("");
    const [productosFiltrados, setProductosFiltrados] = useState([]);

    useEffect(() => {
        if (productosCargados) {
            if (!filtroTipoJoya) {
                setProductosFiltrados(todosLosProductos);
            } else {
                const filtrados = todosLosProductos.filter(
                    (producto) => producto.tipo_de_joya === filtroTipoJoya
                );
                setProductosFiltrados(filtrados);
            }
        }
    }, [filtroTipoJoya, todosLosProductos, productosCargados]);

    const cargarProductos = async () => {
        if (productosCargados) return;
        try {
            setCargando(true);
            const res = await axios.get('/api/productosPuntoDeVenta');
            const productosRecibidos = res.data.productos || [];
            setTodosLosProductos(productosRecibidos);
            setProductosFiltrados(productosRecibidos);
            setProductosCargados(true);
        } catch (error) {
            console.error("Error al cargar productos:", error);
            alert(
                `Error al cargar productos: ${error.response?.data?.error || error.message}`
            );
        } finally {
            setCargando(false);
        }
    };

    const eliminarProducto = async (id) => {
        try {
            await axios.delete(`/api/productosPuntoDeVenta?id=${id}`);
            setTodosLosProductos(todosLosProductos.filter((p) => p._id !== id));
            setProductosFiltrados(productosFiltrados.filter((p) => p._id !== id));
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            alert(error.response?.data?.message || 'No se pudo eliminar el producto');
        }
    };

    const generarCodigoDeBarras = (codigo) => {
        if (!codigo || typeof codigo !== "string") return "";
        const canvas = document.createElement("canvas");
        try {
            JsBarcode(canvas, codigo, { format: "CODE128", width: 2, height: 40 });
            return canvas.toDataURL();
        } catch (error) {
            console.error("Error al generar código de barras:", error);
            return "";
        }
    };

    const handleLogout = () => {
        if (window.confirm("¿Cerrar sesión?")) {
            logout();
            router.push('/login');
        }
    };

    const handleFiltroChange = (e) => setFiltroTipoJoya(e.target.value);

    const contarProductosPorTipo = (tipo) =>
        todosLosProductos.filter((p) => p.tipo_de_joya === tipo).length;

    const resumenInventario = useMemo(() => {
        if (!productosCargados || todosLosProductos.length === 0) {
            return { resumenPorTipo: [], totales: { cantidad: 0, valor: 0 } };
        }
        const productosConStock = todosLosProductos.filter((p) => {
            const stock = parseInt(p.stock) || 0;
            return stock > 0;
        });
        const resumen = {};
        let cantidadTotal = 0;
        let valorTotal = 0;
        productosConStock.forEach((producto) => {
            const tipo = producto.tipo_de_joya || 'SIN TIPO';
            const precioBodega = parseFloat(producto.preferentes) || 0;
            if (!resumen[tipo]) resumen[tipo] = { tipo, cantidad: 0, valorTotal: 0 };
            resumen[tipo].cantidad += 1;
            resumen[tipo].valorTotal += precioBodega;
            cantidadTotal += 1;
            valorTotal += precioBodega;
        });
        const resumenArray = Object.values(resumen).sort((a, b) =>
            a.tipo.localeCompare(b.tipo)
        );
        return { resumenPorTipo: resumenArray, totales: { cantidad: cantidadTotal, valor: valorTotal } };
    }, [todosLosProductos, productosCargados]);

    const formatearPrecio = (precio) =>
        new Intl.NumberFormat('es-CL', {
            style: 'currency', currency: 'CLP',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(precio);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Bodega - Gestión de Productos</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        {user?.name || user?.username} ({user?.role})
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {productosCargados && resumenInventario.resumenPorTipo.length > 0 && (
                <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">
                        Resumen de Inventario (Solo con Stock)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
                            <p className="text-sm uppercase tracking-wide opacity-80">Cantidad Total</p>
                            <p className="text-3xl font-bold mt-1">
                                {resumenInventario.totales.cantidad.toLocaleString('es-CL')}
                            </p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
                            <p className="text-sm uppercase tracking-wide opacity-80">Valor Total</p>
                            <p className="text-3xl font-bold mt-1">
                                {formatearPrecio(resumenInventario.totales.valor)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2 flex-wrap mb-4">
                {!productosCargados ? (
                    <button
                        onClick={cargarProductos}
                        className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 rounded"
                        disabled={cargando}
                    >
                        {cargando ? "Cargando..." : "Cargar Productos"}
                    </button>
                ) : (
                    <>
                        {isAdmin && (
                            <>
                                <Link href="/bodega/addproduct">
                                    <button className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 rounded">
                                        Agregar Producto
                                    </button>
                                </Link>
                                <Link href="/bodega/ventas">
                                    <button className="bg-green-800 text-white px-4 py-2 hover:bg-green-900 rounded">
                                        Ver Ventas
                                    </button>
                                </Link>
                                <Link href="/bodega/traslado">
                                    <button className="bg-purple-800 text-white px-4 py-2 hover:bg-purple-900 rounded">
                                        Traslado de Productos
                                    </button>
                                </Link>
                            </>
                        )}
                        <Link href="/bodega/editproduct">
                            <button className="bg-yellow-600 text-white px-4 py-2 hover:bg-yellow-800 rounded">
                                Editar Productos
                            </button>
                        </Link>
                    </>
                )}
            </div>

            {productosCargados && (
                <div className="mb-6 p-4 border rounded bg-white shadow-sm">
                    <h3 className="text-lg font-semibold mb-3">Filtrar por tipo de joya</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => setFiltroTipoJoya("")}
                            className={`px-4 py-2 rounded-full ${
                                filtroTipoJoya === "" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                            }`}
                        >
                            Todos ({todosLosProductos.length})
                        </button>
                        {TIPOS_DE_JOYAS.map((tipo) => (
                            <button
                                key={tipo}
                                onClick={() => setFiltroTipoJoya(tipo)}
                                className={`px-4 py-2 rounded-full ${
                                    filtroTipoJoya === tipo ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                                }`}
                            >
                                {tipo} ({contarProductosPorTipo(tipo)})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {productosCargados && (
                <p className="mb-4 text-gray-700">
                    {productosFiltrados.length} producto(s) encontrado(s)
                    {filtroTipoJoya && ` para el tipo: ${filtroTipoJoya}`}
                </p>
            )}

            {productosCargados && (
                <div className="overflow-x-auto">
                    <table className="w-full border">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-1">Stock</th>
                                <th className="p-1">Imagen</th>
                                <th className="p-1">Nombre</th>
                                <th className="p-1">Tarifa Pública</th>
                                <th className="p-1">Precio Bodega</th>
                                <th className="p-1">Tipo de Joya</th>
                                <th className="p-1">Código de Barra</th>
                                {isAdmin && <th className="p-1">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {productosFiltrados.map((producto) => (
                                <tr key={producto._id} className="border-t hover:bg-gray-50">
                                    <td className="p-1">{producto.stock}</td>
                                    <td className="p-1">
                                        <img
                                            src={producto.imagen || "/noimagen.png"}
                                            className="w-20 h-20 object-cover"
                                            alt={producto.nombre}
                                        />
                                    </td>
                                    <td className="p-1">{producto.nombre}</td>
                                    <td className="p-1">${producto.tarifa_publica}</td>
                                    <td className="p-1">${producto.preferentes}</td>
                                    <td className="p-1">{producto.tipo_de_joya}</td>
                                    <td className="p-1">
                                        {producto.codigo_de_barras && (
                                            <img
                                                src={generarCodigoDeBarras(producto.codigo_de_barras)}
                                                alt="Código de Barra"
                                            />
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td className="p-1">
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
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function BodegaPage() {
    return (
        <ProtectedRoute>
            <BodegaContent />
        </ProtectedRoute>
    );
}
