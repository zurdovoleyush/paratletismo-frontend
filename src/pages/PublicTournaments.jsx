import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentApi } from '../api';

const PublicTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentApi.getTournaments()
      .then(res => setTournaments(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusLabels = {
    draft: 'Borrador',
    registration_open: 'Inscripcion Abierta',
    registration_closed: 'Inscripcion Cerrada',
    in_progress: 'En Progreso',
    completed: 'Completado',
  };

  return (
    <div className="public-page">
      <header className="public-header">
        <h1>🏅 Paratletismo - Torneos</h1>
        <nav>
          <Link to="/login">Iniciar Sesion</Link>
        </nav>
      </header>
      <main className="public-content">
        <h2>Torneos de Paratletismo</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : tournaments.length === 0 ? (
          <p>No hay torneos disponibles en este momento</p>
        ) : (
          <div className="tournament-grid">
            {tournaments.map(t => (
              <div key={t.id} className="tournament-card">
                <h3>{t.name}</h3>
                <p>{t.city}, {t.province}</p>
                <p>{new Date(t.tournament_start).toLocaleDateString()} - {new Date(t.tournament_end).toLocaleDateString()}</p>
                <span className={`badge badge-${t.status}`}>{statusLabels[t.status]}</span>
                <Link to={`/tournaments/${t.id}`} className="btn-secondary">Ver Detalles</Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicTournaments;
