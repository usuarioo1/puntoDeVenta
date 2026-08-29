'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { apiBase } from '@/endpoints/api';

const AuthContext = createContext();
const POS_ONLY_USERS = new Set(['vilmaalfaro@apback.local']);

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

const isPosOnlyUser = (candidateUser) => POS_ONLY_USERS.has(normalizeEmail(candidateUser?.email));

const canAccessBodega = (candidateUser) => Boolean(candidateUser) && !isPosOnlyUser(candidateUser);

const canAccessPuntoDeVenta = (candidateUser) => Boolean(candidateUser) && (candidateUser?.role === 'admin' || isPosOnlyUser(candidateUser));

const getDefaultRoute = (candidateUser) => {
    if (!candidateUser) return '/login';
    if (isPosOnlyUser(candidateUser)) return '/punto-de-venta';
    if (candidateUser.role === 'admin') return '/';
    return '/bodega';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const reqId = axios.interceptors.request.use((config) => {
            const t = localStorage.getItem('token');
            if (t) config.headers.Authorization = `Bearer ${t}`;
            return config;
        });
        const resId = axios.interceptors.response.use(
            (r) => r,
            (err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(err);
            }
        );
        return () => { axios.interceptors.request.eject(reqId); axios.interceptors.response.eject(resId); };
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post(`${apiBase}/users/login`, { email, password });
        if (!data.success) throw new Error(data.message);
        setToken(data.token);
        setUser(data.info);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.info));
        return data.info;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const isAdmin = (candidateUser = user) => candidateUser?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            isAdmin,
            isPosOnlyUser: (candidateUser = user) => isPosOnlyUser(candidateUser),
            canAccessBodega: (candidateUser = user) => canAccessBodega(candidateUser),
            canAccessPuntoDeVenta: (candidateUser = user) => canAccessPuntoDeVenta(candidateUser),
            getDefaultRoute: (candidateUser = user) => getDefaultRoute(candidateUser),
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
};
