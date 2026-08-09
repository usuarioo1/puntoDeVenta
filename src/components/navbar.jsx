import React from 'react'
import Link from 'next/link'

const Navbar = () => {
    return (
        <nav className="flex flex-wrap gap-4 p-4 justify-center items-center bg-white/10 backdrop-blur-sm rounded-xl mb-6 shadow-sm border border-white/10">
            <Link href="/bodega/addproduct" passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer">
                    <button className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-800 px-4 py-2 hover:bg-blue-500/40 rounded-lg shadow-lg transition-all duration-300 active:scale-95 font-medium">
                        Agregar Producto
                    </button>
                </a>
            </Link>

            <Link href="/bodega/editproduct" passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer">
                    <button className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 text-yellow-800 px-4 py-2 hover:bg-yellow-500/40 rounded-lg shadow-lg transition-all duration-300 active:scale-95 font-medium">
                        Editar Productos
                    </button>
                </a>
            </Link>

            <Link href="/bodega/ventas" passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer">
                    <button className="bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-800 px-4 py-2 hover:bg-green-500/40 rounded-lg shadow-lg transition-all duration-300 active:scale-95 font-medium">
                        Ver Ventas
                    </button>
                </a>
            </Link>

            <Link href="/bodega/traslado" passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer">
                    <button className="bg-purple-500/20 backdrop-blur-md border border-purple-400/30 text-purple-800 px-4 py-2 hover:bg-purple-500/40 rounded-lg shadow-lg transition-all duration-300 active:scale-95 font-medium">
                        Traslado de Productos
                    </button>
                </a>
            </Link>
        </nav>
    )
}

export default Navbar
