import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tournamentApi, configApi, competitionApi } from '../api';

const TournamentEvents = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [eventAthletes, setEventAthletes] = useState({});
  const [selectedEventForReg, setSelectedEventForReg] = useState('');
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState('');
  const [formData, setFormData] = useState({
    event_types: [],
    sexes: [],
    categories: [],
    functional_classifications: [],
    scheduled_date: '',
    scheduled_time: '',
    venue_detail: '',
    tournament: id,
  });

  useEffect(() => {
    tournamentApi.getTournament(id)
      .then(res => setTournament(res.data))
      .catch(() => {});

    tournamentApi.getTournamentEvents(id)
      .then(res => setEvents(res.data.results || res.data))
      .catch(() => {});

    tournamentApi.getMyInstitution()
      .then(res => tournamentApi.getInstitutionAthletes(res.data.id))
      .then(res => setAthletes(res.data.results || res.data))
      .catch(() => {});

    configApi.getEventTypes().then(res => setEventTypes(res.data.results || res.data)).catch(() => {});
    configApi.getSexes().then(res => setSexes(res.data.results || res.data)).catch(() => {});
    configApi.getCategories().then(res => setCategories(res.data.results || res.data)).catch(() => {});
    configApi.getClassifications().then(res => setClassifications(res.data.results || res.data)).catch(() => {});
  }, [id]);

  const handleMultiChange = (name, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked ? [...prev[name], value] : prev[name].filter(v => v !== value),
    }));
  };

  const handleSelectAll = (name, items) => {
    setFormData(prev => ({
      ...prev,
      [name]: items.map(i => i.id),
    }));
  };

  const handleClearAll = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: [],
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.event_types.length || !formData.sexes.length || !formData.categories.length) {
      alert('Debes seleccionar al menos una disciplina, sexo y categoria');
      return;
    }
    try {
      const res = await fetch(`/api/tournaments/tournaments/${id}/events/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear');
      }
      setShowForm(false);
      setFormData({
        event_types: [], sexes: [], categories: [], functional_classifications: [],
        scheduled_date: '', scheduled_time: '', venue_detail: '', tournament: id,
      });
      const res2 = await tournamentApi.getTournamentEvents(id);
      setEvents(res2.data.results || res2.data);
    } catch (err) {
      alert(err.message || 'Error al crear pruebas');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Eliminar esta prueba?')) return;
    try {
      await fetch(`/api/tournaments/tournament-events/${eventId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const res = await tournamentApi.getTournamentEvents(id);
      setEvents(res.data.results || res.data);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await fetch(`/api/tournaments/tournament-events/${eventId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const res = await tournamentApi.getTournamentEvents(id);
      setEvents(res.data.results || res.data);
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const handleRegisterAthlete = async (eventId, athleteId) => {
    if (!eventId || !athleteId) return;
    try {
      await fetch(`/api/competitions/events/${eventId}/register-athlete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          athlete: athleteId,
          tournament_event: eventId,
        }),
      });
      loadEventAthletes(eventId);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al inscribir atleta');
      }
    }
  };

  const loadEventAthletes = async (eventId) => {
    try {
      const res = await competitionApi.getAthleteEvents(eventId);
      setEventAthletes(prev => ({ ...prev, [eventId]: res.data.results || res.data }));
    } catch (err) {}
  };

  const toggleEventAthletes = (eventId) => {
    if (!eventAthletes[eventId]) {
      loadEventAthletes(eventId);
    } else {
      setEventAthletes(prev => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    }
  };

  const totalCombos = formData.event_types.length * formData.sexes.length * formData.categories.length *
    (formData.functional_classifications.length || 1);

  const statusLabels = {
    scheduled: 'Programada',
    in_progress: 'En Curso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  if (!tournament) return <p>Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pruebas - {tournament.name}</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Generar Pruebas'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group">
            <label>Disciplinas (tipos de pruebas) *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" className="btn-sm" onClick={() => handleSelectAll('event_types', eventTypes)}>Seleccionar Todo</button>
              <button type="button" className="btn-sm btn-secondary" onClick={() => handleClearAll('event_types')}>Limpiar</button>
            </div>
            <div className="checkbox-group">
              {eventTypes.filter(et =>
                tournament.disciplines?.includes(et.discipline) || !tournament.disciplines?.length
              ).map(et => (
                <label key={et.id}>
                  <input
                    type="checkbox"
                    checked={formData.event_types.includes(et.id)}
                    onChange={(e) => handleMultiChange('event_types', et.id, e.target.checked)}
                  />
                  {et.name} ({et.discipline_name})
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Sexos *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" className="btn-sm" onClick={() => handleSelectAll('sexes', sexes)}>Seleccionar Todo</button>
              <button type="button" className="btn-sm btn-secondary" onClick={() => handleClearAll('sexes')}>Limpiar</button>
            </div>
            <div className="checkbox-group">
              {sexes.filter(s => tournament.sexes?.includes(s.id) || !tournament.sexes?.length).map(s => (
                <label key={s.id}>
                  <input
                    type="checkbox"
                    checked={formData.sexes.includes(s.id)}
                    onChange={(e) => handleMultiChange('sexes', s.id, e.target.checked)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Categorias *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" className="btn-sm" onClick={() => handleSelectAll('categories', categories)}>Seleccionar Todo</button>
              <button type="button" className="btn-sm btn-secondary" onClick={() => handleClearAll('categories')}>Limpiar</button>
            </div>
            <div className="checkbox-group">
              {categories.filter(c => tournament.categories?.includes(c.id) || !tournament.categories?.length).map(c => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(c.id)}
                    onChange={(e) => handleMultiChange('categories', c.id, e.target.checked)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Clasificacion Funcional (opcional - si no selecciona, las pruebas son libres)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" className="btn-sm" onClick={() => handleSelectAll('functional_classifications', classifications)}>Seleccionar Todo</button>
              <button type="button" className="btn-sm btn-secondary" onClick={() => handleClearAll('functional_classifications')}>Limpiar</button>
            </div>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.functional_classifications.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, functional_classifications: [] }));
                    }
                  }}
                />
                Sin clasificacion (abierto)
              </label>
              {classifications.map(c => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={formData.functional_classifications.includes(c.id)}
                    onChange={(e) => handleMultiChange('functional_classifications', c.id, e.target.checked)}
                  />
                  {c.code} - {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" name="scheduled_date" value={formData.scheduled_date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input type="time" name="scheduled_time" value={formData.scheduled_time} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Lugar (pista, sector)</label>
            <input type="text" name="venue_detail" value={formData.venue_detail} onChange={handleChange} placeholder="Ej: Pista 1" />
          </div>
          <div className="combo-preview">
            <strong>Se generaran {totalCombos} pruebas</strong>
            <p>{formData.event_types.length} disciplinas × {formData.sexes.length} sexos × {formData.categories.length} categorias × {formData.functional_classifications.length || 1} clasificaciones</p>
          </div>
          <button type="submit" className="btn-primary">Generar {totalCombos} Pruebas</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Prueba</th>
            <th>Disciplina</th>
            <th>Sexo</th>
            <th>Categoria</th>
            <th>Clasif.</th>
            <th>Fecha/Hora</th>
            <th>Lugar</th>
            <th>Estado</th>
            <th>Inscriptos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id}>
              <td><strong>{e.name}</strong></td>
              <td>{e.event_type_name}</td>
              <td>{e.sex_name}</td>
              <td>{e.category_name}</td>
              <td>{e.classification_code || 'Libre'}</td>
              <td>{e.scheduled_date ? new Date(e.scheduled_date).toLocaleString() : '-'}</td>
              <td>{e.venue_detail || '-'}</td>
              <td>
                <select
                  className="status-select"
                  value={e.status}
                  onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                >
                  <option value="scheduled">Programada</option>
                  <option value="in_progress">En Curso</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </td>
              <td>
                <button className="btn-sm" onClick={() => toggleEventAthletes(e.id)}>
                  {eventAthletes[e.id] ? `${eventAthletes[e.id].length}` : 'Ver'}
                </button>
              </td>
              <td>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(e.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {Object.keys(eventAthletes).map(eventId => {
        const event = events.find(e => e.id === eventId);
        const registered = eventAthletes[eventId] || [];
        const filteredAthletes = athletes.filter(a => {
          if (event?.sex && a.sex !== event.sex) return false;
          if (event?.category && a.category !== event.category) return false;
          if (event?.functional_classification && a.functional_classification !== event.functional_classification) return false;
          return !registered.some(r => r.registration && r.registration.athlete === a.id);
        });

        return (
          <div key={eventId} className="form-card" style={{ marginTop: '1rem' }}>
            <h3>Inscriptos en: {event?.name}</h3>
            <div className="register-form" style={{ marginBottom: '1rem' }}>
              <select value={selectedAthleteForReg || ''} onChange={(e) => setSelectedAthleteForReg(e.target.value)}>
                <option value="">Seleccionar atleta</option>
                {filteredAthletes.map(a => (
                  <option key={a.id} value={a.id}>{a.user_name}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={() => handleRegisterAthlete(eventId, selectedAthleteForReg)} disabled={!selectedAthleteForReg}>Inscribir</button>
            </div>
            {registered.length === 0 ? (
              <p>No hay atletas inscriptos</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Sexo</th>
                    <th>Clasif.</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {registered.map(r => (
                    <tr key={r.id}>
                      <td>{r.athlete_name || 'Atleta'}</td>
                      <td>{r.sex_name || '-'}</td>
                      <td>{r.classification_code || '-'}</td>
                      <td><span className={`badge badge-${r.status || 'pending'}`}>{r.status || 'Pendiente'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {events.length === 0 && <p>No hay pruebas creadas. Usa el boton "Generar Pruebas" para crearlas automaticamente.</p>}
    </div>
  );
};

export default TournamentEvents;
