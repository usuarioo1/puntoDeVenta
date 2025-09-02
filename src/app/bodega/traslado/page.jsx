'use client';
import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import axios from 'axios';
import JsBarcode from 'jsbarcode'; 
import { apiBase } from '@/endpoints/api';

export default function GenerarPDF() {
    const [productos, setProductos] = useState([]);
    const [codigoManual, setCodigoManual] = useState("");
    const [cargandoProducto, setCargandoProducto] = useState(false);
    const [productoEncontrado, setProductoEncontrado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const inputRef = useRef(null);

    // Enfocar automáticamente el campo de entrada al cargar la página
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Buscar producto por código
    const buscarProducto = async (codigo) => {
        setCargandoProducto(true);
        try {
            const res = await axios.get(`${apiBase}/productosPuntoDeVenta`);
            const encontrado = res.data.productos.find(
                p => p.codigo_de_barras === codigo
            );
            
            if (encontrado) {
                setProductoEncontrado(encontrado);
                setCantidad(1); // Resetear cantidad a 1 por defecto
            } else {
                alert("Producto no encontrado");
                setCodigoManual("");
            }
        } catch (error) {
            console.error("Error al buscar producto:", error);
            alert("Error al buscar el producto");
        } finally {
            setCargandoProducto(false);
        }
    };

    // Confirmar y agregar producto con la cantidad especificada
    const confirmarAgregarProducto = () => {
        if (!productoEncontrado || cantidad < 1) return;
        
        const productoExistente = productos.find(
            p => p.codigo_de_barras === productoEncontrado.codigo_de_barras
        );

        if (productoExistente) {
            setProductos(productos.map(p =>
                p.codigo_de_barras === productoEncontrado.codigo_de_barras
                    ? { ...p, cantidad: p.cantidad + cantidad }
                    : p
            ));
        } else {
            setProductos([...productos, { 
                ...productoEncontrado, 
                cantidad: cantidad 
            }]);
        }

        // Resetear estado
        setProductoEncontrado(null);
        setCodigoManual("");
        setCantidad(1);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Manejar cambio en el campo de código
    const handleCodigoChange = (e) => {
        const codigo = e.target.value;
        setCodigoManual(codigo);

        if (codigo.length === 13) {
            buscarProducto(codigo);
        }
    };

    // Manejar envío manual del formulario
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (codigoManual.trim()) {
            buscarProducto(codigoManual);
        }
    };

    // Generar código de barras
    const generarCodigoDeBarras = (codigo) => {
        if (!codigo || typeof codigo !== "string") return "";
        const canvas = document.createElement('canvas');
        try {
            JsBarcode(canvas, codigo, { format: "CODE128", width: 2, height: 40 });
            return canvas.toDataURL();
        } catch (error) {
            console.error("Error al generar código de barras:", error);
            return "";
        }
    };

    // Exportar a PDF
    const exportarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Detalle de Productos que salen de bodega", 10, 10);

        let y = 20;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");

        doc.text("Cantidad", 10, y);
        doc.text("Nombre", 50, y);
        doc.text("Precio Bodega", 120, y);
        doc.text("Código de Barras", 160, y);

        y += 8;
        doc.setFont("helvetica", "normal");
        productos.forEach((producto) => {
            doc.text(String(producto.cantidad), 10, y);
            doc.text(producto.nombre, 30, y);
            doc.text(`$${producto.preferentes}`, 130, y);

            const codigoBarras = generarCodigoDeBarras(producto.codigo_de_barras);
            if (codigoBarras) {
                doc.addImage(codigoBarras, "PNG", 160, y - 5, 30, 15);
            }

            y += 15;
        });

        doc.save("detalle_productos.pdf");
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                Generar PDF de Productos
            </h1>

            {/* Formulario de búsqueda */}
            <form onSubmit={handleManualSubmit} className="mb-4 flex justify-center gap-2">
                <input
                    type="text"
                    value={codigoManual}
                    onChange={handleCodigoChange}
                    placeholder="Escanear o ingresar código de barras"
                    className="p-2 border rounded-md shadow-sm"
                    ref={inputRef}
                    disabled={cargandoProducto || productoEncontrado}
                />
                <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-md transition flex items-center justify-center min-w-[150px] ${
                        cargandoProducto ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-700'
                    }`}
                    disabled={cargandoProducto || productoEncontrado}
                >
                    {cargandoProducto ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando...
                        </>
                    ) : (
                        'Buscar Producto'
                    )}
                </button>
            </form>

            {/* Modal para especificar cantidad */}
            {productoEncontrado && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Confirmar Producto</h3>
                        <div className="mb-4">
                            <p className="font-semibold">{productoEncontrado.nombre}</p>
                            <p>Código: {productoEncontrado.codigo_de_barras}</p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block mb-2">Cantidad:</label>
                            <input
                                type="number"
                                min="1"
                                value={cantidad}
                                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setProductoEncontrado(null);
                                    setCodigoManual("");
                                    if (inputRef.current) inputRef.current.focus();
                                }}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarAgregarProducto}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón Exportar PDF */}
            <div className="flex justify-center mb-6">
                <button
                    onClick={exportarPDF}
                    disabled={productos.length === 0}
                    className={`px-6 py-2 text-white font-semibold rounded-lg shadow-md transition ${
                        productos.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
                    }`}
                >
                    Exportar a PDF
                </button>
            </div>

            {/* Tabla de productos */}
            {productos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {cargandoProducto ? (
                        <div className="inline-flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando producto...
                        </div>
                    ) : (
                        "No hay productos agregados"
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Cantidad</th>
                                <th className="py-3 px-6 text-left">Nombre</th>
                                <th className="py-3 px-6 text-left">Precio Bodega</th>
                                <th className="py-3 px-6 text-left">Código de Barras</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {productos.map((producto, index) => (
                                <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6">
                                        <input
                                            type="number"
                                            min="1"
                                            value={producto.cantidad}
                                            onChange={(e) => {
                                                const newCantidad = Math.max(1, parseInt(e.target.value) || 1);
                                                setProductos(productos.map(p => 
                                                    p.codigo_de_barras === producto.codigo_de_barras 
                                                        ? { ...p, cantidad: newCantidad } 
                                                        : p
                                                ));
                                            }}
                                            className="w-16 p-1 border rounded"
                                        />
                                    </td>
                                    <td className="py-3 px-6">{producto.nombre}</td>
                                    <td className="py-3 px-6">${producto.preferentes}</td>
                                    <td className="py-3 px-6">
                                        {producto.codigo_de_barras && (
                                            <img
                                                src={generarCodigoDeBarras(producto.codigo_de_barras)}
                                                alt="Código de Barras"
                                                className="w-24 h-12 object-cover"
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}