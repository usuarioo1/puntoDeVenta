import React from 'react'
import Link from 'next/link'

const page = () => {
  return (
    <div className=' flex flex-col items-center justify-center h-screen bg-gray-100'>
      <Link href='/bodega'>
        <div className='mb-4'>
          <button className='text-2xl bg-red-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition duration-300'>
            Bodega
          </button>
        </div>
      </Link>
      <Link href='/punto-de-venta'>
        <div>
          <button className='text-2xl bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-800 transition duration-300'>
            Punto de Venta
          </button>
        </div>
      </Link>
    </div>
  )
}

export default page