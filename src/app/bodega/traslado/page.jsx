import ProtectedRoute from '@/components/ProtectedRoute';
import MovimientoBodega from '@/components/MovimientoBodega';

export default function TrasladoPage() {
    return (
        <ProtectedRoute requireAdmin>
            <MovimientoBodega modo="traslado" />
        </ProtectedRoute>
    );
}
