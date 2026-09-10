'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";
import { useAuth } from "@/context/AuthContext";
import { useBodega } from "@/context/BodegaContext";
import ProtectedRoute from "@/components/ProtectedRoute";


//accede vendedor corregido

const normalizarCodigo = (codigo) => String(codigo ?? "").trim();
const stockTiendaDisponible = (producto) => Number(producto?.stock_tienda ?? 0);

function VentaContent() {
    const { logout } = useAuth();
    const {
        todosLosProductos: productos,
        productosCargados,
        cargando: cargandoCatalogo,
        error: errorCatalogo,
        asegurarProductos,
        actualizarProductosEnCache,
    } = useBodega();
    const router = useRouter();

    const { carrito, vaciarCarrito, agregarAlCarrito, eliminarDelCarrito } = useCarrito();
    const [codigoBarras, setCodigoBarras] = useState("");
    const [ventaIniciada, setVentaIniciada] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const [tipoVenta, setTipoVenta] = useState("mayor");
    const [tipoPago, setTipoPago] = useState("efectivo");
    const [numeroBoleta, setNumeroBoleta] = useState("");
    const [tipoDocumento, setTipoDocumento] = useState("boleta");
    const [confirmandoVenta, setConfirmandoVenta] = useState(false);
    const cargandoProductos = cargandoCatalogo && !productosCargados;

    const productosPorCodigo = useMemo(() => {
        const indice = new Map();
        productos.forEach((producto) => {
            const codigo = normalizarCodigo(producto?.codigo_de_barras);
            if (codigo) {
                indice.set(codigo, producto);
            }
        });
        return indice;
    }, [productos]);

    const obtenerProductoPorCodigo = useCallback((codigo) => {
        return productosPorCodigo.get(normalizarCodigo(codigo));
    }, [productosPorCodigo]);

    const handleLogout = () => {
        vaciarCarrito();
        logout();
        router.push('/login');
    };

    useEffect(() => {
        if (!errorCatalogo || productosCargados) return;
        setMensaje(`Error al cargar productos: ${errorCatalogo}`);
    }, [errorCatalogo, productosCargados]);

    const iniciarVenta = () => {
        setVentaIniciada(true);
        vaciarCarrito();
        setMensaje("");
    };

    const agregarAlCarritoHandler = useCallback((codigo = null) => {
        const codigoABuscar = normalizarCodigo(codigo || codigoBarras);
        
        if (!codigoABuscar) {
            setMensaje("Ingrese un código de barras");
            return;
        }

        if (cargandoProductos) {
            setMensaje("Cargando productos, intente nuevamente en unos segundos");
            return;
        }

        if (!productosCargados) {
            setMensaje("Cargando catálogo, intente nuevamente en unos segundos");
            void asegurarProductos().catch((error) => {
                console.error("Error al cargar productos:", error);
                setMensaje("Error al cargar productos: " + (error.response?.data?.error || error.message));
            });
            return;
        }
        
        if (!Array.isArray(productos) || productos.length === 0) {
            setMensaje("No hay productos cargados");
            return;
        }
        
        const producto = obtenerProductoPorCodigo(codigoABuscar);
        
        if (producto) {
            const stockDisponible = stockTiendaDisponible(producto);
            const cantidadActual = carrito.find((item) => item._id === producto._id)?.cantidad || 0;

            if (stockDisponible <= 0) {
                setMensaje(`Producto "${producto.nombre}" sin stock en tienda`);
                return;
            }

            if (cantidadActual >= stockDisponible) {
                setMensaje(`Stock de tienda insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}`);
                return;
            }

            agregarAlCarrito(producto);
            setCodigoBarras("");
            setMensaje(`Producto "${producto.nombre}" agregado al carrito`);
        } else {
            setMensaje(`Producto con código ${codigoABuscar} no encontrado`);
        }
    }, [
        codigoBarras,
        cargandoProductos,
        productos,
        carrito,
        obtenerProductoPorCodigo,
        agregarAlCarrito,
    ]);

    const confirmarVenta = async () => {
        if (confirmandoVenta) return;

        if (carrito.length === 0) {
            setMensaje("No hay productos en el carrito");
            return;
        }

        if (!numeroBoleta.trim()) {
            setMensaje(`Ingrese el número de ${tipoDocumento === "boleta" ? "boleta" : "factura"}`);
            return;
        }

        setConfirmandoVenta(true);
        setMensaje("Procesando venta, actualizando stock...");

        try {
            const total = tipoVenta === "mayor" 
                ? carrito.reduce((sum, item) => sum + item.mayorista * item.cantidad, 0)
                : carrito.reduce((sum, item) => sum + item.tarifa_publica * item.cantidad, 0);

            const response = await axios.post('/api/ventas/registrar', {
                productos: carrito.map(item => ({
                    producto: item._id,
                    cantidad: item.cantidad,
                    nombre: item.nombre,   
                    codigo: item.codigo_de_barras, 
                    tipoVenta: tipoVenta, 
                    tipoPago: tipoPago,   
                    numeroBoleta: numeroBoleta,
                    tipoDocumento: tipoDocumento
                })),
                total
            });

            const cantidadesPorProducto = carrito.reduce((acumulado, item) => {
                acumulado.set(item._id, (acumulado.get(item._id) || 0) + Number(item.cantidad || 0));
                return acumulado;
            }, new Map());

            const productosActualizados = Array.from(cantidadesPorProducto.entries())
                .map(([productoId, cantidad]) => {
                    const productoActual = productos.find((item) => item._id === productoId) || carrito.find((item) => item._id === productoId);
                    if (!productoActual) return null;

                    return {
                        _id: productoId,
                        stock_tienda: Math.max(stockTiendaDisponible(productoActual) - cantidad, 0)
                    };
                })
                .filter(Boolean);

            actualizarProductosEnCache(productosActualizados);

            const resumenStock = response.data?.stock;
            const erroresStock = resumenStock?.errores || [];
            if (erroresStock.length > 0) {
                setMensaje(
                    `Venta registrada, pero hubo problemas al descontar stock: ` +
                    erroresStock.map((e) => `${e.nombre || e.id}: ${e.error}`).join(' | ')
                );
            } else {
                setMensaje(response.data?.mensaje || "Venta realizada con éxito");
            }
            vaciarCarrito();
            setVentaIniciada(false);

            // Reiniciar los campos
            setNumeroBoleta("");
        } catch (error) {
            console.error("Error al confirmar venta:", error);
            setMensaje("Error al confirmar venta: " + (error.response?.data?.error || error.message));
        } finally {
            setConfirmandoVenta(false);
        }
    };

    useEffect(() => {
        let buffer = "";
        let timeout = null;
    
        const handleKeyPress = (e) => {
            if (ventaIniciada && !confirmandoVenta) {
                if (timeout) clearTimeout(timeout);
                
                // Solo procesar caracteres imprimibles o Enter
                if (e.key.length === 1 || e.key === "Enter") {
                    // Evitar que el evento se procese en inputs
                    if (document.activeElement.tagName === "INPUT" || 
                        document.activeElement.tagName === "SELECT") {
                        return;
                    }
                    
                    if (e.key.length === 1) {
                        buffer += e.key;
                    }
            
                    if (e.key === "Enter" && buffer.length > 0) {
                        // Buscar y agregar producto directamente con el buffer
                        const tempBuffer = normalizarCodigo(buffer); // Guardar buffer antes de limpiarlo
                        buffer = "";
                        agregarAlCarritoHandler(tempBuffer);
                    }
            
                    timeout = setTimeout(() => {
                        buffer = "";
                    }, 300);
                }
            }
        };
    
        window.addEventListener("keydown", handleKeyPress);
    
        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            if (timeout) clearTimeout(timeout);
        };
    }, [ventaIniciada, agregarAlCarritoHandler]);
    
    const totalTarifaPublica = carrito.reduce((sum, item) => sum + item.tarifa_publica * item.cantidad, 0);
    const totalMayorista = carrito.reduce((sum, item) => sum + item.mayorista * item.cantidad, 0);
    const totalActual = tipoVenta === "mayor" ? totalMayorista : totalTarifaPublica;

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Punto de Venta</h1>
                <button 
                    onClick={handleLogout} 
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 text-lg"
                >
                    Cerrar Sesión
                </button>
            </div>

            <p className="mb-4 text-base text-gray-600">
                Las ventas descuentan unidades desde el stock de tienda.
            </p>
            
            {mensaje && (
                <div className={`p-3 my-3 rounded text-lg ${mensaje.includes("Error") || mensaje.includes("no encontrado") 
                    ? "bg-red-100 text-red-700" 
                    : "bg-green-100 text-green-700"}`}>
                    {mensaje}
                </div>
            )}
            
            {!ventaIniciada ? (
                <button onClick={iniciarVenta} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-800 text-lg">
                    Iniciar Venta
                </button>
            ) : (
                <>
                    <div className="mb-4 flex items-center">
                        <input
                            type="text"
                            placeholder="Escanear o ingresar código de barras"
                            value={codigoBarras}
                            onChange={(e) => setCodigoBarras(normalizarCodigo(e.target.value))}
                            className="border p-2 mr-2 flex-grow text-lg"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    agregarAlCarritoHandler();
                                }
                            }}
                        />
                        <button onClick={() => agregarAlCarritoHandler()} className="bg-blue-500 text-white px-4 py-2 rounded text-lg">
                            Agregar
                        </button>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">Carrito - {carrito.length} producto(s)</h2>
                    
                    {carrito.length > 0 ? (
                        <table className="min-w-full bg-white border">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border text-lg">Imagen</th>
                                    <th className="py-2 px-4 border text-lg">Descripción</th>
                                    <th className="py-2 px-4 border text-lg">Código</th>
                                    <th className="py-2 px-4 border text-lg">Stock Tienda</th>
                                    <th className="py-2 px-4 border text-lg">Cantidad</th>
                                    <th className="py-2 px-4 border text-lg">Tarifa Pública</th>
                                    <th className="py-2 px-4 border text-lg">Mayorista</th>
                                    <th className="py-2 px-4 border text-lg">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.map((item, index) => (
                                    <tr key={index} className="border">
                                        <td className="py-2 px-4 border text-lg">
                                            {item.imagen ? (
                                                <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover" />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                                                    Sin imagen
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 border text-lg">{item.nombre}</td>
                                        <td className="py-2 px-4 border text-lg">{item.codigo_de_barras}</td>
                                        <td className="py-2 px-4 border text-center text-lg">{stockTiendaDisponible(item)}</td>
                                        <td className="py-2 px-4 border text-lg">
                                            <div className="flex items-center">
                                                <button 
                                                    onClick={() => {
                                                        if (item.cantidad > 1) {
                                                            agregarAlCarrito({...item, cantidad: -1});
                                                        }
                                                    }}
                                                    className="bg-gray-300 px-2 py-1 rounded text-lg"
                                                >
                                                    -
                                                </button>
                                                <span className="mx-2">{item.cantidad}</span>
                                                <button 
                                                    onClick={() => {
                                                        const stockDisponible = stockTiendaDisponible(item);
                                                        if (item.cantidad >= stockDisponible) {
                                                            setMensaje(`Stock de tienda insuficiente para "${item.nombre}". Disponible: ${stockDisponible}`);
                                                            return;
                                                        }

                                                        agregarAlCarrito({ ...item, cantidad: 1 });
                                                    }}
                                                    className="bg-gray-300 px-2 py-1 rounded text-lg"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 border text-lg">${item.tarifa_publica.toFixed(0)}</td>
                                        <td className="py-2 px-4 border text-lg">${item.mayorista.toFixed(0)}</td>
                                        <td className="py-2 px-4 border text-lg">
                                            <button 
                                                onClick={() => eliminarDelCarrito(item._id)} 
                                                className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-700 text-lg"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="bg-yellow-100 p-4 rounded text-lg">
                            No hay productos en el carrito. Escanee o ingrese un código para agregar productos.
                        </div>
                    )}

                    {carrito.length > 0 && (
                        <>
                            <h2 className="text-2xl font-bold mt-6">Totales</h2>
                            <table className="min-w-full bg-white border">
                                <thead>
                                    <tr>
                                        <th className="py-2 px-4 border text-lg">Total Tarifa Pública</th>
                                        <th className="py-2 px-4 border text-lg">Total Mayorista</th>
                                        <th className="py-2 px-4 border text-lg">Total a Cobrar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-2 px-4 border text-center text-lg">${totalTarifaPublica.toFixed(0)}</td>
                                        <td className="py-2 px-4 border text-center text-lg">${totalMayorista.toFixed(0)}</td>
                                        <td className="py-2 px-4 border text-center font-bold bg-green-100 text-lg">
                                            ${totalActual.toFixed(0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 border rounded">
                                    <label htmlFor="tipoVenta" className="block text-xl font-medium mb-2">
                                        Tipo de Venta:
                                    </label>
                                    <select 
                                        className="w-full p-2 border rounded text-xl bg-amber-50 border-amber-300 focus:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300" 
                                        id="tipoVenta"
                                        value={tipoVenta}
                                        onChange={(e) => setTipoVenta(e.target.value)}
                                    >
                                        <option value="mayor">Venta Por Mayor</option>
                                        <option value="detalle">Venta al detalle</option>
                                    </select>
                                </div>

                                <div className="p-4 border rounded">
                                    <label htmlFor="tipoPago" className="block text-xl font-medium mb-2">
                                        Tipo de Pago:
                                    </label>
                                    <select 
                                        id="tipoPago" 
                                        className="w-full p-2 border rounded text-xl bg-amber-50 border-amber-300 focus:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                        value={tipoPago}
                                        onChange={(e) => setTipoPago(e.target.value)}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                    </select>
                                </div>

                                <div className="p-4 border rounded">
                                    <label htmlFor="tipoDocumento" className="block text-xl font-medium mb-2">
                                        Tipo de Documento:
                                    </label>
                                    <select 
                                        id="tipoDocumento" 
                                        className="w-full p-2 border rounded text-xl bg-amber-50 border-amber-300 focus:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                        value={tipoDocumento}
                                        onChange={(e) => setTipoDocumento(e.target.value)}
                                    >
                                        <option value="boleta">Boleta</option>
                                        <option value="factura">Factura</option>
                                    </select>
                                </div>

                                <div className="p-4 border rounded">
                                    <label htmlFor="numeroBoleta" className="block text-xl font-medium mb-2">
                                        Número de {tipoDocumento === "boleta" ? "Boleta" : "Factura"}:
                                    </label>
                                    <input 
                                        type="text" 
                                        id="numeroBoleta" 
                                        className="w-full p-2 border rounded text-xl bg-amber-50 border-amber-300 focus:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                        required
                                        placeholder={`Ingrese el número de ${tipoDocumento === "boleta" ? "boleta" : "factura"}`}
                                        value={numeroBoleta}
                                        onChange={(e) => setNumeroBoleta(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between">
                                <button 
                                    onClick={() => {
                                        vaciarCarrito();
                                        setMensaje("Carrito vaciado");
                                    }} 
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 text-lg"
                                >
                                    Cancelar Venta
                                </button>
                                
                                <button
                                    onClick={confirmarVenta}
                                    disabled={confirmandoVenta}
                                    className={`text-white px-6 py-3 rounded-lg text-xl font-bold flex items-center justify-center min-w-[280px] ${
                                        confirmandoVenta ? 'bg-green-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-700'
                                    }`}
                                >
                                    {confirmandoVenta ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Procesando venta...
                                        </>
                                    ) : (
                                        `Confirmar Venta - ${totalActual.toFixed(0)}`
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default function PuntoDeVentaPage() {
    return (
        <ProtectedRoute requirePuntoDeVentaAccess>
            <VentaContent />
        </ProtectedRoute>
    );
}