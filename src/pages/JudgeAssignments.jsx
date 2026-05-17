import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
    } catch (err) {
      alert('Error al asignar juez');
    }
  };

  const handleRemove = async (assignmentId) => {
    try {
      await fetch(`/api/competitions/judges/${assignmentId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
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
        <h1>Asignar Jueces - {tournament.name}</h1>
      </div>

      <div className="form-card">
        <h3>Nueva Asignacion</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Prueba</label>
            <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="">Seleccionar prueba</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.sex_name} - {e.category_name})</option>
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
          <h3>Jueces Asignados</h3>
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
