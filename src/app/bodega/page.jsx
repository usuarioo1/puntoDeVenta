"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiBase } from "@/endpoints/api";

const TIPOS_DE_JOYAS = [
    "AROS", "CONJUNTO", "COLGANTE", "CADENA", "ANILLO", "CAJA", "PIERCING",
];
const PAGE_SIZE = 100;

function BodegaContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const isAdmin = user?.role === 'admin';
    const { agregarAlCarrito } = useCarrito();

    const [productos, setProductos] = useState([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [skip, setSkip] = useState(0);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [tipo, setTipo] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [productoImagen, setProductoImagen] = useState(null);

    const abortRef = useRef(null);
    const debounceRef = useRef(null);

    const fetchProductos = useCallback(async ({ searchTerm, tipoFiltro, offset, append = false }) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setCargando(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set('search', searchTerm);
            if (tipoFiltro) params.set('tipo', tipoFiltro);
            const hasFilter = !!(searchTerm || tipoFiltro);
            params.set('limit', hasFilter ? 10000 : PAGE_SIZE);
            params.set('skip', offset);
            params.set('sort', 'nombre');

            const { data } = await axios.get(`${apiBase}/productosPuntoDeVenta?${params}`, {
                signal: controller.signal
            });

            const nuevos = data.productos || [];
            setProductos(prev => append ? [...prev, ...nuevos] : nuevos);
            setTotal(data.total || 0);
            setHasMore(!hasFilter && !!data.hasMore);
        } catch (err) {
            if (err.name !== 'CanceledError') {
                setError(err.response?.data?.error || 'Error al cargar productos');
            }
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        fetchProductos({ searchTerm: '', tipoFiltro: '', offset: 0 });
    }, [fetchProductos]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSkip(0);
            fetchProductos({ searchTerm: search, tipoFiltro: tipo, offset: 0 });
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [search, tipo, fetchProductos]);

    useEffect(() => {
        if (!productoImagen) return;

        const cerrarConEscape = (event) => {
            if (event.key === 'Escape') setProductoImagen(null);
        };

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', cerrarConEscape);

        return () => {
            document.body.style.overflow = overflowAnterior;
            window.removeEventListener('keydown', cerrarConEscape);
        };
    }, [productoImagen]);

    const cargarMas = () => {
        const newSkip = skip + PAGE_SIZE;
        setSkip(newSkip);
        fetchProductos({ searchTerm: search, tipoFiltro: tipo, offset: newSkip, append: true });
    };

    const eliminarProducto = async (id) => {
        if (!window.confirm('¿Eliminar este producto?')) return;
        try {
            await axios.delete(`/api/productosPuntoDeVenta?id=${id}`);
            setProductos(prev => prev.filter(p => p._id !== id));
            setTotal(t => t - 1);
        } catch (err) {
            alert(err.response?.data?.message || 'No se pudo eliminar');
        }
    };

    const handleLogout = () => {
        if (window.confirm("¿Cerrar sesión?")) {
            logout();
            router.push('/login');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Bodega</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        {user?.name || user?.username} ({user?.role})
                    </span>
                    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700">
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Buscar</label>
                        <input
                            type="text"
                            placeholder="Nombre o código de barras..."
                            value={searchInput}
                            onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                            className="border p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Tipo de joya</label>
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            className="border p-2 w-full rounded"
                        >
                            <option value="">Todos</option>
                            {TIPOS_DE_JOYAS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-2 flex-wrap">
                        {isAdmin && (
                            <>
                                <Link href="/bodega/addproduct">
                                    <button className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700">+ Producto</button>
                                </Link>
                                <Link href="/bodega/ventas">
                                    <button className="bg-green-800 text-white px-3 py-2 rounded hover:bg-green-900">Ventas</button>
                                </Link>
                                <Link href="/bodega/traslado">
                                    <button className="bg-purple-800 text-white px-3 py-2 rounded hover:bg-purple-900">Traslado</button>
                                </Link>
                            </>
                        )}
                        <Link href="/bodega/editproduct">
                            <button className="bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-800">Editar</button>
                        </Link>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    {cargando ? 'Cargando...' : `${productos.length} de ${total} producto(s)`}
                </p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {error}
                </div>
            )}

            {productos.length === 0 && !cargando ? (
                <p className="text-gray-500 text-center py-8">No se encontraron productos.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded shadow">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-200 text-left text-sm">
                                <th className="p-2">Stock</th>
                                <th className="p-2">Imagen</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Tarifa</th>
                                <th className="p-2">Bodega</th>
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Código</th>
                                {isAdmin && <th className="p-2">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((p) => (
                                <tr key={p._id} className="border-t hover:bg-gray-50 text-sm">
                                    <td className="p-2">{p.stock}</td>
                                    <td className="p-2">
                                        <button
                                            type="button"
                                            onClick={() => setProductoImagen(p)}
                                            className="group block rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            aria-label={`Ampliar imagen de ${p.nombre}`}
                                            title="Ver imagen ampliada"
                                        >
                                            <img
                                                src={p.imagen || "/noimagen.png"}
                                                className="w-12 h-12 object-cover rounded border border-gray-200 transition-transform group-hover:scale-105"
                                                alt={p.nombre ? `Imagen de ${p.nombre}` : "Imagen del producto"}
                                                loading="lazy"
                                            />
                                        </button>
                                    </td>
                                    <td className="p-2 font-medium">{p.nombre}</td>
                                    <td className="p-2">${p.tarifa_publica}</td>
                                    <td className="p-2">${p.preferentes}</td>
                                    <td className="p-2">{p.tipo_de_joya}</td>
                                    <td className="p-2">{p.codigo_de_barras}</td>
                                    {isAdmin && (
                                        <td className="p-2">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => agregarAlCarrito(p)} className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-700">
                                                    + Carrito
                                                </button>
                                                <button onClick={() => eliminarProducto(p._id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
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

            {hasMore && (
                <div className="text-center mt-4">
                    <button onClick={cargarMas} disabled={cargando} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50">
                        {cargando ? 'Cargando...' : 'Cargar más'}
                    </button>
                </div>
            )}

            {productoImagen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="imagen-producto-titulo"
                    onClick={() => setProductoImagen(null)}
                >
                    <div
                        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                            <h2 id="imagen-producto-titulo" className="truncate text-lg font-semibold">
                                {productoImagen.nombre || "Imagen del producto"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setProductoImagen(null)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Cerrar imagen ampliada"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-100 p-4">
                            <img
                                src={productoImagen.imagen || "/noimagen.png"}
                                alt={productoImagen.nombre ? `Imagen ampliada de ${productoImagen.nombre}` : "Imagen ampliada del producto"}
                                className="max-h-[78vh] max-w-full object-contain"
                            />
                        </div>
                    </div>
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
