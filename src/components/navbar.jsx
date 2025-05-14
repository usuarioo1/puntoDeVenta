import React from 'react'

const navbar = () => {
    return (
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
    )
}

export default navbar
