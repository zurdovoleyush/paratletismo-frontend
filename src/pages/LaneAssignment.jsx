import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { competitionApi, tournamentApi } from '../api';

const LaneAssignment = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [athleteEvents, setAthleteEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentApi.getTournamentEvent(id)
      .then(res => setEvent(res.data))
      .catch(() => {});
    loadAthleteEvents();
  }, [id]);

  const loadAthleteEvents = async () => {
    try {
      const res = await competitionApi.getLaneAssignments(id);
      setAthleteEvents(res.data.athlete_events || []);
    } catch (err) {
      alert('Error al cargar atletas');
    } finally {
      setLoading(false);
    }
  };

  const handleLaneChange = (athleteEventId, lane) => {
    setAthleteEvents(prev =>
      prev.map(ae => ae.id === athleteEventId ? { ...ae, lane: parseInt(lane) || null } : ae)
    );
  };

  const handleAutoAssign = () => {
    const withLane = athleteEvents
      .filter(ae => ae.status !== 'withdrawn')
      .map((ae, i) => ({ ...ae, lane: i + 1 }));
    setAthleteEvents(withLane);
  };

  const handleSave = async () => {
    const lanes = athleteEvents
      .filter(ae => ae.lane != null)
      .map(ae => ({ athlete_event_id: ae.id, lane: ae.lane }));
    if (lanes.length === 0) {
      alert('Asigna al menos un carril');
      return;
    }
    try {
      await competitionApi.assignLanes(id, { lanes });
      alert('Carriles guardados correctamente');
      loadAthleteEvents();
    } catch (err) {
      alert('Error al guardar carriles');
    }
  };

  const sortedByLane = [...athleteEvents].sort((a, b) => (a.lane || 999) - (b.lane || 999));

  if (loading) return <p>Cargando...</p>;
  if (!event) return <p>Prueba no encontrada</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Asignacion de Carriles</h1>
      </div>

      <div className="form-card">
        <h3>{event.name}</h3>
        <p>{event.event_type_name} | {event.sex_name} | {event.category_name} | {event.classifications_list?.join(', ') || event.classification_code || 'Libre'}</p>
      </div>

      <div className="form-card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button className="btn-primary" onClick={handleAutoAssign}>
            Auto-Asignar Carriles
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Guardar Carriles
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Carril</th>
              <th>Atleta</th>
              <th>Institucion</th>
              <th>Clasif.</th>
              <th>Dorsal</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {sortedByLane.map(ae => (
              <tr key={ae.id} className={ae.status === 'withdrawn' ? 'row-withdrawn' : ''}>
                <td>
                  <input
                    type="number" min="0" max="20" size="3"
                    value={ae.lane || ''}
                    onChange={(e) => handleLaneChange(ae.id, e.target.value)}
                    style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em' }}
                    disabled={ae.status === 'withdrawn'}
                  />
                </td>
                <td>{ae.athlete_name}</td>
                <td>{ae.institution_name || '-'}</td>
                <td>{ae.classification_code || '-'}</td>
                <td>{ae.bib_number || '-'}</td>
                <td>
                  <span className={`badge badge-${ae.status || 'pending'}`}>
                    {ae.status === 'withdrawn' ? 'Retirado' : ae.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {athleteEvents.length === 0 && <p>No hay atletas inscriptos en esta prueba</p>}
      </div>
    </div>
  );
};

export default LaneAssignment;
