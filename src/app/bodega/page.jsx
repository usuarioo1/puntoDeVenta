'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import JsBarcode from "jsbarcode";
import Link from "next/link";
import { useCarrito } from "@/context/CarritoContext";
import { apiBase } from "@/endpoints/api";

// Credenciales predefinidas
const CREDENCIALES = {
  usuario: "admin",
  contraseña: "bodega123",
};

export default function BodegaProtegida() {
  const [autenticado, setAutenticado] = useState(false);
  const [formulario, setFormulario] = useState({
    usuario: "",
    contraseña: "",
  });
  const [error, setError] = useState("");
  const [recordarme, setRecordarme] = useState(false);

  // Componente de Bodega optimizado
  const ComponenteBodega = () => {
    const { agregarAlCarrito } = useCarrito();
    const [todosLosProductos, setTodosLosProductos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [productosCargados, setProductosCargados] = useState(false);

    const cargarProductos = async () => {
      try {
        setCargando(true);
        const res = await axios.get(`${apiBase}/productosPuntoDeVenta`);
        const productosRecibidos = res.data.productos || [];
        setTodosLosProductos(productosRecibidos);
        setProductosCargados(true);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setCargando(false);
      }
    };

    const eliminarProducto = async (id) => {
      try {
        await axios.delete(`${apiBase}/productosPuntoDeVenta/${id}`);
        cargarProductos();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      }
    };

    const generarCodigoDeBarras = (codigo) => {
      if (!codigo || typeof codigo !== "string") {
        return "";
      }
      const canvas = document.createElement("canvas");
      try {
        JsBarcode(canvas, codigo, { format: "CODE128", width: 2, height: 40 });
        return canvas.toDataURL();
      } catch (error) {
        console.error("Error al generar código de barras:", error);
        return "";
      }
    };

    const cerrarSesion = () => {
      if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        localStorage.removeItem("bodega_autenticado");
        setAutenticado(false);
        setProductosCargados(false);
      }
    };

    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Bodega - Gestión de Productos</h1>
          <button
            onClick={cerrarSesion}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Instrucción de búsqueda con Ctrl+F en lugar de la barra de búsqueda personalizada */}
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="font-medium">
              Para buscar productos, utiliza la función de búsqueda de tu navegador presionando{" "}
              <kbd className="px-2 py-1 bg-gray-200 rounded text-sm">Ctrl</kbd> + 
              <kbd className="px-2 py-1 bg-gray-200 rounded text-sm ml-1">F</kbd>
              {" "}(o{" "}
              <kbd className="px-2 py-1 bg-gray-200 rounded text-sm">⌘</kbd> + 
              <kbd className="px-2 py-1 bg-gray-200 rounded text-sm ml-1">F</kbd>
              {" "}en Mac).
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {!productosCargados ? (
            <button
              onClick={cargarProductos}
              className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 rounded flex items-center gap-2"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Cargando...
                </>
              ) : (
                "Cargar Productos"
              )}
            </button>
          ) : (
            <>
              <Link href="/bodega/addproduct">
                <button className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 rounded">
                  Agregar Producto
                </button>
              </Link>
              <Link href="/bodega/editproduct">
                <button className="bg-yellow-600 text-white px-4 py-2 hover:bg-yellow-800 rounded">
                  Editar Productos
                </button>
              </Link>
              <Link href="/bodega/ventas">
                <button className="bg-green-800 text-white px-4 py-2 hover:bg-green-900 rounded">
                  Ver Ventas
                </button>
              </Link>
              <Link href="/bodega/traslado">
                <button className="bg-purple-800 text-white px-4 py-2 hover:bg-purple-900 rounded">
                  Traslado de Productos
                </button>
              </Link>
            </>
          )}
        </div>

        {cargando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
              <div className="flex justify-center mb-4">
                <svg
                  className="animate-spin h-12 w-12 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Cargando productos
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Esto puede tardar unos segundos...
              </p>
            </div>
          </div>
        )}

        {/* Indicador de resultados */}
        {productosCargados && (
          <div className="mb-4">
            <p className="text-gray-700">
              {todosLosProductos.length} producto(s) encontrado(s)
            </p>
          </div>
        )}

        {/* Tabla de productos */}
        {productosCargados && (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Stock</th>
                  <th className="p-2">Caja</th>
                  <th className="p-2">Imagen</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Tarifa Pública</th>
                  <th className="p-2">Tarifa Mayorista</th>
                  <th className="p-2">Metal</th>
                  <th className="p-2">Producto N/I</th>
                  <th className="p-2">Tipo de Joya</th>
                  <th className="p-2">Código de Barra</th>
                  <th className="p-2">Código Generado</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {todosLosProductos.map((producto) => (
                  <tr key={producto._id} className="border-t hover:bg-gray-50">
                    <td className="p-2">{producto.stock}</td>
                    <td className="p-2">{producto.caja}</td>
                    <td className="p-2">
                      <img
                        src={producto.imagen || "/noimagen.png"}
                        className="w-16 h-16 object-cover"
                        alt="Imagen del producto"
                      />
                    </td>
                    <td className="p-2">{producto.nombre}</td>
                    <td className="p-2">${producto.tarifa_publica}</td>
                    <td className="p-2">${producto.mayorista}</td>
                    <td className="p-2">{producto.metal}</td>
                    <td className="p-2">{producto.prod_nac_imp}</td>
                    <td className="p-2">{producto.tipo_de_joya}</td>
                    <td className="p-2">{producto.codigo_de_barras}</td>
                    <td className="p-2">
                      {producto.codigo_de_barras && (
                        <img
                          src={generarCodigoDeBarras(producto.codigo_de_barras)}
                          alt="Código de Barra"
                        />
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => agregarAlCarrito(producto)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Agregar al carrito
                        </button>
                        <button
                          onClick={() => eliminarProducto(producto._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Componente de inicio de sesión
  const ComponenteLogin = () => {
    const manejarCambio = (e) => {
      const { name, value } = e.target;
      setFormulario({
        ...formulario,
        [name]: value,
      });
    };

    const iniciarSesion = (e) => {
      e.preventDefault();

      // Validar credenciales
      if (
        formulario.usuario === CREDENCIALES.usuario &&
        formulario.contraseña === CREDENCIALES.contraseña
      ) {
        setAutenticado(true);
        setError("");

        // Si está activado "recordarme", guardar en localStorage
        if (recordarme) {
          localStorage.setItem("bodega_autenticado", "true");
        }
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Acceso a Bodega
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={iniciarSesion}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="usuario"
              >
                Usuario
              </label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={formulario.usuario}
                onChange={manejarCambio}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="contraseña"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="contraseña"
                name="contraseña"
                value={formulario.contraseña}
                onChange={manejarCambio}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={() => setRecordarme(!recordarme)}
                  className="mr-2"
                />
                <span className="text-sm">Recordar sesión</span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Verificar si ya hay una sesión guardada
  useEffect(() => {
    const sesionGuardada = localStorage.getItem("bodega_autenticado");
    if (sesionGuardada === "true") {
      setAutenticado(true);
    }
  }, []);

  // Renderizar el componente correspondiente según el estado de autenticación
  return autenticado ? <ComponenteBodega /> : <ComponenteLogin />;
}