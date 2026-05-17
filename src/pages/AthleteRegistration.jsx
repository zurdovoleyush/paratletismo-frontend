import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentApi, competitionApi } from '../api';

const AthleteRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentApi.getAthletes()
      .then(res => {
        const found = (res.data.results || res.data).find(a => a.id === id);
        if (found) setAthlete(found);
      })
      .catch(() => {});

    competitionApi.getAthleteRegistrationOptions(id)
      .then(res => setOptions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegisterTournament = async (tournamentId) => {
    try {
      await competitionApi.createRegistration({ tournament: tournamentId, athlete: id });
      const res = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al inscribir en torneo');
      }
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await fetch(`/api/competitions/events/${eventId}/register-athlete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ athlete: id, tournament_event: eventId }),
      });
      const res = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al inscribir en prueba');
      }
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!athlete || !options) return <p>Atleta no encontrado</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inscribir: {athlete.user_name}</h1>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Volver</button>
      </div>

      <div className="profile-card">
        <h2>Datos del Atleta</h2>
        <div className="info-grid">
          <div><strong>Sexo:</strong> {athlete.sex_name || 'No definido'}</div>
          <div><strong>Categoria:</strong> {athlete.age ? `${athlete.age} anos` : '-'}</div>
          <div><strong>Clasificacion:</strong> {athlete.classification_code || 'Sin clasificacion'}</div>
          <div><strong>Documento:</strong> {athlete.document_number || '-'}</div>
        </div>
      </div>

      {options.tournaments.length === 0 ? (
        <p>No hay torneos activos en este momento</p>
      ) : (
        options.tournaments.map(t => (
          <div key={t.tournament.id} className="detail-section" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3>{t.tournament.name}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>{t.tournament.city}</p>
              </div>
              <span className={`badge badge-${t.is_registered_in_tournament ? 'approved' : 'pending'}`}>
                {t.is_registered_in_tournament ? 'Inscrito en Torneo' : 'No Inscrito'}
              </span>
            </div>

            {!t.is_registered_in_tournament && (
              <button className="btn-primary" onClick={() => handleRegisterTournament(t.tournament.id)} style={{ marginBottom: '1rem' }}>
                Inscribir en Torneo
              </button>
            )}

            {t.is_registered_in_tournament && (
              <>
                <h4>Pruebas disponibles para este atleta</h4>
                {t.eligible_events.length === 0 ? (
                  <p>No hay pruebas que cumplan los requisitos del atleta</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Prueba</th>
                        <th>Sexo</th>
                        <th>Categoria</th>
                        <th>Clasif.</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.eligible_events.map(e => (
                        <tr key={e.id}>
                          <td><strong>{e.name}</strong></td>
                          <td>{e.sex_name}</td>
                          <td>{e.category_name}</td>
                          <td>{e.classification_code || 'Libre'}</td>
                          <td>{e.scheduled_date ? new Date(e.scheduled_date).toLocaleString() : '-'}</td>
                          <td>
                            {e.is_registered ? (
                              <span className="badge badge-approved">Inscrito</span>
                            ) : (
                              <span className="badge badge-pending">Disponible</span>
                            )}
                          </td>
                          <td>
                            {!e.is_registered && (
                              <button className="btn-sm btn-success" onClick={() => handleRegisterEvent(e.id)}>
                                Inscribir
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AthleteRegistration;
