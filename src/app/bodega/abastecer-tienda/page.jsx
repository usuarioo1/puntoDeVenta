import ProtectedRoute from '@/components/ProtectedRoute';
import MovimientoBodega from '@/components/MovimientoBodega';

export default function AbastecerTiendaPage() {
    return (
        <ProtectedRoute requireAdmin>
            <MovimientoBodega modo="abastecer" />
        </ProtectedRoute>
    );
}
