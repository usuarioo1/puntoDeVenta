'use client'
import { createContext, useContext, useState } from "react";

const CarritoContext = createContext();

export const CarritoProvider = ({ children }) => {
    const [carrito, setCarrito] = useState([]);

    const agregarAlCarrito = (producto) => {
        const delta = Number.isFinite(Number(producto?.cantidad)) && Number(producto.cantidad) !== 0
            ? Number(producto.cantidad)
            : 1;

        setCarrito((prevCarrito) => {
            const productoEnCarrito = prevCarrito.find((item) => item._id === producto._id);
            if (productoEnCarrito) {
                const nuevaCantidad = productoEnCarrito.cantidad + delta;

                if (nuevaCantidad <= 0) {
                    return prevCarrito.filter((item) => item._id !== producto._id);
                }

                return prevCarrito.map((item) =>
                    item._id === producto._id ? { ...item, cantidad: nuevaCantidad } : item
                );
            } else {
                return [...prevCarrito, { ...producto, cantidad: delta > 0 ? delta : 1 }];
            }
        });
    };

    const eliminarDelCarrito = (id) => {
        setCarrito((prevCarrito) => prevCarrito.filter((item) => item._id !== id));
    };

    const vaciarCarrito = () => {
        setCarrito([]);
    };

    return (
        <CarritoContext.Provider value={{ carrito, agregarAlCarrito, eliminarDelCarrito, vaciarCarrito }}>
            {children}
        </CarritoContext.Provider>
    );
};

export const useCarrito = () => useContext(CarritoContext);
