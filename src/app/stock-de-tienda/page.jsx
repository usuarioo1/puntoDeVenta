"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBodega } from "@/context/BodegaContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const TIPOS_DE_JOYAS = [
    "AROS", "CONJUNTO", "COLGANTE", "CADENA", "ANILLO", "CAJA", "PIERCING",
];
const PAGE_SIZE = 100;

const stockTiendaDe = (producto) => Number(producto?.stock_tienda ?? 0);

function StockTiendaContent() {
    const { user, logout } = useAuth();
    const {
        todosLosProductos,
        cargando: cargandoCatalogo,
        sincronizando,
        error: errorCatalogo,
    } = useBodega();
    const router = useRouter();

    const [skip, setSkip] = useState(0);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [tipo, setTipo] = useState("");
    const [productoImagen, setProductoImagen] = useState(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setSkip(0);
            setSearch(searchInput);
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [searchInput]);

    useEffect(() => {
        setSkip(0);
    }, [tipo]);

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

    const productosFiltrados = useMemo(() => {
        const termino = search.trim().toLowerCase();
        const tipoSeleccionado = tipo.trim().toLowerCase();

        return todosLosProductos
            .filter((producto) => stockTiendaDe(producto) > 0)
            .filter((producto) => {
                const nombre = String(producto?.nombre ?? '').toLowerCase();
                const codigo = String(producto?.codigo_de_barras ?? '').toLowerCase();
                const tipoDeJoya = String(producto?.tipo_de_joya ?? '').toLowerCase();

                const coincideBusqueda = !termino || nombre.includes(termino) || codigo.includes(termino);
                const coincideTipo = !tipoSeleccionado || tipoDeJoya === tipoSeleccionado;

                return coincideBusqueda && coincideTipo;
            });
    }, [search, tipo, todosLosProductos]);

    const total = productosFiltrados.length;
    const unidadesTotales = useMemo(
        () => productosFiltrados.reduce((sum, producto) => sum + stockTiendaDe(producto), 0),
        [productosFiltrados]
    );
    const limiteActual = skip + PAGE_SIZE;
    const productos = useMemo(
        () => productosFiltrados.slice(0, limiteActual),
        [limiteActual, productosFiltrados]
    );
    const hasMore = productos.length < total;
    const cargando = cargandoCatalogo && todosLosProductos.length === 0;

    const cargarMas = () => {
        setSkip((prev) => prev + PAGE_SIZE);
    };

    const handleLogout = () => {
        if (window.confirm("¿Cerrar sesión?")) {
            logout();
            router.push('/login');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Stock de Tienda</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 font-medium">
                        {user?.name || user?.username} <span className="text-xs opacity-75">({user?.role})</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-800 px-4 py-2 rounded-lg hover:bg-red-500/40 shadow-sm transition-all duration-300 active:scale-95 font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Buscar</label>
                        <input
                            type="text"
                            placeholder="Nombre o código de barras..."
                            value={searchInput}
                            onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                            className="border border-gray-300/50 bg-white/50 backdrop-blur-sm p-2 w-full rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Tipo de joya</label>
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            className="border border-gray-300/50 bg-white/50 backdrop-blur-sm p-2 w-full rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        >
                            <option value="">Todos</option>
                            {TIPOS_DE_JOYAS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-2 flex-wrap">
                        <Link href="/bodega">
                            <button className="bg-gray-500/20 backdrop-blur-md border border-gray-400/30 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-500/40 shadow-sm transition-all duration-300 active:scale-95 font-medium">
                                ← Bodega
                            </button>
                        </Link>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    {cargando
                        ? 'Cargando catálogo...'
                        : sincronizando
                            ? `Actualizando catálogo... ${productos.length} de ${total} producto(s) en tienda`
                            : `${productos.length} de ${total} producto(s) en tienda — ${unidadesTotales} unidad(es) en total`}
                </p>
            </div>

            {errorCatalogo && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {errorCatalogo}
                </div>
            )}

            {productos.length === 0 && !cargando ? (
                <p className="text-gray-500 text-center py-8">No hay productos con stock en tienda.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded shadow">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-200 text-left text-sm">
                                <th className="p-2">Stock Tienda</th>
                                <th className="p-2">Imagen</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Código</th>
                                <th className="p-2">Precio Mayor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((p) => (
                                <tr key={p._id} className="border-t hover:bg-gray-50 text-sm">
                                    <td className="p-2 font-semibold">{stockTiendaDe(p)}</td>
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
                                    <td className="p-2">{p.tipo_de_joya}</td>
                                    <td className="p-2">{p.codigo_de_barras}</td>
                                    <td className="p-2">${Number(p.mayorista ?? 0).toFixed(0)}</td>
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

export default function StockTiendaPage() {
    return (
        <ProtectedRoute>
            <StockTiendaContent />
        </ProtectedRoute>
    );
}
