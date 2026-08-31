import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentApi, configApi } from '../api';
import { useAuth } from '../context/AuthContext';

const AthletesList = () => {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [trackClassifications, setTrackClassifications] = useState([]);
  const [fieldClassifications, setFieldClassifications] = useState([]);
  const [myInstitution, setMyInstitution] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [myCoachId, setMyCoachId] = useState(null);
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
    institution: '',
    coach: '',
    track_classification: '',
    field_classification: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_info: '',
    address_country: 'Argentina',
    address_province: '',
    address_city: '',
    address_street: '',
    guardian_name: '',
    guardian_document_type: 'dni',
    guardian_document_number: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_address_country: 'Argentina',
    guardian_address_province: '',
    guardian_address_city: '',
    guardian_address_street: '',
  });
  const isAdmin = ['admin', 'superadmin'].includes(user?.role);

  const calcAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isMinor = formData.date_of_birth ? calcAge(formData.date_of_birth) < 18 : false;

  useEffect(() => {
    tournamentApi.getMyInstitution()
      .then(res => setMyInstitution(res.data))
      .catch(() => {});

    tournamentApi.getInstitutions()
      .then(res => setInstitutions(res.data.results || res.data))
      .catch(() => {});

    tournamentApi.getCoaches()
      .then(res => setCoaches(res.data.results || res.data))
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

    if (user?.role === 'coach') {
      tournamentApi.getCoaches()
        .then(res => {
          const list = res.data.results || res.data;
          const mine = list.find(c => c.user === user.id);
          if (mine) setMyCoachId(mine.id);
        })
        .catch(() => {});
    }

    configApi.getSexes().then(res => setSexes(res.data.results || res.data)).catch(() => {});

    configApi.getDisciplines().then(res => {
      const disciplines = res.data.results || res.data;
      const trackDisc = disciplines.find(d => d.name.toLowerCase().includes('pista'));
      const fieldDisc = disciplines.find(d => d.name.toLowerCase().includes('campo'));
      if (trackDisc) {
        configApi.getClassifications({ discipline: trackDisc.id }).then(r => setTrackClassifications(r.data.results || r.data)).catch(() => {});
      }
      if (fieldDisc) {
        configApi.getClassifications({ discipline: fieldDisc.id }).then(r => setFieldClassifications(r.data.results || r.data)).catch(() => {});
      }
    }).catch(() => {});
  }, [isAdmin, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let instId = formData.institution || myInstitution?.id;
    if (!instId && user?.role === 'institution') {
      try {
        const res = await tournamentApi.getMyInstitution();
        instId = res.data?.id;
        setMyInstitution(res.data);
      } catch {}
    }
    if (!instId && user?.role !== 'institution') {
      alert('Selecciona una institucion para el atleta.');
      return;
    }
    try {
      const coachId = formData.coach || myCoachId || '';
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
        track_classification: formData.track_classification || undefined,
        field_classification: formData.field_classification || undefined,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone,
        medical_info: formData.medical_info,
        address_country: formData.address_country,
        address_province: formData.address_province,
        address_city: formData.address_city,
        address_street: formData.address_street,
        guardian_name: formData.guardian_name || '',
        guardian_document_type: formData.guardian_document_type || 'dni',
        guardian_document_number: formData.guardian_document_number || '',
        guardian_phone: formData.guardian_phone || '',
        guardian_email: formData.guardian_email || '',
        guardian_address_country: formData.guardian_address_country || 'Argentina',
        guardian_address_province: formData.guardian_address_province || '',
        guardian_address_city: formData.guardian_address_city || '',
        guardian_address_street: formData.guardian_address_street || '',
        institution: instId || undefined,
        coach: coachId || undefined,
      };
      if (editingItem) {
        if (!data.password) delete data.password;
        await tournamentApi.updateAthlete(editingItem.id, data);
      } else {
        await tournamentApi.createAthlete(data);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({
        first_name: '', last_name: '', email: '', password: '', phone: '',
        document_type: 'dni', document_number: '', date_of_birth: '', sex: '',
        institution: '', coach: '',
        track_classification: '', field_classification: '',
        emergency_contact: '', emergency_phone: '', medical_info: '',
        address_country: 'Argentina', address_province: '', address_city: '', address_street: '',
        guardian_name: '', guardian_document_type: 'dni', guardian_document_number: '', guardian_phone: '', guardian_email: '',
        guardian_address_country: 'Argentina', guardian_address_province: '', guardian_address_city: '', guardian_address_street: '',
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
      first_name: athlete.user_name?.split(' ')[0] || '',
      last_name: athlete.user_name?.split(' ').slice(1).join(' ') || '',
      email: athlete.user_email || '',
      password: '',
      phone: athlete.phone || '',
      document_type: athlete.document_type || 'dni',
      document_number: athlete.document_number || '',
      date_of_birth: athlete.date_of_birth ? athlete.date_of_birth.slice(0, 10) : '',
      sex: athlete.sex || '',
      institution: athlete.institution || '',
      coach: athlete.coach || '',
      track_classification: athlete.track_classification || '',
      field_classification: athlete.field_classification || '',
      emergency_contact: athlete.emergency_contact || '',
      emergency_phone: athlete.emergency_phone || '',
      medical_info: athlete.medical_info || '',
      address_country: athlete.address_country || 'Argentina',
      address_province: athlete.address_province || '',
      address_city: athlete.address_city || '',
      address_street: athlete.address_street || '',
      guardian_name: athlete.guardian_name || '',
      guardian_document_type: athlete.guardian_document_type || 'dni',
      guardian_document_number: athlete.guardian_document_number || '',
      guardian_phone: athlete.guardian_phone || '',
      guardian_email: athlete.guardian_email || '',
      guardian_address_country: athlete.guardian_address_country || 'Argentina',
      guardian_address_province: athlete.guardian_address_province || '',
      guardian_address_city: athlete.guardian_address_city || '',
      guardian_address_street: athlete.guardian_address_street || '',
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
      institution: '', coach: '',
      track_classification: '', field_classification: '',
      emergency_contact: '', emergency_phone: '', medical_info: '',
      address_country: 'Argentina', address_province: '', address_city: '', address_street: '',
      guardian_name: '', guardian_document_type: 'dni', guardian_document_number: '', guardian_phone: '', guardian_email: '',
      guardian_address_country: 'Argentina', guardian_address_province: '', guardian_address_city: '', guardian_address_street: '',
    });
  };

  const formatClassification = (a) => {
    const parts = [];
    if (a.track_classification_code) parts.push(`T:${a.track_classification_code}`);
    if (a.field_classification_code) parts.push(`F:${a.field_classification_code}`);
    return parts.join(' / ') || (a.classification_code || '-');
  };

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
              <label>Contrasenia {editingItem && '(dejar vacio para no cambiar)'}</label>
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
            {user?.role !== 'institution' && (
              <div className="form-group">
                <label>Institucion</label>
                <select name="institution" value={formData.institution || myInstitution?.id || ''} onChange={handleChange}>
                  <option value="">Seleccionar institucion...</option>
                  {institutions.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Entrenador</label>
              <select name="coach" value={formData.coach || myCoachId || ''} onChange={handleChange}>
                <option value="">Sin entrenador</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.user_name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Clasificacion Pista (T)</label>
              <select name="track_classification" value={formData.track_classification || ''} onChange={handleChange}>
                <option value="">Sin clasificar</option>
                {trackClassifications.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Clasificacion Campo (F)</label>
              <select name="field_classification" value={formData.field_classification || ''} onChange={handleChange}>
                <option value="">Sin clasificar</option>
                {fieldClassifications.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
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
          {isMinor && (
            <div className="form-card" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)' }}>
              <h4 style={{ color: 'var(--warning)', marginTop: 0 }}>Adulto Responsable (obligatorio para menores de 18 anos)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="guardian_email" value={formData.guardian_email} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo Documento</label>
                  <select name="guardian_document_type" value={formData.guardian_document_type} onChange={handleChange}>
                    <option value="dni">DNI</option>
                    <option value="passport">Pasaporte</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nro Documento *</label>
                  <input type="text" name="guardian_document_number" value={formData.guardian_document_number} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Telefono *</label>
                  <input type="text" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pais</label>
                  <input type="text" name="guardian_address_country" value={formData.guardian_address_country} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Provincia</label>
                  <input type="text" name="guardian_address_province" value={formData.guardian_address_province} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ciudad</label>
                  <input type="text" name="guardian_address_city" value={formData.guardian_address_city} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Direccion</label>
                  <input type="text" name="guardian_address_street" value={formData.guardian_address_street} onChange={handleChange} placeholder="Calle y numero" />
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="btn-primary">{editingItem ? 'Actualizar' : 'Crear'}</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Sexo</th>
            <th>Entrenador</th>
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
              <td>{a.coach_name || '-'}</td>
              <td>{formatClassification(a)}</td>
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
