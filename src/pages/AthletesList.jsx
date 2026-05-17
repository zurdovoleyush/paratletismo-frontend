import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentApi, configApi } from '../api';
import { useAuth } from '../context/AuthContext';

const AthletesList = () => {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [classifications, setClassifications] = useState([]);
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
    date_of_birth: '',
    sex: '',
    classification_track: '',
    classification_field: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_info: '',
  });
  const isAdmin = ['admin', 'superadmin'].includes(user?.role);

  useEffect(() => {
    tournamentApi.getMyInstitution()
      .then(res => setMyInstitution(res.data))
      .catch(() => {});

    if (isAdmin) {
      tournamentApi.getAthletes()
        .then(res => setAthletes(res.data.results || res.data))
        .catch(() => {});
    } else {
      tournamentApi.getMyAthletes()
        .then(res => setAthletes(res.data.results || res.data))
        .catch(() => {});
    }

    configApi.getSexes().then(res => setSexes(res.data.results || res.data)).catch(() => {});
    configApi.getClassifications().then(res => setClassifications(res.data.results || res.data)).catch(() => {});
  }, [isAdmin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myInstitution) {
      alert('No estas asignado a ninguna institucion. Ve a Mi Perfil en el menu y selecciona una institucion primero.');
      return;
    }
    const fc = formData.classification_track || formData.classification_field;
    if (!fc) {
      alert('Debes seleccionar al menos una clasificacion funcional (Pista o Campo)');
      return;
    }
    try {
      const data = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        document_type: formData.document_type,
        document_number: formData.document_number,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        functional_classification: fc,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone,
        medical_info: formData.medical_info,
        institution: myInstitution.id,
      };
      if (editingItem) {
        delete data.password;
        await tournamentApi.updateAthlete(editingItem.id, data);
      } else {
        await tournamentApi.createAthlete(data);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({
        first_name: '', last_name: '', email: '', password: '', phone: '',
        document_type: 'dni', document_number: '', date_of_birth: '', sex: '',
        classification_track: '', classification_field: '',
        emergency_contact: '', emergency_phone: '', medical_info: '',
      });
      const res = isAdmin ? await tournamentApi.getAthletes() : await tournamentApi.getMyAthletes();
      setAthletes(res.data.results || res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert(editingItem ? 'Error al actualizar atleta' : 'Error al crear atleta');
      }
    }
  };

  const handleEdit = (athlete) => {
    setEditingItem(athlete);
    setFormData({
      first_name: athlete.first_name || '',
      last_name: athlete.last_name || '',
      email: athlete.email || '',
      password: '',
      phone: athlete.phone || '',
      document_type: athlete.document_type || 'dni',
      document_number: athlete.document_number || '',
      date_of_birth: athlete.date_of_birth || '',
      sex: athlete.sex || '',
      classification_track: athlete.classification_track || '',
      classification_field: athlete.classification_field || '',
      emergency_contact: athlete.emergency_contact || '',
      emergency_phone: athlete.emergency_phone || '',
      medical_info: athlete.medical_info || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Estas seguro de eliminar este atleta?')) return;
    try {
      await tournamentApi.deleteAthlete(id);
      const res = isAdmin ? await tournamentApi.getAthletes() : await tournamentApi.getMyAthletes();
      setAthletes(res.data.results || res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al eliminar atleta');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      first_name: '', last_name: '', email: '', password: '', phone: '',
      document_type: 'dni', document_number: '', date_of_birth: '', sex: '',
      classification_track: '', classification_field: '',
      emergency_contact: '', emergency_phone: '', medical_info: '',
    });
  };

  const trackClassifications = classifications.filter(c => c.code.startsWith('T'));
  const fieldClassifications = classifications.filter(c => c.code.startsWith('F'));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Atletas</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Atleta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h3>{editingItem ? 'Editar Atleta' : 'Nuevo Atleta'}</h3>
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
          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Nacimiento</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Sexo</label>
              <select name="sex" value={formData.sex} onChange={handleChange} required>
                <option value="">Seleccionar</option>
                {sexes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Clasificacion Funcional - Pista (T)</label>
            <select name="classification_track" value={formData.classification_track || ''} onChange={handleChange}>
              <option value="">Sin clasificacion pista</option>
              {trackClassifications.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Clasificacion Funcional - Campo (F)</label>
            <select name="classification_field" value={formData.classification_field || ''} onChange={handleChange}>
              <option value="">Sin clasificacion campo</option>
              {fieldClassifications.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contacto de Emergencia</label>
              <input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Telefono Emergencia</label>
              <input type="text" name="emergency_phone" value={formData.emergency_phone} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Informacion Medica</label>
            <textarea name="medical_info" value={formData.medical_info} onChange={handleChange} rows={3} />
          </div>
          <button type="submit" className="btn-primary">{editingItem ? 'Actualizar' : 'Crear'}</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Sexo</th>
            <th>Clasificacion</th>
            <th>Estado</th>
            <th>Edad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map(a => (
            <tr key={a.id}>
              <td>{a.user_name}</td>
              <td>{a.document_number || '-'}</td>
              <td>{a.sex_name || '-'}</td>
              <td>{a.classification_code || '-'}</td>
              <td><span className={`badge badge-${a.classification_status}`}>{a.classification_status === 'provisional' ? 'Provisoria' : 'Confirmada'}</span></td>
              <td>{a.age || '-'}</td>
              <td>
                <button className="btn-sm" onClick={() => handleEdit(a)} style={{ marginRight: '0.5rem' }}>Editar</button>
                {!isAdmin && <Link to={`/dashboard/athletes/${a.id}/register`} className="btn-sm" style={{ marginRight: '0.5rem' }}>Inscribir</Link>}
                <button className="btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {athletes.length === 0 && <p>No hay atletas registrados. Crea uno nuevo con el boton de arriba.</p>}
    </div>
  );
};

export default AthletesList;
