import { useState, useEffect } from 'react';
import { usersApi } from '../api';

const roleLabels = {
  superadmin: 'Super Admin',
  official: 'Oficial',
  admin: 'Administrador',
  institution: 'Institucion',
  coach: 'Entrenador',
  athlete: 'Atleta',
  head_judge: 'Juez Principal',
  judge: 'Juez',
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'admin',
  });

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = () => {
    setLoading(true);
    usersApi.getUsers(filterRole ? { role: filterRole } : {})
      .then(res => setUsers(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const data = { ...formData };
        if (!data.password) delete data.password;
        await usersApi.updateUser(editingUser.id, data);
      } else {
        await usersApi.createUser(formData);
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'admin' });
      loadUsers();
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert(editingUser ? 'Error al actualizar usuario' : 'Error al crear usuario');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ first_name: user.first_name, last_name: user.last_name, email: user.email, password: '', role: user.role });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Estas seguro de eliminar este usuario?')) return;
    try {
      await usersApi.deleteUser(id);
      loadUsers();
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al eliminar usuario');
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await usersApi.toggleActive(id);
      loadUsers();
    } catch (err) {
      alert('Error al actualizar usuario');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'admin' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Gestion de Usuarios</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ minWidth: '200px' }}>
            <option value="">Todos los roles</option>
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Contrasena {editingUser && '(dejar vacio para no cambiar)'}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} minLength={8} />
            </div>
          </div>
          <div className="form-group">
            <label>Tipo de Rol</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">{editingUser ? 'Actualizar' : 'Crear'}</button>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
            Mostrando {users.length} usuario{users.length !== 1 ? 's' : ''}
            {filterRole && ` de tipo "${roleLabels[filterRole]}"`}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>{roleLabels[u.role] || u.role}</td>
                  <td><span className={`badge badge-${u.is_active ? 'approved' : 'rejected'}`}>{u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-sm" onClick={() => handleEdit(u)} style={{ marginRight: '0.5rem' }}>Editar</button>
                    <button className="btn-sm" onClick={() => handleToggleActive(u.id)} style={{ marginRight: '0.5rem' }}>
                      {u.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p>No hay usuarios con ese rol</p>}
        </>
      )}
    </div>
  );
};

export default UsersManagement;