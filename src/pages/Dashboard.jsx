import { useState, useEffect } from 'react';
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

const InstitutionDashboard = ({ tournaments, registrations }) => (
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
