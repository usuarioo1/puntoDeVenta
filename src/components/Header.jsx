import React from 'react'
import Link from 'next/link'

const Header = () => {
    return (
        <header className='bg-white shadow-md'>
            <nav className='container mx-auto p-4 flex justify-between items-center'>
                <div className='text-2xl font-bold text-gray-800'>
                    Artesanías Pachy
                </div>
                <>
                    <Link href="/bodega/addproduct" passHref legacyBehavior>
                        <a target="_blank" rel="noopener noreferrer">
                            <button className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 rounded">
                                Agregar Producto
                            </button>
                        </a>
                    </Link>

                    <Link href="/bodega/editproduct" passHref legacyBehavior>
                        <a target="_blank" rel="noopener noreferrer">
                            <button className="bg-yellow-600 text-white px-4 py-2 hover:bg-yellow-800 rounded">
                                Editar Productos
                            </button>
                        </a>
                    </Link>

                    <Link href="/bodega/ventas" passHref legacyBehavior>
                        <a target="_blank" rel="noopener noreferrer">
                            <button className="bg-green-800 text-white px-4 py-2 hover:bg-green-900 rounded">
                                Ver Ventas
                            </button>
                        </a>
                    </Link>

                    <Link href="/bodega/traslado" passHref legacyBehavior>
                        <a target="_blank" rel="noopener noreferrer">
                            <button className="bg-purple-800 text-white px-4 py-2 hover:bg-purple-900 rounded">
                                Traslado de Productos
                            </button>
                        </a>
                    </Link>
                </>
            </nav>
        </header>
    )
}

export default Header