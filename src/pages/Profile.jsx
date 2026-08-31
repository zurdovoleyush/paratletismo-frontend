import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, tournamentApi, configApi, competitionApi } from '../api';
import { formatMark, effClassCode, medalOf } from '../utils/marks';

const DOCUMENT_TYPES = [
  { value: 'dni', label: 'DNI' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'le', label: 'Libreta de Enrolamiento' },
  { value: 'lc', label: 'Libreta Civica' },
  { value: 'other', label: 'Otro' },
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [athleteProfileError, setAthleteProfileError] = useState(false);
  const [athleteLoading, setAthleteLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [athleteEditing, setAthleteEditing] = useState(false);
  const [trackClassifications, setTrackClassifications] = useState([]);
  const [fieldClassifications, setFieldClassifications] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [athleteForm, setAthleteForm] = useState({});
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [cudFile, setCudFile] = useState(null);
  const [resultsHistory, setResultsHistory] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [personalBests, setPersonalBests] = useState([]);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const isAthlete = user?.role === 'athlete';

  useEffect(() => {
    if (isAthlete) {
      setAthleteLoading(true);

      configApi.getSexes().then(r => setSexes(r.data.results || r.data)).catch(() => {});

      tournamentApi.getAvailableInstitutions().then(r => setInstitutions(r.data.results || r.data)).catch(() => {});

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

      tournamentApi.getMyAthleteProfile()
        .then(res => {
          setAthleteProfile(res.data);
          setAthleteProfileError(false);
          setAthleteForm({
            institution: res.data.institution || '',
            phone: res.data.phone || '',
            document_type: res.data.document_type || 'dni',
            document_number: res.data.document_number || '',
            date_of_birth: res.data.date_of_birth ? res.data.date_of_birth.slice(0, 10) : '',
            sex: res.data.sex || '',
            track_classification: res.data.track_classification || '',
            field_classification: res.data.field_classification || '',
            emergency_contact: res.data.emergency_contact || '',
            emergency_phone: res.data.emergency_phone || '',
            medical_info: res.data.medical_info || '',
            address_country: res.data.address_country || 'Argentina',
            address_province: res.data.address_province || '',
            address_city: res.data.address_city || '',
            address_street: res.data.address_street || '',
            guardian_name: res.data.guardian_name || '',
            guardian_document_type: res.data.guardian_document_type || 'dni',
            guardian_document_number: res.data.guardian_document_number || '',
            guardian_phone: res.data.guardian_phone || '',
            guardian_email: res.data.guardian_email || '',
            guardian_address_country: res.data.guardian_address_country || 'Argentina',
            guardian_address_province: res.data.guardian_address_province || '',
            guardian_address_city: res.data.guardian_address_city || '',
            guardian_address_street: res.data.guardian_address_street || '',
          });
        })
        .catch(() => setAthleteProfileError(true))
        .finally(() => setAthleteLoading(false));

      setResultsLoading(true);
      competitionApi.getMyResults()
        .then(res => setResultsHistory(res.data.results || res.data || []))
        .catch(() => {})
        .finally(() => setResultsLoading(false));
    }
  }, [isAthlete]);

  useEffect(() => {
    if (isAthlete && athleteProfile?.id) {
      competitionApi.getAthleteBestMarks(athleteProfile.id)
        .then(res => setPersonalBests(res.data.bests || []))
        .catch(() => setPersonalBests([]));
    }
  }, [isAthlete, athleteProfile?.id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAthleteChange = (e) => {
    setAthleteForm({ ...athleteForm, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCudFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setCudFile(file);
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

  const handleAthleteSubmit = async (e) => {
    e.preventDefault();
    try {
      const hasFiles = profileImageFile || cudFile;
      const nullableFks = ['sex', 'track_classification', 'field_classification', 'coach', 'institution'];
      let payload;
      if (hasFiles) {
        payload = new FormData();
        for (const [key, val] of Object.entries(athleteForm)) {
          if (nullableFks.includes(key) && val === '') continue;
          payload.append(key, val);
        }
        if (profileImageFile) payload.append('profile_image', profileImageFile);
        if (cudFile) payload.append('cud_file', cudFile);
      } else {
        payload = { ...athleteForm };
        nullableFks.forEach(k => {
          if (payload[k] === '') payload[k] = null;
        });
      }
      const res = await tournamentApi.updateMyAthleteProfile(payload);
      setAthleteProfile(res.data);
      setAthleteEditing(false);
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setCudFile(null);
      alert('Datos de atleta actualizados');
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        const msgs = Object.entries(errors).map(([field, msgs]) => {
          const label = { date_of_birth: 'Fecha de nacimiento', document_number: 'Nro. de documento', sex: 'Sexo', phone: 'Teléfono', emergency_contact: 'Contacto de emergencia', emergency_phone: 'Tel. de emergencia', medical_info: 'Info. médica', address_street: 'Dirección', address_city: 'Ciudad', address_province: 'Provincia', guardian_name: 'Nombre del tutor', guardian_document_number: 'DNI del tutor', guardian_phone: 'Tel. del tutor', guardian_email: 'Email del tutor', guardian_address_street: 'Dirección del tutor', guardian_address_city: 'Ciudad del tutor', guardian_address_province: 'Provincia del tutor', track_classification: 'Clasif. pista', field_classification: 'Clasif. campo', profile_image: 'Foto de perfil', cud_file: 'CUD' }[field] || field;
          return `${label}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
        });
        alert(msgs.join('\n'));
      } else {
        alert('Error al actualizar datos de atleta');
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await authApi.changePassword(passwordData);
      setPasswordData({ current_password: '', new_password: '', new_password_confirm: '' });
      alert('Contrasenia actualizada');
    } catch (err) {
      alert(err.response?.data?.current_password || 'Error al cambiar contrasenia');
    }
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isMinor = calcAge(athleteForm.date_of_birth) <= 17;

  const bestMap = {};
  (personalBests || []).forEach(b => { bestMap[`${b.is_time_based}|${b.event_type_name}`] = b; });
  const isBestRow = (fr) => {
    const b = bestMap[`${fr.is_track}|${fr.event_type_name}`];
    return b && String(fr.best_mark).trim() === String(b.mark).trim();
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
            <div className="form-actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <>
            <div className="info-grid">
              <div><strong>Nombre:</strong> {user?.first_name} {user?.last_name}</div>
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Telefono:</strong> {user?.phone || '-'}</div>
              <div><strong>Rol:</strong> {user?.role_display}</div>
            </div>
            <button className="btn-primary" onClick={() => setEditing(true)}>Editar</button>
          </>
        )}
      </div>

      {isAthlete && (
        <>
          <div className="profile-card">
            <h2>Datos del Atleta</h2>
            {athleteLoading ? <p>Cargando...</p> : athleteProfileError ? (
              <p className="error-message">No tienes un perfil de atleta completo. Contacta a un administrador para completar tu registro.</p>
            ) : athleteEditing ? (
              <form onSubmit={handleAthleteSubmit}>
                <h3>Documentacion</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Documento</label>
                    <select name="document_type" value={athleteForm.document_type} onChange={handleAthleteChange}>
                      {DOCUMENT_TYPES.map(dt => (
                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Numero de Documento</label>
                    <input type="text" name="document_number" value={athleteForm.document_number} onChange={handleAthleteChange} />
                  </div>
                </div>

                <h3 style={{ marginTop: '1.5rem' }}>Foto de Perfil</h3>
                <div className="form-group">
                  {(profileImagePreview || athleteProfile?.profile_image) && (
                    <div style={{ marginBottom: '8px' }}>
                      <img
                        src={profileImagePreview || athleteProfile.profile_image}
                        alt="Preview"
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--border-color)' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}>
                      📷 Camara
                      <input type="file" accept="image/*" capture="environment" onChange={handleProfileImageChange} style={{ display: 'none' }} />
                    </label>
                    <label className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}>
                      📁 Seleccionar Archivo
                      <input type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <h3 style={{ marginTop: '1.5rem' }}>Certificado Unico de Discapacidad (CUD)</h3>
                <div className="form-group">
                  {athleteProfile?.cud_file && !cudFile && (
                    <div style={{ marginBottom: '8px' }}>
                      <a href={athleteProfile.cud_file} target="_blank" rel="noopener noreferrer">Ver CUD actual</a>
                    </div>
                  )}
                  <label className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', display: 'inline-block' }}>
                    📎 {cudFile ? cudFile.name : 'Seleccionar archivo CUD'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCudFileChange} style={{ display: 'none' }} />
                  </label>
                  {cudFile && (
                    <button type="button" className="btn-secondary" style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setCudFile(null)}>Quitar</button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Nacimiento</label>
                    <input type="date" name="date_of_birth" value={athleteForm.date_of_birth} onChange={handleAthleteChange} required />
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select name="sex" value={athleteForm.sex} onChange={handleAthleteChange}>
                      <option value="">Seleccionar...</option>
                      {sexes.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Telefono del Atleta</label>
                    <input type="text" name="phone" value={athleteForm.phone} onChange={handleAthleteChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Institucion</label>
                  <select name="institution" value={athleteForm.institution} onChange={handleAthleteChange}>
                    <option value="">Sin institucion</option>
                    {institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                <h3 style={{ marginTop: '1.5rem' }}>Clasificacion Funcional</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Clasificacion de Pista (T)</label>
                    <select name="track_classification" value={athleteForm.track_classification} onChange={handleAthleteChange}>
                      <option value="">Sin clasificar</option>
                      {trackClassifications.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Clasificacion de Campo (F)</label>
                    <select name="field_classification" value={athleteForm.field_classification} onChange={handleAthleteChange}>
                      <option value="">Sin clasificar</option>
                      {fieldClassifications.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 style={{ marginTop: '1.5rem' }}>Domicilio</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Pais</label>
                    <input type="text" name="address_country" value={athleteForm.address_country} onChange={handleAthleteChange} />
                  </div>
                  <div className="form-group">
                    <label>Provincia</label>
                    <input type="text" name="address_province" value={athleteForm.address_province} onChange={handleAthleteChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input type="text" name="address_city" value={athleteForm.address_city} onChange={handleAthleteChange} />
                  </div>
                  <div className="form-group">
                    <label>Direccion</label>
                    <input type="text" name="address_street" value={athleteForm.address_street} onChange={handleAthleteChange} placeholder="Calle y numero" />
                  </div>
                </div>

                <h3 style={{ marginTop: '1.5rem' }}>Contacto de Emergencia</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre de Contacto</label>
                    <input type="text" name="emergency_contact" value={athleteForm.emergency_contact} onChange={handleAthleteChange} />
                  </div>
                  <div className="form-group">
                    <label>Telefono de Emergencia</label>
                    <input type="text" name="emergency_phone" value={athleteForm.emergency_phone} onChange={handleAthleteChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Informacion Medica</label>
                  <textarea name="medical_info" value={athleteForm.medical_info} onChange={handleAthleteChange} rows="3" />
                </div>

                {athleteForm.date_of_birth && isMinor && (
                  <>
                    <h3 style={{ marginTop: '1.5rem', color: 'var(--warning)' }}>
                      Adulto Responsable (menor de 18 anos)
                    </h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" name="guardian_name" value={athleteForm.guardian_name} onChange={handleAthleteChange} required />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="guardian_email" value={athleteForm.guardian_email} onChange={handleAthleteChange} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tipo de Documento</label>
                        <select name="guardian_document_type" value={athleteForm.guardian_document_type} onChange={handleAthleteChange}>
                          {DOCUMENT_TYPES.map(dt => (
                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Numero de Documento</label>
                        <input type="text" name="guardian_document_number" value={athleteForm.guardian_document_number} onChange={handleAthleteChange} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Telefono</label>
                        <input type="text" name="guardian_phone" value={athleteForm.guardian_phone} onChange={handleAthleteChange} required />
                      </div>
                    </div>
                    <h4>Domicilio del Adulto Responsable</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Pais</label>
                        <input type="text" name="guardian_address_country" value={athleteForm.guardian_address_country} onChange={handleAthleteChange} />
                      </div>
                      <div className="form-group">
                        <label>Provincia</label>
                        <input type="text" name="guardian_address_province" value={athleteForm.guardian_address_province} onChange={handleAthleteChange} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Ciudad</label>
                        <input type="text" name="guardian_address_city" value={athleteForm.guardian_address_city} onChange={handleAthleteChange} />
                      </div>
                      <div className="form-group">
                        <label>Direccion</label>
                        <input type="text" name="guardian_address_street" value={athleteForm.guardian_address_street} onChange={handleAthleteChange} placeholder="Calle y numero" />
                      </div>
                    </div>
                  </>
                )}

                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn-primary">Guardar Datos</button>
                  <button type="button" className="btn-secondary" onClick={() => setAthleteEditing(false)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <>
                <div className="info-grid">
                  <div><strong>Documento:</strong> {athleteProfile?.document_number ? `${athleteProfile.document_type?.toUpperCase()} ${athleteProfile.document_number}` : '-'}</div>
                  {athleteProfile?.profile_image && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <img src={athleteProfile.profile_image} alt="Foto de perfil" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                    </div>
                  )}
                  <div><strong>CUD:</strong> {athleteProfile?.cud_file ? <a href={athleteProfile.cud_file} target="_blank" rel="noopener noreferrer">Ver archivo</a> : 'No cargado'}</div>
                  <div><strong>Fecha de Nac.:</strong> {athleteProfile?.date_of_birth ? new Date(athleteProfile.date_of_birth).toLocaleDateString() : '-'}</div>
                  <div><strong>Edad:</strong> {athleteProfile?.age != null ? `${athleteProfile.age} anos` : '-'}</div>
                  <div><strong>Sexo:</strong> {athleteProfile?.sex_name || '-'}</div>
                  <div><strong>Clasif. Pista:</strong> {athleteProfile?.track_classification_code ? `${athleteProfile.track_classification_code} - ${athleteProfile.track_classification_name}` : 'Sin clasificar'}</div>
                  <div><strong>Clasif. Campo:</strong> {athleteProfile?.field_classification_code ? `${athleteProfile.field_classification_code} - ${athleteProfile.field_classification_name}` : 'Sin clasificar'}</div>
                  <div><strong>Telefono:</strong> {athleteProfile?.phone || '-'}</div>
                  <div><strong>Institucion:</strong> {athleteProfile?.institution_name || '-'}</div>
                </div>

                <h3 style={{ marginTop: '1.5rem' }}>Domicilio</h3>
                <div className="info-grid">
                  <div><strong>Pais:</strong> {athleteProfile?.address_country || '-'}</div>
                  <div><strong>Provincia:</strong> {athleteProfile?.address_province || '-'}</div>
                  <div><strong>Ciudad:</strong> {athleteProfile?.address_city || '-'}</div>
                  <div><strong>Direccion:</strong> {athleteProfile?.address_street || '-'}</div>
                </div>

                <h3 style={{ marginTop: '1.5rem' }}>Contacto de Emergencia</h3>
                <div className="info-grid">
                  <div><strong>Nombre:</strong> {athleteProfile?.emergency_contact || '-'}</div>
                  <div><strong>Telefono:</strong> {athleteProfile?.emergency_phone || '-'}</div>
                  <div><strong>Info. Medica:</strong> {athleteProfile?.medical_info || '-'}</div>
                </div>

                {athleteProfile?.is_minor && (
                  <>
                    <h3 style={{ marginTop: '1.5rem', color: 'var(--warning)' }}>Adulto Responsable</h3>
                    <div className="info-grid">
                      <div><strong>Nombre:</strong> {athleteProfile?.guardian_name || '-'}</div>
                      <div><strong>Documento:</strong> {athleteProfile?.guardian_document_number ? `${athleteProfile.guardian_document_type?.toUpperCase()} ${athleteProfile.guardian_document_number}` : '-'}</div>
                      <div><strong>Telefono:</strong> {athleteProfile?.guardian_phone || '-'}</div>
                      <div><strong>Email:</strong> {athleteProfile?.guardian_email || '-'}</div>
                      <div><strong>Domicilio:</strong> {[athleteProfile?.guardian_address_street, athleteProfile?.guardian_address_city, athleteProfile?.guardian_address_province].filter(Boolean).join(', ') || '-'}</div>
                    </div>
                  </>
                )}

                <button className="btn-primary" onClick={() => setAthleteEditing(true)} style={{ marginTop: '1rem' }}>Editar Datos</button>
              </>
            )}
          </div>

          <div className="profile-card">
            <h2>Clasificacion Funcional</h2>
            <div className="info-grid">
              <div><strong>Estado:</strong> {athleteProfile?.classification_status === 'confirmed' ? 'Confirmada' : 'Provisoria'}</div>
              <div><strong>Pista:</strong> {athleteProfile?.track_classification_code ? `${athleteProfile.track_classification_code} - ${athleteProfile.track_classification_name}` : 'Sin clasificar'}</div>
              <div><strong>Campo:</strong> {athleteProfile?.field_classification_code ? `${athleteProfile.field_classification_code} - ${athleteProfile.field_classification_name}` : 'Sin clasificar'}</div>
              {athleteProfile?.classification_notes && <div><strong>Notas:</strong> {athleteProfile.classification_notes}</div>}
            </div>
          </div>

          <div className="profile-card best-card">
            <h2>🥇 Mejores Marcas Personales</h2>
            <p className="tournament-location">Mejor marca en cada disciplina donde participaste, con tu posicion entre los records.</p>
            {personalBests.length === 0 ? (
              <p>Sin marcas numericas registradas aun en torneos publicos.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Disciplina</th>
                    <th>Sexo</th>
                    <th>Categoria</th>
                    <th>Clasif.</th>
                    <th>Marca</th>
                    <th>Torneo</th>
                    <th>Anio</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {personalBests.map((b, i) => (
                    <tr key={i} className={`record-row record-${b.rank <= 3 ? b.rank : 'best'}`}>
                      <td><strong>{b.event_type_name}</strong></td>
                      <td>{b.sex_name}</td>
                      <td>{b.category_name}</td>
                      <td>{effClassCode(b.is_time_based, null, b.class_codes[0]) || '-'}</td>
                      <td>
                        <strong>{formatMark(b)}</strong>
                        {(b.wind !== null && b.wind !== undefined) && <span className="hint"> ({Number(b.wind).toFixed(1)} m/s)</span>}
                      </td>
                      <td className="hint">{b.tournament_name}</td>
                      <td className="hint">{b.tournament_date ? new Date(b.tournament_date).getFullYear() : '-'}</td>
                      <td>{b.rank ? `${medalOf(b.rank)} ${b.rank}° de ${b.total}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="profile-card">
            <h2>Historial de Resultados</h2>
            {resultsLoading ? (
              <p>Cargando...</p>
            ) : resultsHistory.length === 0 ? (
              <p>Aun no tienes resultados registrados.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Torneo</th>
                    <th>Prueba</th>
                    <th>Tipo</th>
                    <th>Posicion</th>
                    <th>Marca</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsHistory.map(fr => (
                    <tr key={fr.id} className={`${fr.rank <= 3 ? 'top3' : ''} ${isBestRow(fr) ? 'pb-row' : ''}`}>
                      <td>{fr.scheduled_date ? new Date(fr.scheduled_date).toLocaleDateString() : '-'}</td>
                      <td>
                        {fr.tournament_name}
                        {fr.tournament_city && <span className="hint"> ({fr.tournament_city})</span>}
                      </td>
                      <td><strong>{fr.tournament_event_name}</strong></td>
                      <td>{fr.is_track ? 'Pista' : 'Campo'}</td>
                      <td>{fr.rank ? `#${fr.rank}` : '-'}</td>
                      <td>{fr.best_mark || '-'}</td>
                      <td>{fr.is_dnf ? 'DNF' : fr.is_dns ? 'DNS' : fr.is_dq ? 'DQ' : 'OK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <div className="profile-card">
        <h2>Cambiar Contrasenia</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label>Contrasenia Actual</label>
            <input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required />
          </div>
          <div className="form-group">
            <label>Nueva Contrasenia</label>
            <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Confirmar Nueva Contrasenia</label>
            <input type="password" name="new_password_confirm" value={passwordData.new_password_confirm} onChange={handlePasswordChange} required minLength={8} />
          </div>
          <button type="submit" className="btn-primary">Cambiar Contrasenia</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;