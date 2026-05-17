import { useState, useEffect } from 'react';
import { tournamentApi } from '../api';
import { useAuth } from '../context/AuthContext';

const CoachesList = () => {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState([]);
  const [myInstitution, setMyInstitution] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    document_type: 'dni',
    document_number: '',
    specialties: '',
    license_number: '',
  });
  const isAdmin = ['admin', 'superadmin'].includes(user?.role);

  useEffect(() => {
    if (isAdmin) {
      tournamentApi.getCoaches()
        .then(res => setCoaches(res.data.results || res.data))
        .catch(() => {});
    } else {
      tournamentApi.getMyInstitution()
        .then(res => {
          setMyInstitution(res.data);
          tournamentApi.getInstitutionCoaches(res.data.id)
            .then(res => setCoaches(res.data.results || res.data))
            .catch(() => {});
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myInstitution && !isAdmin) {
      alert('Debes crear tu institucion primero');
      return;
    }
    try {
      const data = { ...formData };
      if (editingItem) {
        if (!data.password) delete data.password;
        await tournamentApi.updateCoach(editingItem.id, data);
      } else {
        if (myInstitution) data.institution = myInstitution.id;
        await tournamentApi.createCoach(data);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ first_name: '', last_name: '', email: '', password: '', phone: '', document_type: 'dni', document_number: '', specialties: '', license_number: '' });
      if (isAdmin) {
        const res = await tournamentApi.getCoaches();
        setCoaches(res.data.results || res.data);
      } else {
        const res = await tournamentApi.getInstitutionCoaches(myInstitution.id);
        setCoaches(res.data.results || res.data);
      }
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert(editingItem ? 'Error al actualizar entrenador' : 'Error al crear entrenador');
      }
    }
  };

  const handleEdit = (coach) => {
    setEditingItem(coach);
    setFormData({
      first_name: coach.first_name || '',
      last_name: coach.last_name || '',
      email: coach.email || '',
      password: '',
      phone: coach.phone || '',
      document_type: coach.document_type || 'dni',
      document_number: coach.document_number || '',
      specialties: coach.specialties || '',
      license_number: coach.license_number || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Estas seguro de eliminar este entrenador?')) return;
    try {
      await tournamentApi.deleteCoach(id);
      if (isAdmin) {
        const res = await tournamentApi.getCoaches();
        setCoaches(res.data.results || res.data);
      } else {
        const res = await tournamentApi.getInstitutionCoaches(myInstitution.id);
        setCoaches(res.data.results || res.data);
      }
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al eliminar entrenador');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ first_name: '', last_name: '', email: '', password: '', phone: '', document_type: 'dni', document_number: '', specialties: '', license_number: '' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Entrenadores</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Entrenador'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h3>{editingItem ? 'Editar Entrenador' : 'Nuevo Entrenador'}</h3>
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
              <label>Contraseña {editingItem && '(dejar vacio para no cambiar)'}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} minLength={8} />
            </div>
          </div>
          <div className="form-group">
            <label>Telefono</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo Documento</label>
              <select name="document_type" value={formData.document_type} onChange={handleChange}>
                <option value="dni">DNI</option>
                <option value="passport">Pasaporte</option>
                <option value="le">Libreta de Enrolamiento</option>
                <option value="lc">Libreta Civica</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nro Documento</label>
              <input type="text" name="document_number" value={formData.document_number} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Especialidades</label>
            <textarea name="specialties" value={formData.specialties} onChange={handleChange} rows={2} />
          </div>
          <div className="form-group">
            <label>Nro Licencia</label>
            <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary">{editingItem ? 'Actualizar' : 'Crear'}</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Email</th>
            <th>Especialidades</th>
            <th>Licencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {coaches.map(c => (
            <tr key={c.id}>
              <td>{c.user_name}</td>
              <td>{c.document_number || '-'}</td>
              <td>{c.user_email}</td>
              <td>{c.specialties || '-'}</td>
              <td>{c.license_number || '-'}</td>
              <td>
                <button className="btn-sm" onClick={() => handleEdit(c)} style={{ marginRight: '0.5rem' }}>Editar</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {coaches.length === 0 && <p>No hay entrenadores registrados. Crea uno nuevo con el boton de arriba.</p>}
    </div>
  );
};

export default CoachesList;
