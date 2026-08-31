import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = {
  superadmin: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Usuarios', path: '/dashboard/users', icon: '👥' },
    { label: 'Tipos de Prueba', path: '/dashboard/config/disciplines', icon: '🏅' },
    { label: 'Sexos', path: '/dashboard/config/sexes', icon: '⚧' },
    { label: 'Categorias', path: '/dashboard/config/categories', icon: '📋' },
    { label: 'Clasificaciones', path: '/dashboard/config/classifications', icon: '🔬' },
    { label: 'Disciplinas', path: '/dashboard/config/event-types', icon: '🏃' },
    { label: 'Organizadores', path: '/dashboard/organizers', icon: '🏛' },
    { label: 'Torneos por Habilitar', path: '/dashboard/tournament-payments', icon: '💳' },
  ],
  official: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Clasificaciones Pendientes', path: '/dashboard/classifications', icon: '🔬' },
  ],
  institution: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Mi Institucion', path: '/dashboard/institution', icon: '🏛' },
    { label: 'Atletas', path: '/dashboard/athletes', icon: '🏃' },
    { label: 'Entrenadores', path: '/dashboard/coaches', icon: '🧑‍🏫' },
    { label: 'Mis Torneos', path: '/dashboard/tournaments', icon: '🏆' },
    { label: 'Crear Torneo', path: '/dashboard/tournaments/new', icon: '➕' },
    { label: 'Inscripciones', path: '/dashboard/registrations', icon: '📝' },
    { label: 'Resultados', path: '/dashboard/results', icon: '📊' },
  ],
  coach: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Mi Perfil', path: '/dashboard/coach/profile', icon: '👤' },
    { label: 'Mis Atletas', path: '/dashboard/athletes', icon: '🏃' },
    { label: 'Torneos Activos', path: '/dashboard/tournaments', icon: '🏆' },
    { label: 'Mis Inscripciones', path: '/dashboard/registrations', icon: '📝' },
    { label: 'Resultados', path: '/dashboard/results', icon: '📊' },
  ],
  athlete: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Mi Perfil', path: '/dashboard/profile', icon: '👤' },
    { label: 'Torneos Activos', path: '/dashboard/tournaments', icon: '🏆' },
    { label: 'Mis Inscripciones', path: '/dashboard/registrations', icon: '📝' },
    { label: 'Mis Resultados', path: '/dashboard/results', icon: '📊' },
  ],
  head_judge: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Mis Pruebas', path: '/dashboard/events', icon: '🏃' },
    { label: 'Designar Jueces', path: '/dashboard/judges', icon: '⚖' },
  ],
  judge: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Pruebas Asignadas', path: '/dashboard/events', icon: '🏃' },
    { label: 'Mis Resultados', path: '/dashboard/results', icon: '📊' },
  ],
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let items = menuItems[user?.role] || [];

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>🏅 Paratletismo</h2>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-right">
            <span className="user-info">{user?.first_name} {user?.last_name}</span>
            <span className="user-role-badge">{user?.role_display}</span>
            <button className="logout-btn" onClick={handleLogout}>Salir</button>
          </div>
        </header>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
