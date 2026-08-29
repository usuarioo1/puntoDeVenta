'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HomePage() {
    const { user, loading, logout, isPosOnlyUser, canAccessBodega, canAccessPuntoDeVenta, getDefaultRoute } = useAuth();
    const router = useRouter();
    const usuarioSoloPuntoDeVenta = isPosOnlyUser(user);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace('/login');
        if (user && usuarioSoloPuntoDeVenta) {
            router.replace(getDefaultRoute(user));
        }
    }, [user, loading, router, usuarioSoloPuntoDeVenta, getDefaultRoute]);

    if (loading || !user || usuarioSoloPuntoDeVenta) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">
                Bienvenido, {user.name || user.username}
            </h1>
            <p className="text-sm text-gray-600 mb-8">
                Rol: <span className="font-semibold">{user.role}</span>
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
                {canAccessBodega(user) && (
                    <Link href="/bodega">
                        <button className="w-full text-2xl bg-red-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-red-700 transition duration-300">
                            Bodega
                        </button>
                    </Link>
                )}

                {canAccessPuntoDeVenta(user) && (
                    <Link href="/punto-de-venta">
                        <button className="w-full text-2xl bg-blue-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-800 transition duration-300">
                            Punto de Venta
                        </button>
                    </Link>
                )}

                {isAdmin && (
                    <Link href="/cargaimagenes">
                        <button className="w-full text-lg bg-purple-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-purple-700 transition duration-300">
                            Carga masiva de imágenes
                        </button>
                    </Link>
                )}

                <button
                    onClick={() => { logout(); router.push('/login'); }}
                    className="w-full text-sm bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}
