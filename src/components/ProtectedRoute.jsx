'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false, requirePuntoDeVentaAccess = false }) {
    const { user, loading, isPosOnlyUser, canAccessPuntoDeVenta, getDefaultRoute } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const usuarioSoloPuntoDeVenta = isPosOnlyUser(user);
    const rutaPorDefecto = getDefaultRoute(user);
    const bloqueadoEnBodega = Boolean(user && usuarioSoloPuntoDeVenta && pathname?.startsWith('/bodega'));
    const sinAccesoPuntoDeVenta = Boolean(user && requirePuntoDeVentaAccess && !canAccessPuntoDeVenta(user));
    const sinAccesoAdmin = Boolean(user && requireAdmin && user.role !== 'admin');

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/login');
            return;
        }

        if (bloqueadoEnBodega) {
            router.replace('/punto-de-venta');
            return;
        }

        if (sinAccesoAdmin || sinAccesoPuntoDeVenta) {
            router.replace(rutaPorDefecto);
        }
    }, [bloqueadoEnBodega, loading, requireAdmin, requirePuntoDeVentaAccess, router, rutaPorDefecto, sinAccesoAdmin, sinAccesoPuntoDeVenta, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }
    if (!user) return null;
    if (bloqueadoEnBodega) return null;
    if (sinAccesoAdmin || sinAccesoPuntoDeVenta) return null;

    return children;
}
