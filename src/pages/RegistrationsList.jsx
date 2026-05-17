import { useState, useEffect } from 'react';
import { competitionApi, tournamentApi } from '../api';
import { useAuth } from '../context/AuthContext';

const RegistrationsList = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');

  const fetchRegistrations = (tournamentId) => {
    const params = tournamentId ? { tournament: tournamentId } : {};
    competitionApi.getRegistrations(params)
      .then(res => setRegistrations(res.data.results || res.data))
      .catch(() => {});
  };

  useEffect(() => {
    if (['institution', 'coach', 'athlete'].includes(user.role)) {
      competitionApi.getMyRegistrations()
        .then(res => setRegistrations(res.data.results || res.data))
        .catch(() => {});
    } else if (['admin', 'superadmin'].includes(user.role)) {
      tournamentApi.getTournaments()
        .then(res => setTournaments(res.data.results || res.data))
        .catch(() => {});
      fetchRegistrations();
    }
  }, [user.role]);

  const handleTournamentChange = (e) => {
    setSelectedTournament(e.target.value);
    fetchRegistrations(e.target.value);
  };

  const handleApprove = async (id) => {
    try {
      await competitionApi.approveRegistration(id);
      fetchRegistrations(selectedTournament);
    } catch (err) {
      alert('Error al aprobar');
    }
  };

  const handleReject = async (id) => {
    try {
      await competitionApi.rejectRegistration(id);
      fetchRegistrations(selectedTournament);
    } catch (err) {
      alert('Error al rechazar');
    }
  };

  const statusLabels = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    withdrawn: 'Retirada',
  };

  const isAdminOrSuperAdmin = ['admin', 'superadmin'].includes(user.role);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inscripciones</h1>
        {isAdminOrSuperAdmin && (
          <select value={selectedTournament} onChange={handleTournamentChange}>
            <option value="">Todos los torneos</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Torneo</th>
            <th>Atleta</th>
            <th>Institucion</th>
            <th>Estado</th>
            <th>Pago</th>
            <th>Fecha</th>
            {isAdminOrSuperAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {registrations.map(r => (
            <tr key={r.id}>
              <td>{r.tournament_name}</td>
              <td>{r.athlete_name}</td>
              <td>{r.institution_name}</td>
              <td><span className={`badge badge-${r.status}`}>{statusLabels[r.status]}</span></td>
              <td><span className={`badge badge-${r.payment_status}`}>{r.payment_status}</span></td>
              <td>{new Date(r.registered_at).toLocaleDateString()}</td>
              {isAdminOrSuperAdmin && (
                <td>
                  {r.status === 'pending' && (
                    <>
                      <button className="btn-sm btn-success" onClick={() => handleApprove(r.id)}>Aprobar</button>
                      <button className="btn-sm btn-danger" onClick={() => handleReject(r.id)}>Rechazar</button>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {registrations.length === 0 && <p>No hay inscripciones</p>}
    </div>
  );
};

export default RegistrationsList;
