import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentApi } from '../api';
import { useAuth } from '../context/AuthContext';

const TournamentsList = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const isAdmin = ['admin', 'superadmin'].includes(user?.role);
  const isSuper = user?.role === 'superadmin';

  const loadTournaments = () => {
    const params = filter ? { status: filter } : {};
    if (user?.role === 'institution') {
      params.admin_user = user.id;
    }
    return tournamentApi.getTournaments(params)
      .then(res => setTournaments(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTournaments();
  }, [filter, user?.role, user?.id]);

  const handleStatusChange = async (id, newStatus) => {
    if (!newStatus) return;
    try {
      await tournamentApi.updateStatus(id, newStatus);
      await loadTournaments();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const handleEdit = (t) => {
    setEditingTournament(t);
    setEditFormData({
      name: t.name,
      description: t.description,
      venue: t.venue,
      address: t.address,
      city: t.city,
      province: t.province,
      country: t.country,
      tournament_start: t.tournament_start?.split('T')[0] || '',
      tournament_end: t.tournament_end?.split('T')[0] || '',
      registration_opens: t.registration_opens?.split('T')[0] || '',
      registration_closes: t.registration_closes?.split('T')[0] || '',
      registration_fee: t.registration_fee || 0,
      max_participants: t.max_participants || '',
      is_public: t.is_public,
    });
    setShowEditForm(true);
  };

  const handleEditChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditFormData({ ...editFormData, [e.target.name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await tournamentApi.updateTournament(editingTournament.id, editFormData);
      setShowEditForm(false);
      setEditingTournament(null);
      setEditFormData({});
      await loadTournaments();
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al actualizar torneo');
      }
    }
  };

  const handleDelete = async (t) => {
    if (!confirm('Estas seguro de eliminar este torneo? Esta accion no se puede deshacer.')) return;
    if (t.has_marks) {
      if (!confirm('ATENCION: este torneo tiene marcas y resultados cargados. Se eliminara TODO (marcas, resultados, inscripciones y pruebas) de forma definitiva. ¿Confirma la eliminacion?')) return;
    } else if (!confirm('Ultima confirmacion: se eliminara el torneo y todos sus datos asociados. ¿Confirma?')) return;
    try {
      await tournamentApi.deleteTournament(t.id);
      await loadTournaments();
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al eliminar torneo');
      }
    }
  };

  const handleToggleActive = async (t) => {
    try {
      await tournamentApi.updateTournament(t.id, { is_active: !t.is_active });
      await loadTournaments();
    } catch (err) {
      alert('Error al cambiar el estado de actividad del torneo');
    }
  };

  const statusLabels = {
    draft: 'Borrador',
    registration_open: 'Inscripcion Abierta',
    registration_closed: 'Inscripcion Cerrada',
    in_progress: 'En Progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Torneos</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="registration_open">Inscripcion Abierta</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completados</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : tournaments.length === 0 ? (
        <p>No hay torneos disponibles</p>
      ) : (
        <div className="tournament-grid">
          {tournaments.map(t => (
            <div key={t.id} className="tournament-card">
              <h3>{t.name}</h3>
              <p className="tournament-location">{t.city}, {t.province}</p>
              <div className="tournament-info">
                <p><strong>Inicio:</strong> {new Date(t.tournament_start).toLocaleDateString()}</p>
                <p><strong>Fin:</strong> {new Date(t.tournament_end).toLocaleDateString()}</p>
                <p><strong>Organizador:</strong> {t.organizer_name}</p>
              </div>
              <div className="tournament-status">
                <span className={`badge badge-${t.status}`}>{statusLabels[t.status]}</span>
                {t.payment_status === 'pending' && (
                  <span className="badge badge-pending">Pendiente de Pago</span>
                )}
                {t.is_active === false && (
                  <span className="badge badge-inactive">Inactivo</span>
                )}
                {(t.admin_user === user?.id || user?.role === 'superadmin') && (
                  <select
                    className="status-select"
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    title="Cambiar estado del torneo (podes corregirlo cuando quieras)"
                  >
                    {Object.keys(statusLabels).map(s => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="tournament-actions">
                {t.admin_user === user?.id || user?.role === 'superadmin' ? (
                  <>
                    <Link to={`/dashboard/tournaments/${t.id}`} className="tournament-btn btn-primary">Administrar</Link>
                    <Link to={`/dashboard/tournaments/${t.id}/events`} className="tournament-btn btn-secondary">Pruebas</Link>
                    <Link to={`/tournaments/${t.id}`} className="tournament-btn btn-secondary">Pagina</Link>
                    <button className="tournament-btn btn-secondary" onClick={() => handleEdit(t)}>Editar</button>
                    {t.has_marks && !isSuper ? (
                      <>
                        <button className="tournament-btn btn-secondary" onClick={() => handleToggleActive(t)}>
                          {t.is_active ? 'Marcar Inactivo' : 'Reactivar'}
                        </button>
                        <span className="has-marks-hint" title="Este torneo tiene marcas cargadas y no puede eliminarse, las marcas de los atletas se conservan.">
                          Marcas cargadas
                        </span>
                      </>
                    ) : (
                      <>
                        {t.has_marks && (
                          <span className="has-marks-hint" title="Solo el superadministrador puede eliminar torneos con marcas.">
                            Marcas cargadas
                          </span>
                        )}
                        <button className="tournament-btn btn-danger" onClick={() => handleDelete(t)}>Eliminar</button>
                      </>
                    )}
                  </>
                ) : isAdmin ? (
                  <Link to={`/dashboard/tournaments/${t.id}`} className="tournament-btn btn-primary">Administrar</Link>
                ) : (
                  <Link to={`/tournaments/${t.id}`} className="tournament-btn btn-primary">Inscribirse</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditForm && editingTournament && (
        <form onSubmit={handleEditSubmit} className="form-card" style={{ marginTop: '2rem' }}>
          <h3>Editar Torneo: {editingTournament.name}</h3>
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" name="name" value={editFormData.name || ''} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label>Descripcion</label>
            <textarea name="description" value={editFormData.description || ''} onChange={handleEditChange} rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Lugar</label>
              <input type="text" name="venue" value={editFormData.venue || ''} onChange={handleEditChange} />
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input type="text" name="city" value={editFormData.city || ''} onChange={handleEditChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Direccion</label>
            <input type="text" name="address" value={editFormData.address || ''} onChange={handleEditChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Inicio</label>
              <input type="date" name="tournament_start" value={editFormData.tournament_start || ''} onChange={handleEditChange} required />
            </div>
            <div className="form-group">
              <label>Fin</label>
              <input type="date" name="tournament_end" value={editFormData.tournament_end || ''} onChange={handleEditChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Inscripcion abre</label>
              <input type="date" name="registration_opens" value={editFormData.registration_opens || ''} onChange={handleEditChange} />
            </div>
            <div className="form-group">
              <label>Inscripcion cierra</label>
              <input type="date" name="registration_closes" value={editFormData.registration_closes || ''} onChange={handleEditChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Costo inscripcion</label>
              <input type="number" name="registration_fee" value={editFormData.registration_fee || 0} onChange={handleEditChange} step="0.01" />
            </div>
            <div className="form-group">
              <label>Max participantes</label>
              <input type="number" name="max_participants" value={editFormData.max_participants || ''} onChange={handleEditChange} />
            </div>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="is_public" checked={editFormData.is_public || false} onChange={handleEditChange} />
              Publico
            </label>
          </div>
          <button type="submit" className="btn-primary">Guardar Cambios</button>
          <button type="button" className="btn-secondary" onClick={() => { setShowEditForm(false); setEditingTournament(null); }} style={{ marginLeft: '0.5rem' }}>Cancelar</button>
        </form>
      )}
    </div>
  );
};

export default TournamentsList;
