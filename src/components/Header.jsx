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
                        <button className="bg-gray-500/20 backdrop-blur-md border border-gray-400/30 text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-500/40 shadow-sm transition-all duration-300 font-medium">
                            Inicio
                        </button>
                    </Link>
                    <Link href='/bodega'>
                        <button className="bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-500/40 shadow-sm transition-all duration-300 font-medium">
                            Bodega
                        </button>
                    </Link>

                    {isAdmin && (
                        <>
                            <Link href="/bodega/addproduct">
                                <button className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-500/40 shadow-sm transition-all duration-300 font-medium">
                                    + Producto
                                </button>
                            </Link>
                            <Link href="/bodega/ventas">
                                <button className="bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-500/40 shadow-sm transition-all duration-300 font-medium">
                                    Ventas
                                </button>
                            </Link>
                            <Link href="/bodega/traslado">
                                <button className="bg-purple-500/20 backdrop-blur-md border border-purple-400/30 text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-500/40 shadow-sm transition-all duration-300 font-medium">
                                    Traslado
                                </button>
                            </Link>
                            <Link href="/cargaimagenes">
                                <button className="bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-500/40 shadow-sm transition-all duration-300 font-medium">
                                    Imágenes
                                </button>
                            </Link>
                            <Link href="/usuarios">
                                <button className="bg-pink-500/20 backdrop-blur-md border border-pink-400/30 text-pink-800 px-3 py-1.5 rounded-lg hover:bg-pink-500/40 shadow-sm transition-all duration-300 font-medium">
                                    Usuarios
                                </button>
                            </Link>
                        </>
                    )}

                    {user && (
                        <Link href="/bodega/editproduct">
                            <button className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 text-yellow-800 px-3 py-1.5 rounded-lg hover:bg-yellow-500/40 shadow-sm transition-all duration-300 font-medium">
                                Editar
                            </button>
                        </Link>
                    )}

                    {user && (
                        <button
                            onClick={handleLogout}
                            className="bg-gray-400/10 backdrop-blur-md border border-gray-400/20 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-400/30 shadow-sm transition-all duration-300 font-medium"
                        >
                            Salir
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
}
