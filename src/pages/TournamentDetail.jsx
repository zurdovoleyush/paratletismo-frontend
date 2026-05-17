import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentApi, competitionApi } from '../api';
import { useAuth } from '../context/AuthContext';

const TournamentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [events, setEvents] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [eventAthletes, setEventAthletes] = useState({});
  const [showEventAthletes, setShowEventAthletes] = useState(null);
  const [selectedEventForReg, setSelectedEventForReg] = useState('');
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = ['admin', 'superadmin'].includes(user?.role);
  const canRegister = ['institution', 'coach', 'athlete'].includes(user?.role);

  const handleStatusChange = async (newStatus) => {
    try {
      await tournamentApi.updateStatus(id, newStatus);
      const res = await tournamentApi.getTournament(id);
      setTournament(res.data);
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const statusTransitions = {
    draft: ['registration_open', 'cancelled'],
    registration_open: ['registration_closed'],
    registration_closed: ['in_progress'],
    in_progress: ['completed'],
  };

  useEffect(() => {
    tournamentApi.getTournament(id)
      .then(res => setTournament(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    tournamentApi.getTournamentEvents(id)
      .then(res => setEvents(res.data.results || res.data))
      .catch(() => {});

    if (canRegister) {
      if (user.role === 'institution') {
        tournamentApi.getMyInstitution()
          .then(res => tournamentApi.getInstitutionAthletes(res.data.id))
          .then(res => setAthletes(res.data.results || res.data))
          .catch(() => {});
      } else if (user.role === 'coach') {
        tournamentApi.getMyAthletes()
          .then(res => setAthletes(res.data.results || res.data))
          .catch(() => {});
      } else {
        tournamentApi.getMyAthletes()
          .then(res => {
            const data = res.data.results || res.data;
            if (data.length > 0) setAthletes(data);
          })
          .catch(() => {});
      }

      competitionApi.getMyRegistrations()
        .then(res => setMyRegistrations(res.data.results || res.data))
        .catch(() => {});
    }
  }, [id, user?.role]);

  const isRegistered = (athleteId) => {
    return myRegistrations.some(r => r.athlete === athleteId && r.tournament === id && ['approved', 'pending'].includes(r.status));
  };

  const handleRegisterTournament = async () => {
    if (!selectedAthleteForReg) return;
    try {
      await competitionApi.createRegistration({ tournament: id, athlete: selectedAthleteForReg });
      alert('Inscripcion al torneo realizada con exito');
      setSelectedAthleteForReg('');
      const res = await competitionApi.getMyRegistrations();
      setMyRegistrations(res.data.results || res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al inscribirse');
      }
    }
  };

  const handleRegisterEvent = async (eventId, athleteId) => {
    if (!eventId || !athleteId) return;
    try {
      await fetch(`/api/competitions/events/${eventId}/register-athlete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ athlete: athleteId, tournament_event: eventId }),
      });
      alert('Atleta inscripto en la prueba');
      loadEventAthletes(eventId);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al inscribir atleta en prueba');
      }
    }
  };

  const loadEventAthletes = async (eventId) => {
    try {
      const res = await competitionApi.getAthleteEvents(eventId);
      setEventAthletes(prev => ({ ...prev, [eventId]: res.data.results || res.data }));
    } catch (err) {}
  };

  if (loading) return <p>Cargando...</p>;
  if (!tournament) return <p>Torneo no encontrado</p>;

  const statusLabels = {
    draft: 'Borrador',
    registration_open: 'Inscripcion Abierta',
    registration_closed: 'Inscripcion Cerrada',
    in_progress: 'En Progreso',
    completed: 'Completado',
  };

  const getAvailableAthletesForEvent = (event) => {
    return athletes.filter(a => {
      if (!isRegistered(a.id)) return false;
      if (event.sex && a.sex !== event.sex) return false;
      if (event.functional_classification && a.functional_classification !== event.functional_classification) return false;
      return true;
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{tournament.name}</h1>
        <div>
          <span className={`badge badge-${tournament.status}`}>{statusLabels[tournament.status]}</span>
          {isAdmin && tournament.admin_user === user?.id && (
            <>
              {statusTransitions[tournament.status] && (
                <select
                  className="btn-secondary"
                  style={{ marginLeft: '0.5rem' }}
                  onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Cambiar estado...</option>
                  {statusTransitions[tournament.status].map(s => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
              )}
              <Link to={`/dashboard/tournaments/${id}/events`} className="btn-secondary" style={{ marginLeft: '0.5rem' }}>Gestionar Pruebas</Link>
              <Link to={`/dashboard/tournaments/${id}/judges`} className="btn-secondary" style={{ marginLeft: '0.5rem' }}>Asignar Jueces</Link>
            </>
          )}
        </div>
      </div>

      <div className="tournament-detail">
        <div className="detail-section">
          <h2>Informacion General</h2>
          <p>{tournament.description}</p>
          <div className="info-grid">
            <div><strong>Lugar:</strong> {tournament.venue}</div>
            <div><strong>Direccion:</strong> {tournament.address}, {tournament.city}</div>
            <div><strong>Inicio:</strong> {new Date(tournament.tournament_start).toLocaleString()}</div>
            <div><strong>Fin:</strong> {new Date(tournament.tournament_end).toLocaleString()}</div>
            <div><strong>Inscripcion abre:</strong> {new Date(tournament.registration_opens).toLocaleString()}</div>
            <div><strong>Inscripcion cierra:</strong> {new Date(tournament.registration_closes).toLocaleString()}</div>
            {tournament.registration_fee > 0 && <div><strong>Costo:</strong> ${tournament.registration_fee}</div>}
          </div>
        </div>

        <div className="detail-section">
          <h2>Disciplinas</h2>
          <div className="tags">
            {tournament.disciplines_list?.map((d, i) => <span key={i} className="tag">{d}</span>)}
          </div>
        </div>

        {canRegister && tournament.status === 'registration_open' && athletes.length > 0 && (
          <div className="detail-section">
            <h2>Inscribir Atleta en el Torneo</h2>
            <div className="register-form">
              <select value={selectedAthleteForReg} onChange={(e) => setSelectedAthleteForReg(e.target.value)}>
                <option value="">Seleccionar atleta</option>
                {athletes.filter(a => !isRegistered(a.id)).map(a => (
                  <option key={a.id} value={a.id}>{a.user_name}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={handleRegisterTournament} disabled={!selectedAthleteForReg}>
                Inscribir en Torneo
              </button>
            </div>
          </div>
        )}

        <div className="detail-section">
          <h2>Pruebas del Torneo</h2>
          {events.length === 0 ? (
            <p>No hay pruebas programadas todavia</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prueba</th>
                  <th>Tipo</th>
                  <th>Sexo</th>
                  <th>Categoria</th>
                  <th>Clasif.</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  {canRegister && <th>Inscribir Atleta</th>}
                  {canRegister && <th>Inscriptos</th>}
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.event_type_name}</td>
                    <td>{e.sex_name}</td>
                    <td>{e.category_name}</td>
                    <td>{e.classification_code || 'Libre'}</td>
                    <td>{e.scheduled_date ? new Date(e.scheduled_date).toLocaleString() : '-'}</td>
                    <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                    {canRegister && (
                      <>
                        <td>
                          {isRegistered(selectedAthleteForReg) && (
                            <select onChange={(ev) => {
                              if (ev.target.value) handleRegisterEvent(e.id, ev.target.value);
                            }} defaultValue="">
                              <option value="">Seleccionar</option>
                              {getAvailableAthletesForEvent(e).map(a => (
                                <option key={a.id} value={a.id}>{a.user_name}</option>
                              ))}
                            </select>
                          )}
                          {!isRegistered(selectedAthleteForReg) && athletes.length > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Inscribi al atleta en el torneo primero</span>
                          )}
                        </td>
                        <td>
                          <button className="btn-sm" onClick={() => {
                            if (showEventAthletes === e.id) {
                              setShowEventAthletes(null);
                            } else {
                              setShowEventAthletes(e.id);
                              loadEventAthletes(e.id);
                            }
                          }}>
                            {showEventAthletes === e.id ? 'Ocultar' : `Ver (${eventAthletes[e.id]?.length || 0})`}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showEventAthletes && eventAthletes[showEventAthletes]?.length > 0 && (
            <div className="form-card" style={{ marginTop: '1rem' }}>
              <h3>Inscriptos</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Institucion</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {eventAthletes[showEventAthletes].map(r => (
                    <tr key={r.id}>
                      <td>{r.athlete_name || 'Atleta'}</td>
                      <td>{r.institution_name || '-'}</td>
                      <td><span className={`badge badge-${r.status || 'pending'}`}>{r.status || 'Pendiente'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;
