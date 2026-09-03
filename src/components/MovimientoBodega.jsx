'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import { useBodega } from '@/context/BodegaContext';

const normalizarCodigo = (codigo) => String(codigo ?? '').trim();
const descontarStockMasivoApi = '/api/productosPuntoDeVenta/descontarStockMasivo';
const abastecerTiendaApi = '/api/productosPuntoDeVenta/abastecerTienda';

const CONFIG_MODO = {
    traslado: {
        titulo: 'Traslado de Bodega',
        subtitulo: 'Selecciona productos de bodega para trasladar. Las unidades se descontarán del stock de bodega.',
        etiquetaAccion: 'Descontar Stock',
        cargandoAccion: 'Descontando...',
        tituloResultados: 'Resultados del Descuento de Stock',
        exitososTitulo: 'Productos descontados exitosamente:',
        confirmacion: (n) => `¿Estás seguro de que quieres descontar ${n} producto(s) del stock de bodega?`,
        tituloPDF: 'Detalle de Productos que salen de bodega',
        api: descontarStockMasivoApi,
        esAbastecer: false,
        colorAccion: 'bg-emerald-500 hover:bg-emerald-700',
    },
    abastecer: {
        titulo: 'Abastecer Tienda',
        subtitulo: 'Selecciona productos de bodega para mover unidades al stock de tienda.',
        etiquetaAccion: 'Abastecer Tienda',
        cargandoAccion: 'Abasteciendo...',
        tituloResultados: 'Resultados del Abastecimiento de Tienda',
        exitososTitulo: 'Productos abastecidos exitosamente:',
        confirmacion: (n) => `¿Estás seguro de que quieres abastecer la tienda con ${n} producto(s) seleccionado(s)? Se descontarán de bodega y se sumarán al stock de tienda.`,
        tituloPDF: 'Detalle de Productos que salen de bodega hacia tienda',
        api: abastecerTiendaApi,
        esAbastecer: true,
        colorAccion: 'bg-indigo-500 hover:bg-indigo-700',
    },
};

function MovimientoBodegaContent({ modo }) {
    const config = CONFIG_MODO[modo] ?? CONFIG_MODO.traslado;
    const {
        todosLosProductos,
        productosCargados,
        asegurarProductos,
        actualizarProductosEnCache,
    } = useBodega();
    const [productos, setProductos] = useState([]);
    const [codigoManual, setCodigoManual] = useState("");
    const [cargandoProducto, setCargandoProducto] = useState(false);
    const [productoEncontrado, setProductoEncontrado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [productosSeleccionados, setProductosSeleccionados] = useState(new Set());
    const [descontandoStock, setDescontandoStock] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [resultadosDescuento, setResultadosDescuento] = useState({ exitosos: [], errores: [] });
    const [tituloPDF, setTituloPDF] = useState(""); // Nuevo estado para el título del PDF
    const inputRef = useRef(null);
    const ultimaBusquedaRef = useRef({ codigo: '', ts: 0 });

    const productosPorCodigo = useMemo(() => {
        const indice = new Map();

        todosLosProductos.forEach((producto) => {
            const codigo = normalizarCodigo(producto?.codigo_de_barras);
            if (codigo) indice.set(codigo, producto);
        });

        return indice;
    }, [todosLosProductos]);

    const limpiarCamposTraslado = () => {
        setProductos([]);
        setProductosSeleccionados(new Set());
        setCodigoManual("");
        setProductoEncontrado(null);
        setCantidad(1);
        setTituloPDF("");
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const cerrarResultadosYResetearVista = () => {
        setMostrarResultados(false);
        limpiarCamposTraslado();
    };

    // Enfocar automáticamente el campo de entrada al cargar la página
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const obtenerProductoPorCodigo = useCallback(async (codigo) => {
        const normalizado = normalizarCodigo(codigo);
        if (!normalizado) return null;

        const encontradoEnCache = productosPorCodigo.get(normalizado);
        if (encontradoEnCache) {
            return encontradoEnCache;
        }

        if (!productosCargados) {
            const catalogo = await asegurarProductos();
            return catalogo.find(
                (producto) => normalizarCodigo(producto?.codigo_de_barras) === normalizado
            ) || null;
        }

        return null;
    }, [asegurarProductos, productosCargados, productosPorCodigo]);

    // Buscar producto por código
    const buscarProducto = async (codigoIngresado) => {
        const codigo = normalizarCodigo(codigoIngresado);
        if (!codigo) return;

        const ahora = Date.now();
        if (
            ultimaBusquedaRef.current.codigo === codigo &&
            ahora - ultimaBusquedaRef.current.ts < 500
        ) {
            return;
        }
        ultimaBusquedaRef.current = { codigo, ts: ahora };

        setCargandoProducto(true);
        try {
            const encontrado = await obtenerProductoPorCodigo(codigo);

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

        const codigoProducto = normalizarCodigo(productoEncontrado.codigo_de_barras);

        const productoExistente = productos.find(
            (p) => normalizarCodigo(p.codigo_de_barras) === codigoProducto
        );

        if (productoExistente) {
            setProductos((prev) => prev.map((p) =>
                normalizarCodigo(p.codigo_de_barras) === codigoProducto
                    ? { ...p, cantidad: p.cantidad + cantidad }
                    : p
            ));
        } else {
            setProductos((prev) => [...prev, {
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
        const codigo = normalizarCodigo(e.target.value);
        setCodigoManual(codigo);

        if (codigo.length === 13) {
            buscarProducto(codigo);
        }
    };

    // Manejar envío manual del formulario
    const handleManualSubmit = (e) => {
        e.preventDefault();
        const codigo = normalizarCodigo(codigoManual);
        if (codigo) {
            buscarProducto(codigo);
        }
    };

    // Manejar selección de productos
    const toggleSeleccionProducto = (codigoBarras) => {
        const nuevasSelecciones = new Set(productosSeleccionados);
        if (nuevasSelecciones.has(codigoBarras)) {
            nuevasSelecciones.delete(codigoBarras);
        } else {
            nuevasSelecciones.add(codigoBarras);
        }
        setProductosSeleccionados(nuevasSelecciones);
    };

    // Seleccionar todos o ninguno
    const toggleSeleccionarTodos = () => {
        if (productosSeleccionados.size === productos.length) {
            setProductosSeleccionados(new Set());
        } else {
            setProductosSeleccionados(new Set(productos.map(p => p.codigo_de_barras)));
        }
    };

    // Procesar productos seleccionados según el modo de la página
    const ejecutarAccion = async () => {
        if (productosSeleccionados.size === 0) {
            alert("No hay productos seleccionados");
            return;
        }

        if (!window.confirm(config.confirmacion(productosSeleccionados.size))) return;

        setDescontandoStock(true);

        try {
            // Preparar datos para envío
            const productosParaProcesar = productos
                .filter(p => productosSeleccionados.has(p.codigo_de_barras))
                .map(p => ({
                    id: p._id,
                    cantidad: p.cantidad
                }));

            const response = await axios.put(config.api, {
                productos: productosParaProcesar
            });

            const productosActualizados = (response.data?.exitosos || []).map((item) => (
                config.esAbastecer
                    ? {
                        _id: item.id,
                        stock: item.stockBodegaActual,
                        stock_tienda: item.stockTiendaActual,
                    }
                    : {
                        _id: item.id,
                        stock: item.stockActual,
                    }
            ));

            actualizarProductosEnCache(productosActualizados);
            setResultadosDescuento(response.data);
            setMostrarResultados(true);

        } catch (error) {
            console.error("Error al procesar la operación:", error);
            alert("Error al procesar la operación: " + (error.response?.data?.error || error.message));
        } finally {
            setDescontandoStock(false);
        }
    };

    // Eliminar producto de la lista
    const eliminarProducto = (codigoBarras) => {
        setProductos(productos.filter(p => p.codigo_de_barras !== codigoBarras));
        const nuevasSelecciones = new Set(productosSeleccionados);
        nuevasSelecciones.delete(codigoBarras);
        setProductosSeleccionados(nuevasSelecciones);
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

        // Título principal
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(config.tituloPDF, 10, 15);

        let y = 25;

        // Título personalizado si existe
        if (tituloPDF.trim()) {
            doc.setFontSize(14);
            doc.setFont("helvetica", "normal");
            doc.text(`Destino: ${tituloPDF.trim()}`, 10, y);
            y += 10;
        }

        // Fecha actual
        doc.setFontSize(10);
        doc.setTextColor(100);
        const fechaActual = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${fechaActual}`, 10, y);
        y += 10;

        // Separador
        doc.setDrawColor(200);
        doc.line(10, y, 200, y);
        y += 10;

        // Encabezados de la tabla
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");

        doc.text("Cantidad", 10, y);
        doc.text("Nombre", 50, y);
        doc.text("Precio Bodega", 120, y);
        doc.text("Código de Barras", 160, y);

        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);

        // Productos
        productos.forEach((producto) => {
            doc.text(String(producto.cantidad), 10, y);
            doc.text(producto.nombre, 30, y);
            doc.text(`$${producto.preferentes}`, 130, y);

            const codigoBarras = generarCodigoDeBarras(producto.codigo_de_barras);
            if (codigoBarras) {
                doc.addImage(codigoBarras, "PNG", 150, y - 5, 30, 15);
            }

            y += 15;

            // Nueva página si es necesario
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        // Total de productos
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.text(`Total de productos: ${productos.length}`, 10, y);
        doc.text(`Total de unidades: ${productos.reduce((total, p) => total + p.cantidad, 0)}`, 10, y + 10);

        // Nombre del archivo con título si existe
        const nombreArchivo = tituloPDF.trim()
            ? `productos_${tituloPDF.trim().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
            : "detalle_productos.pdf";

        doc.save(nombreArchivo);
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                {config.titulo}
            </h1>
            <p className="mb-6 text-center text-sm text-gray-600">
                {config.subtitulo}
            </p>

            {/* Campo para título del PDF */}
            <div className="mb-4 flex justify-center">
                <div className="w-full max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título del PDF (Destino de los productos)
                    </label>
                    <input
                        type="text"
                        value={tituloPDF}
                        onChange={(e) => setTituloPDF(e.target.value)}
                        placeholder="Ej: Cliente Juan Pérez, Sucursal Norte, etc."
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

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
                            <p>Stock bodega disponible: {productoEncontrado.stock}</p>
                            {config.esAbastecer && (
                                <p>Stock tienda actual: {productoEncontrado.stock_tienda ?? 0}</p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2">Cantidad:</label>
                            <input
                                type="number"
                                min="1"
                                max={productoEncontrado.stock}
                                value={cantidad}
                                onChange={(e) => setCantidad(Math.max(1, Math.min(productoEncontrado.stock, parseInt(e.target.value) || 1)))}
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

            {/* Modal de resultados del descuento */}
            {mostrarResultados && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
                        <h3 className="text-lg font-medium mb-4">{config.tituloResultados}</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Total procesados: {resultadosDescuento.totalProcesados} |
                                Exitosos: {resultadosDescuento.totalExitosos} |
                                Errores: {resultadosDescuento.totalErrores}
                            </p>
                        </div>

                        {resultadosDescuento.exitosos.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-medium text-green-600 mb-2">{config.exitososTitulo}</h4>
                                <div className="space-y-1">
                                    {resultadosDescuento.exitosos.map((item, index) => (
                                        <p key={index} className="text-sm text-green-700">
                                            {config.esAbastecer
                                                ? `${item.nombre}: +${item.cantidadTransferida} tienda (Bodega: ${item.stockBodegaAnterior} → ${item.stockBodegaActual} | Tienda: ${item.stockTiendaAnterior} → ${item.stockTiendaActual})`
                                                : `${item.nombre}: -${item.cantidadDescontada} bodega (Stock: ${item.stockAnterior} → ${item.stockActual})`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {resultadosDescuento.errores.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-medium text-red-600 mb-2">Errores:</h4>
                                <div className="space-y-1">
                                    {resultadosDescuento.errores.map((error, index) => (
                                        <p key={index} className="text-sm text-red-700">
                                            {error.nombre || error.id}: {error.error}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={cerrarResultadosYResetearVista}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-center gap-4 mb-6">
                <button
                    onClick={exportarPDF}
                    disabled={productos.length === 0}
                    className={`px-6 py-2 text-white font-semibold rounded-lg shadow-md transition ${
                        productos.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
                    }`}
                >
                    Exportar a PDF
                </button>

                <button
                    onClick={ejecutarAccion}
                    disabled={productosSeleccionados.size === 0 || descontandoStock}
                    className={`px-6 py-2 text-white font-semibold rounded-lg shadow-md transition flex items-center justify-center min-w-[200px] ${
                        productosSeleccionados.size === 0 || descontandoStock
                            ? 'bg-gray-400 cursor-not-allowed'
                            : config.colorAccion
                    }`}
                >
                    {descontandoStock ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {config.cargandoAccion}
                        </>
                    ) : (
                        `${config.etiquetaAccion} (${productosSeleccionados.size})`
                    )}
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
                    <div className="mb-4 flex items-center gap-4">
                        <button
                            onClick={toggleSeleccionarTodos}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                        >
                            {productosSeleccionados.size === productos.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                        <span className="text-sm text-gray-600">
                            {productosSeleccionados.size} de {productos.length} productos seleccionados
                        </span>
                    </div>

                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Seleccionar</th>
                                <th className="py-3 px-6 text-left">Cantidad</th>
                                <th className="py-3 px-6 text-left">Nombre</th>
                                <th className="py-3 px-6 text-left">Precio Bodega</th>
                                <th className="py-3 px-6 text-left">Código de Barras</th>
                                <th className="py-3 px-6 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {productos.map((producto, index) => (
                                <tr key={index} className={`border-b border-gray-200 hover:bg-gray-100 ${
                                    productosSeleccionados.has(producto.codigo_de_barras) ? 'bg-blue-50' : ''
                                }`}>
                                    <td className="py-3 px-6">
                                        <input
                                            type="checkbox"
                                            checked={productosSeleccionados.has(producto.codigo_de_barras)}
                                            onChange={() => toggleSeleccionProducto(producto.codigo_de_barras)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="py-3 px-6">
                                        <input
                                            type="number"
                                            min="1"
                                            max={producto.stock}
                                            value={producto.cantidad}
                                            onChange={(e) => {
                                                const newCantidad = Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1));
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
                                    <td className="py-3 px-6">
                                        <button
                                            onClick={() => eliminarProducto(producto.codigo_de_barras)}
                                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                                        >
                                            Eliminar
                                        </button>
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

export default function MovimientoBodega({ modo }) {
    return <MovimientoBodegaContent modo={modo} />;
}
