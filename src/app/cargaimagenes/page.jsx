'use client';
import CargaMasivaImagenes from "@/components/CargaMasivaImagenes";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CargaMasivaImagenesPage() {
    return (
        <ProtectedRoute requireAdmin>
            <div>
                <h1 className="text-2xl font-bold p-4">Gestión de Productos</h1>
                <CargaMasivaImagenes />
            </div>
        </ProtectedRoute>
    );
}
