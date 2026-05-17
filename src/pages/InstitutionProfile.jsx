import { useState, useEffect } from 'react';
import { tournamentApi } from '../api';

const InstitutionProfile = () => {
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    tournamentApi.getMyInstitution()
      .then(res => {
        setInstitution(res.data);
        setFormData(res.data);
        setCreating(false);
      })
      .catch(() => {
        setCreating(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await tournamentApi.updateInstitution(institution.id, formData);
      setInstitution(res.data);
      setEditing(false);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al actualizar');
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await tournamentApi.createInstitution(formData);
      setInstitution(res.data);
      setCreating(false);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al crear institucion');
      }
    }
  };

  if (loading) return <p>Cargando...</p>;

  if (creating) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Registrar Institucion</h1>
        </div>
        <form onSubmit={handleCreate} className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Nombre Corto</label>
              <input type="text" name="short_name" value={formData.short_name} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Descripcion</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group">
            <label>Direccion</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ciudad</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Provincia</label>
              <input type="text" name="province" value={formData.province} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Telefono</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Website</label>
            <input type="url" name="website" value={formData.website} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary">Crear Institucion</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mi Institucion</h1>
        <button className="btn-primary" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Nombre Corto</label>
              <input type="text" name="short_name" value={formData.short_name || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Descripcion</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group">
            <label>Direccion</label>
            <input type="text" name="address" value={formData.address || ''} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ciudad</label>
              <input type="text" name="city" value={formData.city || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Provincia</label>
              <input type="text" name="province" value={formData.province || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Telefono</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Website</label>
            <input type="url" name="website" value={formData.website || ''} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary">Guardar Cambios</button>
        </form>
      ) : (
        <div className="profile-card">
          <h2>{institution.name}</h2>
          {institution.description && <p>{institution.description}</p>}
          <div className="info-grid">
            <div><strong>Direccion:</strong> {institution.address || '-'}</div>
            <div><strong>Ciudad:</strong> {institution.city || '-'}</div>
            <div><strong>Provincia:</strong> {institution.province || '-'}</div>
            <div><strong>Telefono:</strong> {institution.phone || '-'}</div>
            <div><strong>Email:</strong> {institution.email || '-'}</div>
            <div><strong>Website:</strong> {institution.website || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionProfile;
