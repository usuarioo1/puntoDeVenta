'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiBase } from "@/endpoints/api";

const extraerProductos = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.productos)) return data.productos;
    return [];
};

const normalizarCodigo = (codigo) => String(codigo ?? "").trim();

function VentaContent() {
    const { logout } = useAuth();
    const router = useRouter();

    const { carrito, vaciarCarrito, agregarAlCarrito, eliminarDelCarrito } = useCarrito();
    const [codigoBarras, setCodigoBarras] = useState("");
    const [ventaIniciada, setVentaIniciada] = useState(false);
    const [productos, setProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const [tipoVenta, setTipoVenta] = useState("mayor");
    const [tipoPago, setTipoPago] = useState("efectivo");
    const [numeroBoleta, setNumeroBoleta] = useState("");
    const [tipoDocumento, setTipoDocumento] = useState("boleta");

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

    useEffect(() => { cargarProductos(); }, []);

    const cargarProductos = async () => {
        setCargandoProductos(true);
        try {
            const res = await axios.get(`${apiBase}/productosPuntoDeVenta`);
            const productosCargados = extraerProductos(res.data);
            setProductos(productosCargados);
            console.log("Productos cargados:", productosCargados.length);

            if (productosCargados.length === 0) {
                setMensaje("No hay productos cargados");
            }
        } catch (error) {
            console.error("Error al cargar productos:", error);
            setMensaje("Error al cargar productos: " + error.message);
        } finally {
            setCargandoProductos(false);
        }
    };

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
        
        if (!Array.isArray(productos) || productos.length === 0) {
            setMensaje("No hay productos cargados. Reintentando carga...");
            cargarProductos();
            return;
        }
        
        const producto = obtenerProductoPorCodigo(codigoABuscar);
        
        if (producto) {
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
        obtenerProductoPorCodigo,
        agregarAlCarrito,
    ]);

    const confirmarVenta = async () => {
        if (carrito.length === 0) {
            setMensaje("No hay productos en el carrito");
            return;
        }
        
        try {
            const total = tipoVenta === "mayor" 
                ? carrito.reduce((sum, item) => sum + item.mayorista * item.cantidad, 0)
                : carrito.reduce((sum, item) => sum + item.tarifa_publica * item.cantidad, 0);

            await axios.post(`${apiBase}/registrar`, {
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

            setMensaje("Venta realizada con éxito");
            vaciarCarrito();
            setVentaIniciada(false);
            cargarProductos();
            
            // Reiniciar los campos
            setNumeroBoleta("");
        } catch (error) {
            console.error("Error al confirmar venta:", error);
            setMensaje("Error al confirmar venta: " + error.message);
        }
    };

    useEffect(() => {
        let buffer = "";
        let timeout = null;
    
        const handleKeyPress = (e) => {
            if (ventaIniciada) {
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
                <h1 className="text-2xl font-bold">Punto de Venta</h1>
                <button 
                    onClick={handleLogout} 
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                    Cerrar Sesión
                </button>
            </div>
            
            {mensaje && (
                <div className={`p-3 my-3 rounded ${mensaje.includes("Error") || mensaje.includes("no encontrado") 
                    ? "bg-red-100 text-red-700" 
                    : "bg-green-100 text-green-700"}`}>
                    {mensaje}
                </div>
            )}
            
            {!ventaIniciada ? (
                <button onClick={iniciarVenta} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
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
                            className="border p-2 mr-2 flex-grow"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    agregarAlCarritoHandler();
                                }
                            }}
                        />
                        <button onClick={() => agregarAlCarritoHandler()} className="bg-blue-500 text-white px-4 py-2 rounded">
                            Agregar
                        </button>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2">Carrito - {carrito.length} producto(s)</h2>
                    
                    {carrito.length > 0 ? (
                        <table className="min-w-full bg-white border">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border">Imagen</th>
                                    <th className="py-2 px-4 border">Descripción</th>
                                    <th className="py-2 px-4 border">Código</th>
                                    <th className="py-2 px-4 border">Cantidad</th>
                                    <th className="py-2 px-4 border">Tarifa Pública</th>
                                    <th className="py-2 px-4 border">Mayorista</th>
                                    <th className="py-2 px-4 border">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.map((item, index) => (
                                    <tr key={index} className="border">
                                        <td className="py-2 px-4 border">
                                            {item.imagen ? (
                                                <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover" />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                                                    Sin imagen
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 border">{item.nombre}</td>
                                        <td className="py-2 px-4 border">{item.codigo_de_barras}</td>
                                        <td className="py-2 px-4 border">
                                            <div className="flex items-center">
                                                <button 
                                                    onClick={() => {
                                                        if (item.cantidad > 1) {
                                                            agregarAlCarrito({...item, cantidad: -1});
                                                        }
                                                    }}
                                                    className="bg-gray-300 px-2 py-1 rounded"
                                                >
                                                    -
                                                </button>
                                                <span className="mx-2">{item.cantidad}</span>
                                                <button 
                                                    onClick={() => agregarAlCarrito({...item, cantidad: 1})}
                                                    className="bg-gray-300 px-2 py-1 rounded"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 border">${item.tarifa_publica.toFixed(0)}</td>
                                        <td className="py-2 px-4 border">${item.mayorista.toFixed(0)}</td>
                                        <td className="py-2 px-4 border">
                                            <button 
                                                onClick={() => eliminarDelCarrito(item._id)} 
                                                className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="bg-yellow-100 p-4 rounded">
                            No hay productos en el carrito. Escanee o ingrese un código para agregar productos.
                        </div>
                    )}

                    {carrito.length > 0 && (
                        <>
                            <h2 className="text-xl font-bold mt-6">Totales</h2>
                            <table className="min-w-full bg-white border">
                                <thead>
                                    <tr>
                                        <th className="py-2 px-4 border">Total Tarifa Pública</th>
                                        <th className="py-2 px-4 border">Total Mayorista</th>
                                        <th className="py-2 px-4 border">Total a Cobrar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-2 px-4 border text-center">${totalTarifaPublica.toFixed(0)}</td>
                                        <td className="py-2 px-4 border text-center">${totalMayorista.toFixed(0)}</td>
                                        <td className="py-2 px-4 border text-center font-bold bg-green-100">
                                            ${totalActual.toFixed(0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 border rounded">
                                    <label htmlFor="tipoVenta" className="block text-lg font-medium mb-2">
                                        Tipo de Venta:
                                    </label>
                                    <select 
                                        className="w-full p-2 border rounded text-lg" 
                                        id="tipoVenta"
                                        value={tipoVenta}
                                        onChange={(e) => setTipoVenta(e.target.value)}
                                    >
                                        <option value="mayor">Venta Por Mayor</option>
                                        <option value="detalle">Venta al detalle</option>
                                    </select>
                                </div>

                                <div className="p-4 border rounded">
                                    <label htmlFor="tipoPago" className="block text-lg font-medium mb-2">
                                        Tipo de Pago:
                                    </label>
                                    <select 
                                        id="tipoPago" 
                                        className="w-full p-2 border rounded text-lg"
                                        value={tipoPago}
                                        onChange={(e) => setTipoPago(e.target.value)}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                    </select>
                                </div>

                                <div className="p-4 border rounded">
                                    <label htmlFor="tipoDocumento" className="block text-lg font-medium mb-2">
                                        Tipo de Documento:
                                    </label>
                                    <select 
                                        id="tipoDocumento" 
                                        className="w-full p-2 border rounded text-lg"
                                        value={tipoDocumento}
                                        onChange={(e) => setTipoDocumento(e.target.value)}
                                    >
                                        <option value="boleta">Boleta</option>
                                        <option value="factura">Factura</option>
                                    </select>
                                </div>

                                <div className="p-4 border rounded">
                                    <label htmlFor="numeroBoleta" className="block text-lg font-medium mb-2">
                                        Número de {tipoDocumento === "boleta" ? "Boleta" : "Factura"}:
                                    </label>
                                    <input 
                                        type="text" 
                                        id="numeroBoleta" 
                                        className="w-full p-2 border rounded text-lg"
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
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                                >
                                    Cancelar Venta
                                </button>
                                
                                <button 
                                    onClick={confirmarVenta} 
                                    className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-green-700"
                                >
                                    Confirmar Venta - ${totalActual.toFixed(0)}
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
        <ProtectedRoute requireAdmin>
            <VentaContent />
        </ProtectedRoute>
    );
}