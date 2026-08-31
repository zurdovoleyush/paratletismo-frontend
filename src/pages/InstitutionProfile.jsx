import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentApi, competitionApi } from '../api';

const InstitutionProfile = () => {
  const [institution, setInstitution] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [coachCount, setCoachCount] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [resultsHistory, setResultsHistory] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [athleteFilter, setAthleteFilter] = useState('');
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

  const loadInstitutionData = (inst) => {
    if (!inst?.id) return;
    tournamentApi.getInstitutionAthletes(inst.id)
      .then(res => setAthletes(res.data.results || res.data))
      .catch(() => {});
    tournamentApi.getInstitutionCoaches(inst.id)
      .then(res => {
        const list = res.data.results || res.data;
        setCoachCount(list.length);
      })
      .catch(() => {});
    tournamentApi.getInstitutionTournaments(inst.id)
      .then(res => setTournaments(res.data.results || res.data))
      .catch(() => {});
  };

  useEffect(() => {
    tournamentApi.getMyInstitution()
      .then(res => {
        if (!res.data?.id) {
          setInstitution(null);
          setCreating(true);
        } else {
          setInstitution(res.data);
          setFormData(res.data);
          setCreating(false);
          loadInstitutionData(res.data);
        }
      })
      .catch(() => {
        setCreating(true);
      })
      .finally(() => setLoading(false));

    setResultsLoading(true);
    competitionApi.getMyResults()
      .then(res => setResultsHistory(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setResultsLoading(false));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const EDITED_FIELDS = ['description', 'address', 'city', 'province', 'phone', 'website'];
  const CREATE_FIELDS = ['description', 'address', 'city', 'province', 'phone', 'website'];

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const data = {};
      EDITED_FIELDS.forEach(f => { data[f] = formData[f] || ''; });
      const res = await tournamentApi.updateInstitution(institution.id, data);
      setInstitution(res.data);
      setEditing(false);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al actualizar: ' + JSON.stringify(err.response?.data || err.message));
      }
      console.error('Institution update error:', err.response?.status, err.response?.data);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = {};
      CREATE_FIELDS.forEach(f => { data[f] = formData[f] || ''; });
      const res = await tournamentApi.createInstitution(data);
      setInstitution(res.data);
      setCreating(false);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al crear institucion: ' + JSON.stringify(err.response?.data || err.message));
      }
    }
  };

  if (loading) return <p>Cargando...</p>;

  const filteredResults = resultsHistory.filter(fr =>
    !athleteFilter || (fr.athlete_name || '').toLowerCase().includes(athleteFilter.toLowerCase())
  );

  if (creating) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Completar datos de la Institucion</h1>
          <p style={{ color: 'var(--text-light)' }}>Los datos de nombre, nombre corto y email se tomaron del registro.</p>
        </div>
        <form onSubmit={handleCreate} className="form-card">
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
          </div>
          <div className="form-group">
            <label>Website</label>
            <input type="url" name="website" value={formData.website} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary">Completar Registro</button>
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
          </div>
          <div className="form-group">
            <label>Website</label>
            <input type="url" name="website" value={formData.website || ''} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary">Guardar Cambios</button>
        </form>
      ) : (
        <>
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
              <div><strong>Atletas:</strong> {athletes.length}</div>
              <div><strong>Entrenadores:</strong> {coachCount ?? '-'}</div>
            </div>
          </div>

          <div className="profile-card" style={institution.can_organize ? { borderLeft: '4px solid #27ae60' } : { borderLeft: '4px solid #f39c12' }}>
            <h2>Estado de Organizador</h2>
            {institution.can_organize ? (
              <div>
                <p style={{ color: '#27ae60', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  Habilitado para organizar torneos
                </p>
                {institution.organized_until && (
                  <p style={{ margin: 0 }}>
                    <strong>Vigencia:</strong> hasta {new Date(institution.organized_until).toLocaleDateString('es-AR')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p style={{ color: '#f39c12', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  Pendiente de habilitacion
                </p>
                <p style={{ margin: 0, color: 'var(--text-light)' }}>
                  Para poder crear y organizar torneos, su institucion necesita ser habilitada por el administrador del sistema.
                  Comuniquese con el administrador para solicitar el acceso.
                </p>
              </div>
            )}
          </div>

          <div className="profile-card">
            <h2>Torneos que organiza esta Institucion ({tournaments.length})</h2>
            {tournaments.length === 0 ? (
              <p>Esta institucion todavia no organiza torneos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tournaments.map(t => (
                  <div key={t.id} className="profile-card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>{t.name}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge badge-${t.status}`}>{'{ ' + String(t.status).charAt(0).toUpperCase() + String(t.status).slice(1) + ' }'}</span>
                        <Link className="btn-sm" to={`/dashboard/tournaments/${t.id}`}>Gestionar</Link>
                      </div>
                    </div>
                    <div className="info-grid">
                      <div><strong>Fecha:</strong> {new Date(t.tournament_start).toLocaleDateString('es-AR')}</div>
                      <div><strong>Lugar:</strong> {t.city}{t.province ? `, ${t.province}` : ''}</div>
                      <div><strong>Pecheras:</strong> {t.use_bibs ? 'Numeradas' : 'No usa'}</div>
                      <div><strong>Habilitado:</strong> {t.payment_status === 'paid' ? 'Si' : 'Pendiente'}</div>
                    </div>
                    <h4 style={{ marginBottom: '0.5rem' }}>Pruebas cargadas ({t.event_count})</h4>
                    {(!t.events || t.events.length === 0) ? (
                      <p style={{ color: 'var(--text-light)' }}>Aun no se cargaron pruebas para este torneo.</p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Prueba</th>
                            <th>Sexo</th>
                            <th>Categoria</th>
                            <th>Clasificacion</th>
                            <th>Inscriptos</th>
                            <th>Resultados</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(t.events || []).slice(0, 20).map(e => (
                            <tr key={e.id}>
                              <td>{e.name}</td>
                              <td>{e.sex_name || '-'}</td>
                              <td>{e.category_name || '-'}</td>
                              <td>{(e.classifications_list && e.classifications_list.length ? e.classifications_list.join(', ') : e.classification_code) || '-'}</td>
                              <td>{e.athlete_count}</td>
                              <td>{e.result_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {t.events && t.events.length > 20 && (
                      <p><Link to={`/dashboard/tournaments/${t.id}`}>Ver las {t.event_count} pruebas →</Link></p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-card">
            <h2>Atletas de la Institucion ({athletes.length})</h2>
            {athletes.length === 0 ? (
              <p>No hay atletas registrados en esta institucion.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Sexo</th>
                    <th>Entrenador</th>
                    <th>Clasificacion</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.slice(0, 10).map(a => (
                    <tr key={a.id}>
                      <td>{a.user_name}</td>
                      <td>{a.document_number || '-'}</td>
                      <td>{a.sex_name || '-'}</td>
                      <td>{a.coach_name || '-'}</td>
                      <td>{[a.track_classification_code, a.field_classification_code].filter(Boolean).join(' / ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {athletes.length > 10 && <p><Link to="/dashboard/athletes">Ver todos los {athletes.length} atletas →</Link></p>}
          </div>

          <div className="profile-card">
            <h2>Marcas de Atletas de la Institucion ({filteredResults.length})</h2>
            <div className="form-group" style={{ maxWidth: '350px' }}>
              <label>Filtrar por atleta</label>
              <input
                type="text"
                value={athleteFilter}
                onChange={(e) => setAthleteFilter(e.target.value)}
                placeholder="Buscar atleta..."
              />
            </div>
            {resultsLoading ? (
              <p>Cargando...</p>
            ) : filteredResults.length === 0 ? (
              <p>{athleteFilter ? 'No hay resultados para ese atleta.' : 'Aun no hay resultados registrados para los atletas de esta institucion.'}</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Atleta</th>
                    <th>Torneo</th>
                    <th>Prueba</th>
                    <th>Tipo</th>
                    <th>Posicion</th>
                    <th>Marca</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(fr => (
                    <tr key={fr.id} className={fr.rank <= 3 ? 'top3' : ''}>
                      <td>{fr.scheduled_date ? new Date(fr.scheduled_date).toLocaleDateString() : '-'}</td>
                      <td><strong>{fr.athlete_name}</strong></td>
                      <td>{fr.tournament_name}{fr.tournament_city && <span className="hint"> ({fr.tournament_city})</span>}</td>
                      <td>{fr.tournament_event_name}</td>
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
    </div>
  );
};

export default InstitutionProfile;
