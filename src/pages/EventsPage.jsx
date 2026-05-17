import { useState, useEffect } from 'react';
import { competitionApi } from '../api';
import { useAuth } from '../context/AuthContext';

const EventsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    competitionApi.getMyJudgeAssignments()
      .then(res => setAssignments(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="page">
      <h1>{user.role === 'head_judge' ? 'Gestion de Pruebas' : 'Pruebas Asignadas'}</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>Prueba</th>
            <th>Estado</th>
            <th>Es Jefe</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a.id}>
              <td>{a.tournament_event_name}</td>
              <td><span className={`badge badge-scheduled`}>{a.is_head ? 'Juez Principal' : 'Juez'}</span></td>
              <td>{a.is_head ? 'Si' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {assignments.length === 0 && <p>No hay pruebas asignadas</p>}
    </div>
  );
};

export default EventsPage;
