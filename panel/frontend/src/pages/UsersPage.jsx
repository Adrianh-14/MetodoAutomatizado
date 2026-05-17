import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    tenantName: ''
  });
  
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'user', tenantName: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editData.name,
        email: editData.email
      };
      if (editData.password) {
        payload.password = editData.password;
      }
      
      await api.put(`/users/${editData.id}`, payload);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al editar usuario');
    }
  };

  const toggleBlock = async (id, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'bloquear' : 'desbloquear'} a este usuario?`)) return;
    try {
      await api.patch(`/users/${id}/block`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar PERMANENTEMENTE a este usuario y sus logs? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="animate-in" style={{ padding: '20px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="page-title">GESTIÓN DE USUARIOS</h1>
          <p className="page-subtitle">Administra los accesos al panel para tu tenant</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + NUEVO USUARIO
        </button>
      </header>

      {error && <div className="error-message" style={{ color: 'var(--danger-color)', marginBottom: '20px' }}>{error}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--neon-green)' }}>
              <th style={{ padding: '12px' }}>NOMBRE</th>
              <th style={{ padding: '12px' }}>EMAIL</th>
              <th style={{ padding: '12px' }}>ROL</th>
              {currentUser?.role === 'superadmin' && <th style={{ padding: '12px' }}>EMPRESA</th>}
              <th style={{ padding: '12px' }}>ESTADO</th>
              <th style={{ padding: '12px' }}>FECHA CREACIÓN</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{user.name}</td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    background: user.role === 'admin' ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                    color: user.role === 'admin' ? 'var(--neon-green)' : 'var(--text-secondary)'
                  }}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                {currentUser?.role === 'superadmin' && (
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{user.tenant?.name || 'N/A'}</td>
                )}
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    background: user.isActive ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 0, 60, 0.1)',
                    color: user.isActive ? 'var(--neon-green)' : 'var(--danger-color)'
                  }}>
                    {user.isActive ? 'ACTIVO' : 'BLOQUEADO'}
                  </span>
                </td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {user.id !== currentUser?.id && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setEditData({ id: user.id, name: user.name, email: user.email, password: '' });
                          setShowEditModal(true);
                        }}
                      >
                        EDITAR
                      </button>
                      <button 
                        className="btn" 
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '12px',
                          background: user.isActive ? 'rgba(255, 166, 0, 0.1)' : 'rgba(0, 255, 65, 0.1)',
                          color: user.isActive ? 'var(--warning-color)' : 'var(--neon-green)',
                          border: `1px solid ${user.isActive ? 'var(--warning-color)' : 'var(--neon-green)'}`
                        }}
                        onClick={() => toggleBlock(user.id, user.isActive)}
                      >
                        {user.isActive ? 'BLOQUEAR' : 'DESBLOQUEAR'}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => deleteUser(user.id)}
                      >
                        ELIMINAR
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--neon-green)' }}>NUEVO USUARIO</h2>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Nombre</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Contraseña</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
              
              {currentUser?.role === 'superadmin' ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Nombre de la Empresa (Tenant)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.tenantName} 
                    onChange={(e) => setFormData({...formData, tenantName: e.target.value})} 
                    required 
                    style={{ width: '100%' }}
                    placeholder="Ej: Mi Empresa SA"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>Se creará una empresa nueva y este usuario será el Administrador.</small>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Rol</label>
                  <select 
                    className="input-field" 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})} 
                    style={{ width: '100%' }}
                  >
                    <option value="user">Usuario Normal</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn" style={{ flex: 1, border: '1px solid var(--text-muted)' }} onClick={() => setShowCreateModal(false)}>CANCELAR</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>CREAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--neon-green)' }}>EDITAR USUARIO</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Nombre</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={editData.email} 
                  onChange={(e) => setEditData({...editData, email: e.target.value})} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Nueva Contraseña (Opcional)</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Dejar en blanco para no cambiar"
                  value={editData.password} 
                  onChange={(e) => setEditData({...editData, password: e.target.value})} 
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn" style={{ flex: 1, border: '1px solid var(--text-muted)' }} onClick={() => setShowEditModal(false)}>CANCELAR</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
