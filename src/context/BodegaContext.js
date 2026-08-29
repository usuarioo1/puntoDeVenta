'use client';
import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const BodegaContext = createContext();

const PRODUCTOS_CACHE_DB = 'punto-de-venta-cache';
const PRODUCTOS_CACHE_STORE = 'catalogos';
const PRODUCTOS_CACHE_KEY = 'productosPuntoDeVenta';

const extraerProductos = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.productos)) return data.productos;
  return [];
};

const normalizarProductos = (productos) => (Array.isArray(productos) ? productos : []);

const abrirCacheProductos = async () => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(PRODUCTOS_CACHE_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PRODUCTOS_CACHE_STORE)) {
        db.createObjectStore(PRODUCTOS_CACHE_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const leerSnapshotProductos = async () => {
  const db = await abrirCacheProductos();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCTOS_CACHE_STORE, 'readonly');
    const store = transaction.objectStore(PRODUCTOS_CACHE_STORE);
    const request = store.get(PRODUCTOS_CACHE_KEY);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const guardarSnapshotProductos = async (productos) => {
  const db = await abrirCacheProductos();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCTOS_CACHE_STORE, 'readwrite');
    const store = transaction.objectStore(PRODUCTOS_CACHE_STORE);
    store.put({
      key: PRODUCTOS_CACHE_KEY,
      productos,
      updatedAt: Date.now(),
    });

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const limpiarSnapshotProductos = async () => {
  const db = await abrirCacheProductos();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCTOS_CACHE_STORE, 'readwrite');
    const store = transaction.objectStore(PRODUCTOS_CACHE_STORE);
    store.delete(PRODUCTOS_CACHE_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const BodegaProvider = ({ children }) => {
  const { token, loading } = useAuth();
  const [todosLosProductos, setTodosLosProductosState] = useState([]);
  const [productosCargados, setProductosCargados] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState('');
  const inicioRef = useRef(false);
  const cargaPromiseRef = useRef(null);
  const todosLosProductosRef = useRef([]);

  useEffect(() => {
    todosLosProductosRef.current = todosLosProductos;
  }, [todosLosProductos]);

  const persistirProductos = useCallback((productos) => {
    void guardarSnapshotProductos(productos).catch((cacheError) => {
      console.warn('No se pudo guardar el cache de productos:', cacheError);
    });
  }, []);

  const reemplazarProductosEnCache = useCallback((productos) => {
    const listado = normalizarProductos(productos);
    setTodosLosProductosState(listado);
    setProductosCargados(true);
    setError('');
    persistirProductos(listado);
    return listado;
  }, [persistirProductos]);

  const asegurarProductos = useCallback(async ({ forceRefresh = false, background = false } = {}) => {
    if (!token) return [];

    if (!forceRefresh && cargaPromiseRef.current) {
      return cargaPromiseRef.current;
    }

    if (!forceRefresh && productosCargados) {
      return todosLosProductosRef.current;
    }

    const request = (async () => {
      if (background) {
        setSincronizando(true);
      } else {
        setCargando(true);
      }

      try {
        const { data } = await axios.get('/api/productosPuntoDeVenta', {
          params: { limit: 10000, skip: 0, sort: 'nombre' },
        });
        const listado = extraerProductos(data);
        reemplazarProductosEnCache(listado);
        return listado;
      } catch (loadError) {
        const message = loadError.response?.data?.error || loadError.message || 'Error al cargar productos';
        setError(message);
        throw loadError;
      } finally {
        if (background) {
          setSincronizando(false);
        } else {
          setCargando(false);
        }
      }
    })();

    cargaPromiseRef.current = request;

    try {
      return await request;
    } finally {
      if (cargaPromiseRef.current === request) {
        cargaPromiseRef.current = null;
      }
    }
  }, [productosCargados, reemplazarProductosEnCache, token]);

  const refrescarProductos = useCallback(async () => {
    return asegurarProductos({ forceRefresh: true });
  }, [asegurarProductos]);

  const actualizarProductoEnCache = useCallback((productoActualizado) => {
    if (!productoActualizado?._id) return;

    setTodosLosProductosState((prev) => {
      const index = prev.findIndex((producto) => producto._id === productoActualizado._id);
      const next = [...prev];

      if (index === -1) {
        next.unshift(productoActualizado);
      } else {
        next[index] = { ...next[index], ...productoActualizado };
      }

      persistirProductos(next);
      return next;
    });

    setProductosCargados(true);
    setError('');
  }, [persistirProductos]);

  const actualizarProductosEnCache = useCallback((productosActualizados) => {
    const cambios = normalizarProductos(productosActualizados).filter((producto) => producto?._id);
    if (cambios.length === 0) return;

    setTodosLosProductosState((prev) => {
      const productosPorId = new Map(prev.map((producto) => [producto._id, producto]));

      cambios.forEach((producto) => {
        const existente = productosPorId.get(producto._id);
        productosPorId.set(producto._id, existente ? { ...existente, ...producto } : producto);
      });

      const next = Array.from(productosPorId.values());
      persistirProductos(next);
      return next;
    });

    setProductosCargados(true);
    setError('');
  }, [persistirProductos]);

  const eliminarProductoDelCache = useCallback((productoId) => {
    if (!productoId) return;

    setTodosLosProductosState((prev) => {
      const next = prev.filter((producto) => producto._id !== productoId);
      persistirProductos(next);
      return next;
    });

    setProductosCargados(true);
  }, [persistirProductos]);

  useEffect(() => {
    if (loading) return undefined;

    if (!token) {
      inicioRef.current = false;
      cargaPromiseRef.current = null;
      if (todosLosProductosRef.current.length > 0) {
        setTodosLosProductosState([]);
      }
      setProductosCargados(false);
      setCargando(false);
      setSincronizando(false);
      setError('');
      void limpiarSnapshotProductos().catch((cacheError) => {
        console.warn('No se pudo limpiar el cache de productos:', cacheError);
      });
      return undefined;
    }

    if (inicioRef.current) {
      return undefined;
    }

    inicioRef.current = true;
    let cancelado = false;

    const inicializarCatalogo = async () => {
      try {
        const snapshot = await leerSnapshotProductos();
        if (cancelado) return;

        const productosEnCache = normalizarProductos(snapshot?.productos);
        if (productosEnCache.length > 0) {
          setTodosLosProductosState(productosEnCache);
          setProductosCargados(true);
          setError('');
          void asegurarProductos({ forceRefresh: true, background: true }).catch((loadError) => {
            console.warn('No se pudo sincronizar el catalogo en segundo plano:', loadError);
          });
          return;
        }

        await asegurarProductos();
      } catch (cacheError) {
        if (cancelado) return;
        console.warn('No se pudo hidratar el catalogo desde cache:', cacheError);
        void asegurarProductos().catch(() => {});
      }
    };

    void inicializarCatalogo();

    return () => {
      cancelado = true;
    };
  }, [asegurarProductos, loading, token]);

  const value = {
    todosLosProductos,
    setTodosLosProductos: reemplazarProductosEnCache,
    productosCargados,
    cargando,
    sincronizando,
    error,
    asegurarProductos,
    refrescarProductos,
    actualizarProductoEnCache,
    actualizarProductosEnCache,
    eliminarProductoDelCache,
  };

  return (
    <BodegaContext.Provider value={value}>
      {children}
    </BodegaContext.Provider>
  );
};

export const useBodega = () => {
  const context = useContext(BodegaContext);
  if (!context) {
    throw new Error('useBodega debe usarse dentro de un BodegaProvider');
  }
  return context;
};