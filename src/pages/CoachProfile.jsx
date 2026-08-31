import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentApi, competitionApi } from '../api';
import { useAuth } from '../context/AuthContext';

const CoachProfile = () => {
  const { user } = useAuth();
  const [coach, setCoach] = useState(null);
  const [myAthletes, setMyAthletes] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [loading, setLoading] = useState(true);
  const [resultsHistory, setResultsHistory] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [athleteFilter, setAthleteFilter] = useState('');

  useEffect(() => {
    tournamentApi.getAvailableInstitutions()
      .then(res => setInstitutions(res.data.results || res.data))
      .catch(() => {});

    tournamentApi.getMyInstitution()
      .then(res => {
        setCoach(res.data);
        if (res.data?.institution) {
          setSelectedInstitution(res.data.institution);
        }
      })
      .catch(() => {});

    tournamentApi.getMyAthletes()
      .then(res => setMyAthletes(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    setResultsLoading(true);
    competitionApi.getMyResults()
      .then(res => setResultsHistory(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setResultsLoading(false));
  }, []);

  const handleSelectInstitution = async () => {
    if (!selectedInstitution) {
      alert('Debes seleccionar una institucion');
      return;
    }
    try {
      await tournamentApi.setCoachInstitution({ institution: selectedInstitution });
      const res = await tournamentApi.getMyInstitution();
      setCoach(res.data);
      alert('Institucion asignada correctamente');
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al asignar institucion');
      }
    }
  };

  if (loading) return <p>Cargando...</p>;

  const hasInstitution = coach?.institution;

  const filteredResults = resultsHistory.filter(fr =>
    !athleteFilter || (fr.athlete_name || '').toLowerCase().includes(athleteFilter.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Perfil del Entrenador</h1>
      </div>

      <div className="profile-card">
        <h2>{user?.first_name} {user?.last_name}</h2>
        <div className="info-grid">
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Telefono:</strong> {user?.phone || '-'}</div>
          <div><strong>Institucion actual:</strong> {hasInstitution ? coach.institution_name : 'Sin asignar'}</div>
        </div>
      </div>

      {!hasInstitution ? (
        <div className="detail-section" style={{ marginTop: '2rem' }}>
          <h3>Seleccionar Institucion</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Para poder crear atletas debes estar asignado a una institucion. Selecciona una de la lista:
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Seleccionar institucion</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={handleSelectInstitution} disabled={!selectedInstitution}>
              Asignar
            </button>
          </div>
          {institutions.length === 0 && (
            <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
              No hay instituciones registradas en el sistema. Contacta al administrador.
            </p>
          )}
        </div>
      ) : (
        <div className="detail-section" style={{ marginTop: '2rem' }}>
          <h3>Cambiar Institucion</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              style={{ flex: 1 }}
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={handleSelectInstitution}>
              Cambiar
            </button>
          </div>
        </div>
      )}

      <div className="profile-card" style={{ marginTop: '2rem' }}>
        <h2>Mis Atletas ({myAthletes.length})</h2>
        {myAthletes.length === 0 ? (
          <p>No tienes atletas asignados. Crea atletas desde <Link to="/dashboard/athletes">Atletas</Link>.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Sexo</th>
                <th>Clasificacion</th>
              </tr>
            </thead>
            <tbody>
              {myAthletes.map(a => (
                <tr key={a.id}>
                  <td>{a.user_name}</td>
                  <td>{a.document_number || '-'}</td>
                  <td>{a.sex_name || '-'}</td>
                  <td>{[a.track_classification_code, a.field_classification_code].filter(Boolean).join(' / ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link to="/dashboard/athletes" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Gestionar Atletas</Link>
      </div>

      <div className="profile-card" style={{ marginTop: '2rem' }}>
        <h2>Marcas de Mis Atletas ({filteredResults.length})</h2>
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
          <p>{athleteFilter ? 'No hay resultados para ese atleta.' : 'Aun no hay resultados registrados para tus atletas.'}</p>
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
    </div>
  );
};

export default CoachProfile;
