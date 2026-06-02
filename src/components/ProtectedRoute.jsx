'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (requireAdmin && user.role !== 'admin') {
            router.replace('/bodega');
        }
    }, [user, loading, requireAdmin, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }
    if (!user) return null;
    if (requireAdmin && user.role !== 'admin') return null;

    return children;
}
