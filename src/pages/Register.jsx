import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, configApi } from '../api';

const DOCUMENT_TYPES = [
  { value: 'dni', label: 'DNI' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'le', label: 'Libreta de Enrolamiento' },
  { value: 'lc', label: 'Libreta Civica' },
  { value: 'other', label: 'Otro' },
];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    institution_name: '',
    institution_short_name: '',
    email: '',
    phone: '',
    role: 'athlete',
    password: '',
    password_confirm: '',
    date_of_birth: '',
    document_type: 'dni',
    document_number: '',
    sex: '',
    track_classification: '',
    field_classification: '',
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackClassifications, setTrackClassifications] = useState([]);
  const [fieldClassifications, setFieldClassifications] = useState([]);

  useEffect(() => {
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
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const isAthlete = formData.role === 'athlete';
  const isCoach = formData.role === 'coach';
  const isInstitution = formData.role === 'institution';
  const isMinor = isAthlete && calcAge(formData.date_of_birth) <= 17;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.password_confirm) {
      setError('Las contrasenias no coinciden');
      setLoading(false);
      return;
    }

    try {
      const basePayload = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        role: formData.role,
        phone: formData.phone,
      };
      if (isInstitution) {
        basePayload.first_name = formData.institution_name;
        basePayload.last_name = formData.institution_short_name || '';
      } else {
        basePayload.first_name = formData.first_name;
        basePayload.last_name = formData.last_name;
      }
      if (isAthlete) {
        Object.assign(basePayload, {
          date_of_birth: formData.date_of_birth,
          document_type: formData.document_type,
          document_number: formData.document_number,
          sex: formData.sex || undefined,
          track_classification: formData.track_classification || undefined,
          field_classification: formData.field_classification || undefined,
          address_country: formData.address_country,
          address_province: formData.address_province,
          address_city: formData.address_city,
          address_street: formData.address_street,
        });
        if (isMinor) {
          Object.assign(basePayload, {
            guardian_name: formData.guardian_name,
            guardian_document_type: formData.guardian_document_type,
            guardian_document_number: formData.guardian_document_number,
            guardian_phone: formData.guardian_phone,
            guardian_email: formData.guardian_email,
            guardian_address_country: formData.guardian_address_country,
            guardian_address_province: formData.guardian_address_province,
            guardian_address_city: formData.guardian_address_city,
            guardian_address_street: formData.guardian_address_street,
          });
        }
      }
      await authApi.register(basePayload);
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        setError(Object.values(errors).flat().join(', '));
      } else {
        setError('Error al registrarse');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Registro</h1>
          <p>Crear cuenta nueva</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Tipo de cuenta</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="athlete">Atleta</option>
              <option value="coach">Entrenador</option>
              <option value="institution">Institucion</option>
            </select>
          </div>

          {isInstitution ? (
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de la Institucion</label>
                <input type="text" name="institution_name" value={formData.institution_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nombre Corto</label>
                <input type="text" name="institution_short_name" value={formData.institution_short_name} onChange={handleChange} placeholder="Ej: CPAR" />
              </div>
            </div>
          ) : (
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
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Telefono (opcional)</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          {isAthlete && (
            <>
              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-light)' }}>
                Datos del Atleta
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Documento</label>
                  <select name="document_type" value={formData.document_type} onChange={handleChange}>
                    {DOCUMENT_TYPES.map(dt => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Numero de Documento</label>
                  <input type="text" name="document_number" value={formData.document_number} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Nacimiento</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
                </div>
              </div>

              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-light)' }}>
                Clasificacion Funcional
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Clasificacion de Pista (T)</label>
                  <select name="track_classification" value={formData.track_classification} onChange={handleChange}>
                    <option value="">Sin clasificar</option>
                    {trackClassifications.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Clasificacion de Campo (F)</label>
                  <select name="field_classification" value={formData.field_classification} onChange={handleChange}>
                    <option value="">Sin clasificar</option>
                    {fieldClassifications.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-light)' }}>
                Domicilio
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Pais</label>
                  <input type="text" name="address_country" value={formData.address_country} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Provincia</label>
                  <input type="text" name="address_province" value={formData.address_province} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ciudad</label>
                  <input type="text" name="address_city" value={formData.address_city} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Direccion</label>
                  <input type="text" name="address_street" value={formData.address_street} onChange={handleChange} placeholder="Calle y numero" />
                </div>
              </div>

              {isMinor && (
                <>
                  <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                    Adulto Responsable (menor de 18 anos)
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre Completo</label>
                      <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} required={isMinor} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" name="guardian_email" value={formData.guardian_email} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Documento</label>
                      <select name="guardian_document_type" value={formData.guardian_document_type} onChange={handleChange}>
                        {DOCUMENT_TYPES.map(dt => (
                          <option key={dt.value} value={dt.value}>{dt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Numero de Documento</label>
                      <input type="text" name="guardian_document_number" value={formData.guardian_document_number} onChange={handleChange} required={isMinor} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Telefono del Adulto Responsable</label>
                    <input type="text" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required={isMinor} />
                  </div>
                  <h4 style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Domicilio del Adulto Responsable</h4>
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
                </>
              )}
            </>
          )}

          <div className="form-group">
            <label>Contrasenia</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Confirmar Contrasenia</label>
            <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} required minLength={8} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <div className="auth-actions">
          <Link to="/tournaments" className="action-btn action-tournaments">
            <span className="action-icon">🏆</span>
            <span className="action-text">
              <strong>Ver Torneos</strong>
              <small>Torneos publicos</small>
            </span>
          </Link>
          <Link to="/records" className="action-btn action-records">
            <span className="action-icon">🥇</span>
            <span className="action-text">
              <strong>Records</strong>
              <small>Mejores marcas</small>
            </span>
          </Link>
          <Link to="/results/en-curso" className="action-btn action-inprogress">
            <span className="action-icon">📊</span>
            <span className="action-text">
              <strong>Resultados</strong>
              <small>En curso y finalizados</small>
            </span>
          </Link>
        </div>
        <div className="auth-links">
          <Link to="/login" className="auth-register-link">Volver al Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;