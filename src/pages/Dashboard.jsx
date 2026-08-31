import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentApi, competitionApi } from '../api';

const Dashboard = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    tournamentApi.getTournaments({ status: 'registration_open' })
      .then(res => setTournaments(res.data.results || res.data))
      .catch(() => {});

    if (['institution', 'coach', 'athlete'].includes(user.role)) {
      competitionApi.getMyRegistrations()
        .then(res => setRegistrations(res.data.results || res.data))
        .catch(() => {});
    }
  }, [user.role]);

  const role = user.role;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{getGreeting()}, {user.first_name}!</h1>
        <p className="user-role">Rol: {user.role_display}</p>
      </div>

      {['institution', 'coach', 'athlete'].includes(role) && <RejectionAlerts registrations={registrations} />}

      {role === 'superadmin' && <SuperAdminDashboard />}
      {role === 'official' && <OfficialDashboard />}
      {role === 'admin' && <TournamentAdminDashboard />}
      {role === 'institution' && <InstitutionDashboard tournaments={tournaments} registrations={registrations} />}
      {role === 'coach' && <CoachDashboard tournaments={tournaments} registrations={registrations} />}
      {role === 'athlete' && <AthleteDashboard tournaments={tournaments} registrations={registrations} />}
      {role === 'head_judge' && <HeadJudgeDashboard />}
      {role === 'judge' && <JudgeDashboard />}
    </div>
  );
};

const RejectionAlerts = ({ registrations }) => {
  const rejected = registrations.filter(r => r.status === 'rejected');
  if (rejected.length === 0) return null;
  return (
    <div className="rejection-banner" style={{ marginBottom: '1.5rem' }}>
      <strong>Inscripciones rechazadas</strong>
      {rejected.map(r => (
        <p key={r.id}>
          Tu inscripcion en <strong>{r.tournament_name}</strong> ({r.athlete_name}) fue rechazada.
          {r.rejection_reason && <> Motivo: <em>{r.rejection_reason}</em>.</>}
          <Link to="/dashboard/registrations" style={{ display: 'inline-block', marginLeft: '0.5rem', fontSize: '0.85rem' }}>Ver inscripciones</Link>
        </p>
      ))}
      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
        Podes corregir o cargar la documentacion faltante para reenviar tu inscripcion.
      </p>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, tournaments: 0, institutions: 0, athletes: 0 });

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Configuracion del Sistema</h3>
        <p>Gestiona disciplinas, categorias, sexos y clasificaciones</p>
      </div>
      <div className="stat-card">
        <h3>Gestion de Usuarios</h3>
        <p>Administra usuarios, roles y permisos</p>
      </div>
    </div>
  );
};

const OfficialDashboard = () => (
  <div className="stats-grid">
    <div className="stat-card">
      <h3>Clasificaciones Pendientes</h3>
      <p>Valida las clasificaciones funcionales provisionales</p>
    </div>
  </div>
);

const TournamentAdminDashboard = () => (
  <div className="stats-grid">
    <div className="stat-card">
      <h3>Gestion de Torneos</h3>
      <p>Crea y gestiona tus torneos de paratletismo</p>
    </div>
    <div className="stat-card">
      <h3>Inscripciones</h3>
      <p>Revisa y aprueba inscripciones</p>
    </div>
  </div>
);

const InstitutionDashboard = ({ tournaments, registrations }) => {
  const { user } = useAuth();
  const [pendingRegs, setPendingRegs] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const loadPending = () => {
    setLoadingPending(true);
    tournamentApi.getTournaments({ admin_user: user.id })
      .then(async res => {
        const myTournaments = res.data.results || res.data;
        const pendings = [];
        for (const t of myTournaments) {
          try {
            const r = await competitionApi.getRegistrations({ tournament: t.id, status: 'pending' });
            const regs = r.data.results || r.data;
            pendings.push(...regs.map(x => ({ ...x, tournament_name: t.name, tournament_id: t.id })));
          } catch (e) {}
        }
        pendings.sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
        setPendingRegs(pendings);
      })
      .catch(() => {})
      .finally(() => setLoadingPending(false));
  };

  useEffect(() => {
    loadPending();
  }, [user.id]);

  const handleApprove = async (regId) => {
    try {
      await competitionApi.approveRegistration(regId);
      loadPending();
    } catch (err) {
      alert('Error al aprobar');
    }
  };

  const handleReject = async (regId) => {
    const reason = window.prompt('Motivo del rechazo (se informara al atleta/institucion):');
    if (reason === null) return;
    try {
      await competitionApi.rejectRegistration(regId, { reason });
      loadPending();
    } catch (err) {
      alert('Error al rechazar');
    }
  };

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Torneos Activos</h3>
          <p className="stat-number">{tournaments.length}</p>
        </div>
        <div className="stat-card">
          <h3>Inscripciones Activas</h3>
          <p className="stat-number">{registrations.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pendientes de Aprobacion</h3>
          <p className="stat-number">{pendingRegs.length}</p>
        </div>
      </div>

      <div className="recent-section">
        <h2>Inscripciones Pendientes de Aprobacion</h2>
        {loadingPending ? (
          <p>Cargando...</p>
        ) : pendingRegs.length === 0 ? (
          <p>No hay inscripciones pendientes</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Atleta</th>
                <th>Institucion</th>
                <th>Pago</th>
                <th>Cert. Medico</th>
                <th>Comprobante</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendingRegs.map(r => (
                <tr key={r.id}>
                  <td>
                    {r.tournament_name}
                    <br />
                    <Link to={`/dashboard/tournaments/${r.tournament_id}`} style={{ fontSize: '0.8rem' }}>Administrar</Link>
                  </td>
                  <td>{r.athlete_name}</td>
                  <td>{r.institution_name || '-'}</td>
                  <td><span className={`badge badge-${r.payment_status}`}>{r.payment_status === 'paid' ? 'Pagado' : r.payment_status === 'exempt' ? 'Exento' : 'Pendiente'}</span></td>
                  <td>
                    {r.medical_certificate ? (
                      <a href={r.medical_certificate} target="_blank" rel="noopener noreferrer">Ver</a>
                    ) : (
                      <span style={{ color: '#999' }}>Pendiente</span>
                    )}
                  </td>
                  <td>
                    {r.payment_receipt ? (
                      <a href={r.payment_receipt} target="_blank" rel="noopener noreferrer">Ver</a>
                    ) : (
                      <span style={{ color: '#999' }}>Pendiente</span>
                    )}
                  </td>
                  <td>{new Date(r.registered_at).toLocaleString()}</td>
                  <td>
                    <button className="btn-sm btn-success" onClick={() => handleApprove(r.id)}>Aprobar</button>
                    <button className="btn-sm btn-danger" onClick={() => handleReject(r.id)} style={{ marginLeft: '0.5rem' }}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="recent-section">
        <h2>Inscripciones Recientes</h2>
        {registrations.length === 0 ? (
          <p>No hay inscripciones todavia</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Atleta</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {registrations.slice(0, 5).map(r => (
                <tr key={r.id}>
                  <td>{r.tournament_name}</td>
                  <td>{r.athlete_name}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td>{new Date(r.registered_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

const CoachDashboard = ({ tournaments, registrations }) => (
  <>
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Torneos Disponibles</h3>
        <p className="stat-number">{tournaments.length}</p>
      </div>
      <div className="stat-card">
        <h3>Inscripciones</h3>
        <p className="stat-number">{registrations.length}</p>
      </div>
    </div>
  </>
);

const AthleteDashboard = ({ tournaments, registrations }) => (
  <>
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Torneos Disponibles</h3>
        <p className="stat-number">{tournaments.length}</p>
      </div>
      <div className="stat-card">
        <h3>Mis Inscripciones</h3>
        <p className="stat-number">{registrations.length}</p>
      </div>
    </div>
  </>
);

const HeadJudgeDashboard = () => (
  <div className="stats-grid">
    <div className="stat-card">
      <h3>Designar Jueces</h3>
      <p>Asigna jueces a las pruebas del torneo</p>
    </div>
  </div>
);

const JudgeDashboard = () => (
  <div className="stats-grid">
    <div className="stat-card">
      <h3>Pruebas Asignadas</h3>
      <p>Visualiza y registra resultados de tus pruebas</p>
    </div>
  </div>
);

export default Dashboard;
