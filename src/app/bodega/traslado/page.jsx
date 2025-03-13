'use client';
import { useState, useEffect, useRef } from 'react'; // Importar useRef y useEffect
import jsPDF from 'jspdf';
import axios from 'axios';
import JsBarcode from 'jsbarcode'; 
import { apiBase } from '@/endpoints/api';

export default function GenerarPDF() {
    const [productos, setProductos] = useState([]);
    const [codigoManual, setCodigoManual] = useState("");
    const inputRef = useRef(null); // Referencia para el campo de entrada

    // Enfocar automáticamente el campo de entrada al cargar la página
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Función para agregar un producto
    const agregarProducto = async (codigo) => {
        try {
            // Obtener todos los productos
            const res = await axios.get(`${apiBase}/productosPuntoDeVenta`);
            const todosLosProductos = res.data.productos;

            // Buscar el producto por código de barras
            const productoEncontrado = todosLosProductos.find(
                (producto) => producto.codigo_de_barras === codigo
            );

            if (productoEncontrado) {
                // Verificar si el producto ya está en la lista
                const productoExistente = productos.find(
                    (producto) => producto.codigo_de_barras === productoEncontrado.codigo_de_barras
                );

                if (productoExistente) {
                    // Si el producto ya existe, incrementar la cantidad
                    const nuevosProductos = productos.map((producto) =>
                        producto.codigo_de_barras === productoEncontrado.codigo_de_barras
                            ? { ...producto, cantidad: producto.cantidad + 1 }
                            : producto
                    );
                    setProductos(nuevosProductos);
                } else {
                    // Si el producto no existe, agregarlo con cantidad 1
                    setProductos([...productos, { ...productoEncontrado, cantidad: 1 }]);
                }

                setCodigoManual(""); // Limpiar el campo de entrada después de agregar el producto
                if (inputRef.current) {
                    inputRef.current.focus(); // Enfocar el campo de entrada nuevamente
                }
            } else {
                console.error("Producto no encontrado");
                alert("Producto no encontrado");
            }
        } catch (error) {
            console.error("Error al obtener productos:", error);
        }
    };

    // Manejar el cambio en el campo de entrada
    const handleCodigoChange = (e) => {
        const codigo = e.target.value;
        setCodigoManual(codigo);

        // Si el código tiene una longitud válida (por ejemplo, 13 dígitos para códigos de barras), agregar el producto
        if (codigo.length === 13) { // Ajusta la longitud según el formato de tus códigos de barras
            agregarProducto(codigo);
        }
    };

    // Manejar el envío manual del formulario
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (codigoManual.trim()) {
            agregarProducto(codigoManual);
        }
    };

    // Generar código de barras
    const generarCodigoDeBarras = (codigo) => {
        if (!codigo || typeof codigo !== "string") {
            return "";
        }
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
// Exportar a PDF
const exportarPDF = () => {
    const doc = new jsPDF();

    // Título más pequeño
    doc.setFontSize(14); // Reducir el tamaño del título
    doc.text("Detalle de Productos que salen de bodega", 10, 10); // Mover el título más a la izquierda

    let y = 20; // Empezar más arriba
    doc.setFontSize(10); // Reducir el tamaño de la fuente
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");

    // Ajustar las posiciones x de las columnas
    doc.text("Cantidad", 10, y); // Columna 1 (más a la izquierda)
    doc.text("Nombre", 50, y); // Columna 2
    doc.text("Precio Mayorista", 120, y); // Columna 3 (más a la derecha)
    doc.text("Código de Barras", 160, y); // Columna 4 (más a la derecha)

    y += 8; // Espaciado más pequeño entre filas
    doc.setFont("helvetica", "normal");
    productos.forEach((producto) => {
        // Ajustar las posiciones x de las columnas
        doc.text(String(producto.cantidad), 10, y); // Columna 1
        doc.text(producto.nombre, 30, y); // Columna 2
        doc.text(`$${producto.mayorista}`, 130, y); // Columna 3

        // Generar y agregar la imagen del código de barras
        const codigoBarras = generarCodigoDeBarras(producto.codigo_de_barras);
        if (codigoBarras) {
            doc.addImage(codigoBarras, "PNG", 160, y - 5, 30, 15); // Columna 4 (más a la derecha)
        }

        y += 15; // Espaciado más pequeño entre filas
    });

    doc.save("detalle_productos.pdf");
};
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                Generar PDF de Productos
            </h1>

            <form onSubmit={handleManualSubmit} className="mb-4 flex justify-center gap-2">
                <input
                    type="text"
                    value={codigoManual}
                    onChange={handleCodigoChange}
                    placeholder="Escanear o ingresar código de barras"
                    className="p-2 border rounded-md shadow-sm"
                    ref={inputRef} // Asignar la referencia al campo de entrada
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700 transition"
                >
                    Agregar Producto
                </button>
            </form>

            <div className="flex justify-center mb-6">
                <button
                    onClick={exportarPDF}
                    className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
                >
                    Exportar a PDF
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg">
                    <thead>
                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Cantidad</th>
                            <th className="py-3 px-6 text-left">Nombre</th>
                            <th className="py-3 px-6 text-left">Precio Mayorista</th>
                            <th className="py-3 px-6 text-left">Código de Barras</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm">
                        {productos.map((producto, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-3 px-6">{producto.cantidad}</td>
                                <td className="py-3 px-6">{producto.nombre}</td>
                                <td className="py-3 px-6">${producto.mayorista}</td>
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
        </div>
    );
}