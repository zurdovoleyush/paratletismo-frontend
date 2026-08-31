import { useState, useEffect } from 'react';
import { competitionApi, tournamentApi } from '../api';
import { useAuth } from '../context/AuthContext';

const RegistrationsList = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [uploading, setUploading] = useState({}); // { regId: { field: File } }

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
    const reason = window.prompt('Motivo del rechazo (se informara al atleta/institucion):');
    if (reason === null) return;
    try {
      await competitionApi.rejectRegistration(id, { reason });
      fetchRegistrations(selectedTournament);
    } catch (err) {
      alert('Error al rechazar');
    }
  };

  const handleUploadDoc = async (regId, field) => {
    const file = uploading[regId]?.[field];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append(field, file);
      await competitionApi.updateRegistration(regId, formData);
      setUploading(prev => ({ ...prev, [regId]: { ...(prev[regId] || {}), [field]: null } }));
      fetchRegistrations(selectedTournament);
    } catch (err) {
      alert('Error al subir archivo: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleRegDocChange = (regId, field, file) => {
    setUploading(prev => ({
      ...prev,
      [regId]: { ...(prev[regId] || {}), [field]: file },
    }));
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
            <th>Cert. Medico</th>
            <th>Comprobante Pago</th>
            <th>Fecha</th>
            <th>Motivo Rechazo</th>
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
              <td><span className={`badge badge-${r.payment_status}`}>{r.payment_status === 'paid' ? 'Pagado' : r.payment_status === 'exempt' ? 'Exento' : 'Pendiente'}</span></td>
              <td style={{ fontSize: '0.85rem' }}>
                {r.medical_certificate ? (
                  <a href={r.medical_certificate} target="_blank" rel="noopener noreferrer">Ver</a>
                ) : (
                  <span style={{ color: '#999' }}>Pendiente</span>
                )}
                {!r.medical_certificate && !isAdminOrSuperAdmin && (
                  <div style={{ marginTop: '4px' }}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ fontSize: '0.75rem', width: '100px' }} onChange={e => handleRegDocChange(r.id, 'medical_certificate', e.target.files[0])} />
                    {uploading[r.id]?.medical_certificate && <button className="btn-sm btn-primary" onClick={() => handleUploadDoc(r.id, 'medical_certificate')} style={{ fontSize: '0.7rem', marginTop: '2px' }}>Subir</button>}
                  </div>
                )}
              </td>
              <td style={{ fontSize: '0.85rem' }}>
                {r.payment_receipt ? (
                  <a href={r.payment_receipt} target="_blank" rel="noopener noreferrer">Ver</a>
                ) : (
                  <span style={{ color: '#999' }}>Pendiente</span>
                )}
                {!r.payment_receipt && !isAdminOrSuperAdmin && (
                  <div style={{ marginTop: '4px' }}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ fontSize: '0.75rem', width: '100px' }} onChange={e => handleRegDocChange(r.id, 'payment_receipt', e.target.files[0])} />
                    {uploading[r.id]?.payment_receipt && <button className="btn-sm btn-primary" onClick={() => handleUploadDoc(r.id, 'payment_receipt')} style={{ fontSize: '0.7rem', marginTop: '2px' }}>Subir</button>}
                  </div>
                )}
              </td>
              <td>{new Date(r.registered_at).toLocaleDateString()}</td>
              <td style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
                {r.status === 'rejected' && r.rejection_reason ? r.rejection_reason : '-'}
              </td>
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
