'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const isAdmin = user?.role === 'admin';

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="bg-white shadow-md">
            <nav className="container mx-auto p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="text-2xl font-bold text-gray-800">Artesanías Pachy</div>

                {user && (
                    <div className="text-sm text-gray-600">
                        {user.name || user.username} <span className="text-xs">({user.role})</span>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 items-center">
                    <Link href='/'>
                        <button className="bg-gray-700 text-white px-2 py-1 rounded-md hover:bg-gray-600">
                            Inicio
                        </button>
                    </Link>
                    <Link href='/bodega'>
                        <button className="bg-red-800 text-white px-2 py-1 rounded-md hover:bg-red-600">
                            Bodega
                        </button>
                    </Link>

                    {isAdmin && (
                        <>
                            <Link href="/bodega/addproduct">
                                <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700">
                                    + Producto
                                </button>
                            </Link>
                            <Link href="/bodega/ventas">
                                <button className="bg-green-800 text-white px-3 py-1 rounded hover:bg-green-900">
                                    Ventas
                                </button>
                            </Link>
                            <Link href="/bodega/traslado">
                                <button className="bg-purple-800 text-white px-3 py-1 rounded hover:bg-purple-900">
                                    Traslado
                                </button>
                            </Link>
                            <Link href="/cargaimagenes">
                                <button className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                                    Imágenes
                                </button>
                            </Link>
                            <Link href="/usuarios">
                                <button className="bg-pink-600 text-white px-3 py-1 rounded hover:bg-pink-700">
                                    Usuarios
                                </button>
                            </Link>
                        </>
                    )}

                    {user && (
                        <Link href="/bodega/editproduct">
                            <button className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-800">
                                Editar
                            </button>
                        </Link>
                    )}

                    {user && (
                        <button
                            onClick={handleLogout}
                            className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
                        >
                            Salir
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
}
