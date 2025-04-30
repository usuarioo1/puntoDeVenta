'use client';
import { createContext, useContext, useState } from 'react';

const BodegaContext = createContext();

export const BodegaProvider = ({ children }) => {
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosCargados, setProductosCargados] = useState(false);
  const [cargando, setCargando] = useState(false);

  const value = {
    todosLosProductos,
    setTodosLosProductos,
    productosCargados,
    setProductosCargados,
    cargando,
    setCargando
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