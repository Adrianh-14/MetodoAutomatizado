import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyCreateForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  tenantId: '',
  tenantName: '',
  tenantMode: 'existing',
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const isSuperadmin = currentUser?.role === 'superadmin';
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tenantFilter, setTenantFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState(emptyCreateForm);
  const [editData, setEditData] = useState({ id: '', name: '', email: '', password: '', role: 'user' });

  const loadTenants = useCallback(async () => {
    const response = await api.get('/users/tenants');
    setTenants(response.data);
    setFormData((previous) => ({
      ...previous,
      tenantId: previous.tenantId || response.data[0]?.id || '',
    }));
  }, []);

  const loadUsers = useCallback(async () => {
    const response = await api.get('/users', {
      params: isSuperadmin && tenantFilter ? { tenantId: tenantFilter } : undefined,
    });
    setUsers(response.data);
  }, [isSuperadmin, tenantFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadTenants(), loadUsers()]);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'No se pudo cargar la administración de usuarios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadTenants, loadUsers]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === formData.tenantId),
    [formData.tenantId, tenants],
  );

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({ ...emptyCreateForm, tenantId: tenants[0]?.id || '' });
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (isSuperadmin) {
        if (formData.tenantMode === 'new') payload.tenantName = formData.tenantName;
        else payload.tenantId = formData.tenantId;
      }

      await api.post('/users', payload);
      closeCreateModal();
      await Promise.all([loadTenants(), loadUsers()]);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: editData.name,
        email: editData.email,
        role: editData.role,
      };
      if (editData.password) payload.password = editData.password;

      await api.put(`/users/${editData.id}`, payload);
      setShowEditModal(false);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (targetUser) => {
    const action = targetUser.isActive ? 'bloquear' : 'desbloquear';
    if (!window.confirm(`¿Quieres ${action} a ${targetUser.name}?`)) return;

    try {
      await api.patch(`/users/${targetUser.id}/block`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo cambiar el estado del usuario');
    }
  };

  const deleteUser = async (targetUser) => {
    if (!window.confirm(`¿Eliminar permanentemente a ${targetUser.name}?`)) return;

    try {
      await api.delete(`/users/${targetUser.id}`);
      await Promise.all([loadTenants(), loadUsers()]);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo eliminar el usuario');
    }
  };

  const openEditModal = (targetUser) => {
    setEditData({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      role: targetUser.role,
    });
    setShowEditModal(true);
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="animate-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">GESTIÓN DE USUARIOS</h1>
          <p className="page-subtitle">
            {isSuperadmin
              ? 'Administra usuarios y administradores de todos los tenants'
              : `Usuarios aislados dentro de ${currentUser?.tenant?.name || 'tu tenant'}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + NUEVO USUARIO
        </button>
      </header>

      {error && (
        <div style={{ color: 'var(--danger)', border: '1px solid rgba(255,59,59,0.35)', background: 'rgba(255,59,59,0.08)', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: '18px' }}>
          {error}
        </div>
      )}

      {isSuperadmin && (
        <div className="card" style={{ marginBottom: '18px', padding: '16px 20px' }}>
          <div className="input-group" style={{ maxWidth: '420px' }}>
            <label className="input-label">Filtrar por tenant</label>
            <select className="input" value={tenantFilter} onChange={(event) => setTenantFilter(event.target.value)}>
              <option value="">Todos los tenants</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant._count.users} usuarios)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              {isSuperadmin && <th>Tenant</th>}
              <th>Estado</th>
              <th>Creado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((targetUser) => (
              <tr key={targetUser.id}>
                <td>{targetUser.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{targetUser.email}</td>
                <td>
                  <span className="badge" style={{ color: targetUser.role === 'admin' ? 'var(--neon-green)' : 'var(--neon-cyan)', border: '1px solid currentColor' }}>
                    {targetUser.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </td>
                {isSuperadmin && (
                  <td>
                    <div>{targetUser.tenant?.name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{targetUser.tenant?.slug}</small>
                  </td>
                )}
                <td>
                  <span className={`badge ${targetUser.isActive ? 'badge-available' : ''}`} style={!targetUser.isActive ? { color: 'var(--danger)', border: '1px solid rgba(255,59,59,0.4)' } : undefined}>
                    {targetUser.isActive ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td>{new Date(targetUser.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn btn-cyan btn-sm" onClick={() => openEditModal(targetUser)}>Editar</button>
                    {targetUser.id !== currentUser?.id && (
                      <>
                        <button className="btn btn-sm" onClick={() => toggleBlock(targetUser)}>
                          {targetUser.isActive ? 'Bloquear' : 'Activar'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteUser(targetUser)}>Eliminar</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={isSuperadmin ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px' }}>
                  No hay usuarios en este tenant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px' }}>
            <h2 className="modal-title">NUEVO USUARIO</h2>
            <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gap: '15px' }}>
              {isSuperadmin && (
                <>
                  <div className="input-group">
                    <label className="input-label">Destino</label>
                    <select className="input" value={formData.tenantMode} onChange={(event) => setFormData({ ...formData, tenantMode: event.target.value })}>
                      <option value="existing">Tenant existente</option>
                      <option value="new">Crear tenant nuevo</option>
                    </select>
                  </div>
                  {formData.tenantMode === 'existing' ? (
                    <div className="input-group">
                      <label className="input-label">Tenant</label>
                      <select className="input" value={formData.tenantId} onChange={(event) => setFormData({ ...formData, tenantId: event.target.value })} required>
                        {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
                      </select>
                      {selectedTenant && <small style={{ color: 'var(--text-muted)' }}>Los datos quedarán aislados bajo: {selectedTenant.slug}</small>}
                    </div>
                  ) : (
                    <div className="input-group">
                      <label className="input-label">Nombre del nuevo tenant</label>
                      <input className="input" value={formData.tenantName} onChange={(event) => setFormData({ ...formData, tenantName: event.target.value })} required placeholder="Ej. Empresa Norte" />
                      <small style={{ color: 'var(--text-muted)' }}>El primer usuario se creará como administrador.</small>
                    </div>
                  )}
                </>
              )}

              <div className="input-group">
                <label className="input-label">Nombre</label>
                <input className="input" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input type="password" minLength="8" maxLength="128" className="input" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required />
              </div>
              {(!isSuperadmin || formData.tenantMode === 'existing') && (
                <div className="input-group">
                  <label className="input-label">Rol</label>
                  <select className="input" value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })}>
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeCreateModal} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px' }}>
            <h2 className="modal-title">EDITAR USUARIO</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: '15px' }}>
              <div className="input-group">
                <label className="input-label">Nombre</label>
                <input className="input" value={editData.name} onChange={(event) => setEditData({ ...editData, name: event.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input" value={editData.email} onChange={(event) => setEditData({ ...editData, email: event.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Rol</label>
                <select className="input" value={editData.role} onChange={(event) => setEditData({ ...editData, role: event.target.value })} disabled={editData.id === currentUser?.id}>
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Nueva contraseña (opcional)</label>
                <input type="password" minLength="8" maxLength="128" className="input" value={editData.password} onChange={(event) => setEditData({ ...editData, password: event.target.value })} placeholder="Déjala vacía para conservarla" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowEditModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
