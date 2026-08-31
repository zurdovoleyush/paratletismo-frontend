import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { competitionApi, usersApi, tournamentApi } from '../api';

const JudgeAssignments = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [events, setEvents] = useState([]);
  const [judges, setJudges] = useState([]);
  const [headJudges, setHeadJudges] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedJudge, setSelectedJudge] = useState('');
  const [isHead, setIsHead] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    tournamentApi.getTournament(id)
      .then(res => setTournament(res.data))
      .catch(() => {});

    tournamentApi.getTournamentEvents(id)
      .then(res => setEvents(res.data.results || res.data))
      .catch(() => {});

    usersApi.getUsers({ role: 'judge' })
      .then(res => setJudges(res.data.results || res.data))
      .catch(() => {});

    usersApi.getUsers({ role: 'head_judge' })
      .then(res => setHeadJudges(res.data.results || res.data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (selectedEvent) {
      competitionApi.getJudgeAssignments(selectedEvent)
        .then(res => setAssignments(res.data.results || res.data))
        .catch(() => {});
    }
  }, [selectedEvent]);

  const handleUpdateField = async (field, value) => {
    try {
      await tournamentApi.updateTournament(id, { ...tournament, [field]: value });
      const res = await tournamentApi.getTournament(id);
      setTournament(res.data);
      setUpdateMsg('Juez principal del torneo actualizado');
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  const handleAssign = async () => {
    if (!selectedEvent || !selectedJudge) return;
    try {
      await competitionApi.createJudgeAssignment(selectedEvent, {
        tournament_event: selectedEvent,
        judge: selectedJudge,
        is_head: isHead,
      });
      setSelectedJudge('');
      setIsHead(false);
      const res = await competitionApi.getJudgeAssignments(selectedEvent);
      setAssignments(res.data.results || res.data);
      setUpdateMsg('Juez asignado a la prueba');
    } catch (err) {
      alert('Error al asignar juez');
    }
  };

  const handleRemove = async (assignmentId) => {
    try {
      await competitionApi.deleteJudgeAssignment(assignmentId);
      const res = await competitionApi.getJudgeAssignments(selectedEvent);
      setAssignments(res.data.results || res.data);
    } catch (err) {
      alert('Error al remover');
    }
  };

  if (!tournament) return <p>Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Asignar Jueces - {tournament.name}</h1>
          {updateMsg && <p style={{ color: 'var(--success)', margin: 0 }}>{updateMsg}</p>}
        </div>
        <Link to={`/dashboard/tournaments/${id}`} className="btn-secondary">Volver al Torneo</Link>
      </div>

      <div className="form-card">
        <h3>Juez Principal del Torneo</h3>
        <div className="form-group">
          <select value={tournament.head_judge || ''}
            onChange={(e) => handleUpdateField('head_judge', e.target.value || null)}>
            <option value="">Sin asignar</option>
            {[...headJudges, ...judges].map(j => (
              <option key={j.id} value={j.id}>{j.first_name} {j.last_name} ({j.role_display})</option>
            ))}
          </select>
        </div>
        {tournament.head_judge && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
            Juez Principal actual: {[...headJudges, ...judges].find(j => j.id === tournament.head_judge)?.first_name}{' '}
            {[...headJudges, ...judges].find(j => j.id === tournament.head_judge)?.last_name}
          </p>
        )}
      </div>

      <div className="form-card">
        <h3>Asignar Juez a Prueba</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Prueba</label>
            <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="">Seleccionar prueba</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.sex_name || 'Multiple'} - {e.category_name || 'Multiple'})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Juez</label>
            <select value={selectedJudge} onChange={(e) => setSelectedJudge(e.target.value)}>
              <option value="">Seleccionar juez</option>
              {[...headJudges, ...judges].map(j => (
                <option key={j.id} value={j.id}>{j.first_name} {j.last_name} ({j.role_display})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={isHead} onChange={(e) => setIsHead(e.target.checked)} />
            Es Juez Principal de esta prueba
          </label>
        </div>
        <button className="btn-primary" onClick={handleAssign} disabled={!selectedEvent || !selectedJudge}>
          Asignar Juez
        </button>
      </div>

      {selectedEvent && (
        <div className="form-card">
          <h3>Jueces Asignados a: {events.find(e => e.id === selectedEvent)?.name}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Juez</th>
                <th>Rol</th>
                <th>Es Principal</th>
                <th>Asignado</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td>{a.judge_name}</td>
                  <td>{a.is_head ? 'Juez Principal' : 'Juez'}</td>
                  <td>{a.is_head ? 'Si' : 'No'}</td>
                  <td>{new Date(a.assigned_at).toLocaleString()}</td>
                  <td><button className="btn-sm btn-danger" onClick={() => handleRemove(a.id)}>Remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignments.length === 0 && <p>No hay jueces asignados a esta prueba</p>}
        </div>
      )}
    </div>
  );
};

export default JudgeAssignments;
