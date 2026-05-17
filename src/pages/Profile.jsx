import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authApi.updateProfile(formData);
      updateUser(res.data);
      setEditing(false);
    } catch (err) {
      alert('Error al actualizar perfil');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.changePassword(passwordData);
      setPasswordData({ current_password: '', new_password: '', new_password_confirm: '' });
      alert('Contraseña actualizada');
    } catch (err) {
      alert(err.response?.data?.current_password || 'Error al cambiar contraseña');
    }
  };

  return (
    <div className="page">
      <h1>Mi Perfil</h1>
      <div className="profile-card">
        <h2>Informacion Personal</h2>
        {editing ? (
          <form onSubmit={handleSubmit}>
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
            <div className="form-group">
              <label>Telefono</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <button type="submit" className="btn-primary">Guardar</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
          </form>
        ) : (
          <div className="info-grid">
            <div><strong>Nombre:</strong> {user?.first_name} {user?.last_name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Telefono:</strong> {user?.phone || '-'}</div>
            <div><strong>Rol:</strong> {user?.role_display}</div>
          </div>
        )}
        {!editing && <button className="btn-primary" onClick={() => setEditing(true)}>Editar</button>}
      </div>

      <div className="profile-card">
        <h2>Cambiar Contraseña</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label>Contraseña Actual</label>
            <input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required />
          </div>
          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Confirmar Nueva Contraseña</label>
            <input type="password" name="new_password_confirm" value={passwordData.new_password_confirm} onChange={handlePasswordChange} required minLength={8} />
          </div>
          <button type="submit" className="btn-primary">Cambiar Contraseña</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
