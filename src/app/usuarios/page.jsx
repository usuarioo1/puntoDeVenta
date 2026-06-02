'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiBase } from "@/endpoints/api";

const ROLES = ['user', 'admin'];

function UsuariosContent() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);

    const [form, setForm] = useState({
        username: '', name: '', email: '', password: '', region: 'Chile', role: 'user'
    });
    const [formError, setFormError] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => { cargarUsuarios(); }, []);

    const cargarUsuarios = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${apiBase}/users`);
            setUsuarios(data.info || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const limpiarForm = () => {
        setForm({ username: '', name: '', email: '', password: '', region: 'Chile', role: 'user' });
        setEditando(null);
        setFormError('');
    };

    const iniciarEdicion = (u) => {
        setEditando(u._id);
        setForm({
            username: u.username,
            name: u.name || '',
            email: u.email,
            password: '',
            region: u.region || 'Chile',
            role: u.role
        });
        setMostrarForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setGuardando(true);
        try {
            if (editando) {
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await axios.put(`${apiBase}/users/${editando}`, payload);
            } else {
                if (!form.password) {
                    setFormError('La contraseña es obligatoria para usuarios nuevos');
                    setGuardando(false);
                    return;
                }
                await axios.post(`${apiBase}/users`, form);
            }
            limpiarForm();
            setMostrarForm(false);
            await cargarUsuarios();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Error al guardar');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarUsuario = async (u) => {
        if (!window.confirm(`¿Eliminar a ${u.username}?`)) return;
        try {
            await axios.delete(`${apiBase}/users/${u._id}`);
            await cargarUsuarios();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                <button
                    onClick={() => { limpiarForm(); setMostrarForm(!mostrarForm); }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {mostrarForm ? 'Cancelar' : '+ Nuevo Usuario'}
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
                    <h2 className="text-lg font-semibold mb-3">
                        {editando ? 'Editar usuario' : 'Crear usuario'}
                    </h2>
                    {formError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                            {formError}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="border p-2 rounded" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                        <input className="border p-2 rounded" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        <input className="border p-2 rounded" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        <input className="border p-2 rounded" type="password" placeholder={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        <input className="border p-2 rounded" placeholder="Región" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                        <select className="border p-2 rounded" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button type="submit" disabled={guardando} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                            {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
                        </button>
                        {editando && (
                            <button type="button" onClick={limpiarForm} className="bg-gray-300 px-4 py-2 rounded">
                                Cancelar edición
                            </button>
                        )}
                    </div>
                </form>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-gray-500">Cargando...</p>
            ) : usuarios.length === 0 ? (
                <p className="text-gray-500">No hay usuarios registrados.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border bg-white">
                        <thead>
                            <tr className="bg-gray-200 text-left">
                                <th className="p-2">Username</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Email</th>
                                <th className="p-2">Región</th>
                                <th className="p-2">Rol</th>
                                <th className="p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u._id} className="border-t hover:bg-gray-50">
                                    <td className="p-2 font-medium">{u.username}</td>
                                    <td className="p-2">{u.name}</td>
                                    <td className="p-2">{u.email}</td>
                                    <td className="p-2">{u.region}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs text-white ${u.role === 'admin' ? 'bg-red-600' : 'bg-gray-500'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex gap-2">
                                            <button onClick={() => iniciarEdicion(u)} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-700">
                                                Editar
                                            </button>
                                            <button onClick={() => eliminarUsuario(u)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-700">
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
}

export default function UsuariosPage() {
    return (
        <ProtectedRoute requireAdmin>
            <UsuariosContent />
        </ProtectedRoute>
    );
}
