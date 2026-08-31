import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentApi, configApi, competitionApi, readBlobError } from '../api';

const TournamentEvents = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [disciplines, setDisciplines] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [eventAthletes, setEventAthletes] = useState({});
  const [selectedEventForReg, setSelectedEventForReg] = useState('');
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState('');
  const [showWithAthletes, setShowWithAthletes] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    discipline: '',
    event_type: '',
    sex: '',
    category: '',
    functional_classifications: [],
  });
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState({
    event_types: [],
    sexes: [],
    categories: [],
    functional_classifications: [],
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState({ created: 0, total: 0, elapsed: 0, eta: null });

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

    configApi.getDisciplines().then(res => setDisciplines(res.data.results || res.data)).catch(() => {});
    configApi.getEventTypes().then(res => setEventTypes(res.data.results || res.data)).catch(() => {});
    configApi.getSexes().then(res => setSexes(res.data.results || res.data)).catch(() => {});
    configApi.getCategories().then(res => setCategories(res.data.results || res.data)).catch(() => {});
    configApi.getClassifications().then(res => setClassifications(res.data.results || res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!manualForm.event_type || !manualForm.sex || !manualForm.category) return;
    const et = eventTypes.find(x => x.id === manualForm.event_type);
    const sx = sexes.find(x => x.id === manualForm.sex);
    const cat = categories.find(x => x.id === manualForm.category);
    const fcs = classifications
      .filter(c => manualForm.functional_classifications.includes(c.id))
      .map(c => c.code);
    const name = [et?.name, sx?.name, cat?.name, fcs.length ? fcs.join('/') : null]
      .filter(Boolean).join(' - ');
    setManualForm(prev => ({ ...prev, name }));
  }, [manualForm.event_type, manualForm.sex, manualForm.category, manualForm.functional_classifications]);

  const handleMultiChange = (name, value, checked) => {
    setCurrentGroup(prev => ({
      ...prev,
      [name]: checked ? [...prev[name], value] : prev[name].filter(v => v !== value),
    }));
  };

  const handleSelectAll = (name, items) => {
    setCurrentGroup(prev => ({
      ...prev,
      [name]: items.map(i => i.id),
    }));
  };

  const handleClearAll = (name) => {
    setCurrentGroup(prev => ({
      ...prev,
      [name]: [],
    }));
  };

  const handleChange = (e) => {
    setCurrentGroup({ ...currentGroup, [e.target.name]: e.target.value });
  };

  const addGroup = () => {
    if (!currentGroup.event_types.length || !currentGroup.sexes.length || !currentGroup.categories.length) {
      alert('Cada grupo debe tener al menos una disciplina, sexo y categoria');
      return;
    }
    setGroups(prev => [...prev, { ...currentGroup, id: Date.now() }]);
    setCurrentGroup({
      event_types: [], sexes: [], categories: [], functional_classifications: [],
    });
  };

  const removeGroup = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const groupCount = (g) => g.event_types.length * g.sexes.length * g.categories.length * (g.functional_classifications.length || 1);

  const totalGroupsCount = groups.reduce((acc, g) => acc + groupCount(g), 0);

  const buildCombos = () => {
    const combos = [];
    groups.forEach(g => {
      g.event_types.forEach(et =>
        g.sexes.forEach(sx =>
          g.categories.forEach(cat => {
            if (g.functional_classifications.length) {
              g.functional_classifications.forEach(fc =>
                combos.push({ event_type: et, sex: sx, category: cat, functional_classification: fc })
              );
            } else {
              combos.push({ event_type: et, sex: sx, category: cat });
            }
          })
        )
      );
    });
    return combos;
  };

  const CHUNK_SIZE = 250;

  const handleSubmit = async () => {
    if (!groups.length) {
      alert('Agrega al menos un grupo de pruebas');
      return;
    }
    const combos = buildCombos();
    const total = combos.length;
    setCreating(true);
    setProgress({ created: 0, total, elapsed: 0, eta: null });
    const start = Date.now();
    try {
      for (let i = 0; i < combos.length; i += CHUNK_SIZE) {
        const chunk = combos.slice(i, i + CHUNK_SIZE);
        await tournamentApi.createTournamentEvents(id, { tournament: id, combos: chunk });
        const created = Math.min(i + chunk.length, total);
        const elapsed = (Date.now() - start) / 1000;
        const rate = elapsed > 0 ? created / elapsed : 0;
        const eta = rate > 0 && created < total ? Math.round((total - created) / rate) : null;
        setProgress({ created, total, elapsed: Math.round(elapsed), eta });
      }
      setShowForm(false);
      setGroups([]);
      setPage(1);
      setCreating(false);
      setCurrentGroup({
        event_types: [], sexes: [], categories: [], functional_classifications: [],
      });
      const resList = await tournamentApi.getTournamentEvents(id);
      setEvents(resList.data.results || resList.data);
      alert(`${total} pruebas creadas`);
    } catch (err) {
      setCreating(false);
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
      } else {
        alert('Error al crear pruebas');
      }
    }
  };

  const handleManualChange = (e) => {
    setManualForm({ ...manualForm, [e.target.name]: e.target.value });
  };

  const handleManualMultiChange = (id, checked) => {
    setManualForm(prev => ({
      ...prev,
      functional_classifications: checked
        ? [...prev.functional_classifications, id]
        : prev.functional_classifications.filter(v => v !== id),
    }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.event_type || !manualForm.sex || !manualForm.category) {
      alert('Debes elegir disciplina, tipo de prueba, sexo y categoria');
      return;
    }
    try {
      const et = eventTypes.find(x => x.id === manualForm.event_type);
      await tournamentApi.createTournamentEvents(id, {
        tournament: id,
        name: manualForm.name || 'Prueba',
        event_type: manualForm.event_type,
        discipline: et.discipline,
        sex: manualForm.sex,
        category: manualForm.category,
        functional_classifications: manualForm.functional_classifications,
      });
      setShowManualForm(false);
      setManualForm({
        name: '', discipline: '', event_type: '', sex: '', category: '', functional_classifications: [],
      });
      const res = await tournamentApi.getTournamentEvents(id);
      setEvents(res.data.results || res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
      } else {
        alert('Error al crear la prueba');
      }
    }
  };

  const handleFinalize = async () => {
    if (!confirm('Esto elimina las pruebas sin inscriptos y oficializa las que tienen al menos un atleta. ¿Continuar?')) return;
    setFinalizing(true);
    try {
      const res = await tournamentApi.finalizeTournamentEvents(id);
      alert(res.data.message || 'Pruebas oficializadas');
      const res2 = await tournamentApi.getTournamentEvents(id);
      setEvents(res2.data.results || res2.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al oficializar pruebas');
      }
    } finally {
      setFinalizing(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Eliminar esta prueba?')) return;
    try {
      await tournamentApi.deleteTournamentEvent(eventId);
      const res = await tournamentApi.getTournamentEvents(id);
      setEvents(res.data.results || res.data);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await tournamentApi.updateTournamentEvent(eventId, { status: newStatus });
      const res = await tournamentApi.getTournamentEvents(id);
      setEvents(res.data.results || res.data);
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const handleDownloadEventStartList = async (eventId) => {
    try {
      await competitionApi.getEventStartList(eventId);
    } catch (err) {
      alert(await readBlobError(err));
    }
  };

  const handleDownloadTournamentStartList = async () => {
    try {
      await tournamentApi.getTournamentStartList(id);
    } catch (err) {
      alert(await readBlobError(err));
    }
  };

  const handleScheduleChange = async (eventId, field, value) => {
    try {
      await tournamentApi.updateTournamentEvent(eventId, { [field]: value });
      const res = await tournamentApi.getTournamentEvents(id);
      setEvents(res.data.results || res.data);
    } catch (err) {
      alert('Error al actualizar cronograma');
    }
  };

  const handleRegisterAthlete = async (eventId, athleteId) => {
    if (!eventId || !athleteId) return;
    try {
      await competitionApi.registerAthleteToEvent(eventId, {
        athlete: athleteId,
        tournament_event: eventId,
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

  const totalCombos = currentGroup.event_types.length * currentGroup.sexes.length * currentGroup.categories.length * (currentGroup.functional_classifications.length || 1);

  const statusLabels = {
    scheduled: 'Programada',
    in_progress: 'En Curso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  if (!tournament) return <p>Cargando...</p>;

  const filteredClassifications = classifications.filter(c =>
    !tournament.functional_classifications?.length || tournament.functional_classifications.includes(c.id)
  );

  const allDisplayedEvents = (showWithAthletes
    ? events.filter(e => (e.athlete_count || 0) > 0)
    : events).filter(e =>
      !search ||
      (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.event_type_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.sex_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.classifications_list || []).some(c => c.toLowerCase().includes(search.toLowerCase()))
    );
  const totalCount = allDisplayedEvents.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageEvents = allDisplayedEvents.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pruebas - {tournament.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={`btn-sm ${showWithAthletes ? 'btn-primary' : ''}`} onClick={() => { setShowWithAthletes(!showWithAthletes); setPage(1); }}>
            {showWithAthletes ? 'Mostrar todas' : 'Solo con inscriptos'}
          </button>
          <button className={`btn-sm ${showManualForm ? 'btn-primary' : ''}`} onClick={() => { setShowManualForm(!showManualForm); setShowForm(false); }} disabled={creating}>
            {showManualForm ? 'Cancelar' : 'Crear Prueba'}
          </button>
          <button className={`btn-sm ${showForm ? 'btn-primary' : ''}`} onClick={() => { setShowForm(!showForm); setShowManualForm(false); }} disabled={creating}>
            {showForm ? 'Cancelar' : 'Generar Pruebas'}
          </button>
          <button className="btn-sm" onClick={handleDownloadTournamentStartList}>
            StartList Completo
          </button>
          {['registration_closed', 'in_progress'].includes(tournament.status) && (
            <button className="btn-sm btn-success" onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? 'Oficializando...' : 'Oficializar Pruebas con Inscriptos'}
            </button>
          )}
        </div>
      </div>

      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="form-card">
          <h3>Crear Prueba</h3>
          <div className="form-row">
            <div className="form-group">
              <label>1. Tipo de Prueba *</label>
              <select name="discipline" value={manualForm.discipline} onChange={(e) => {
                handleManualChange(e);
                setManualForm(prev => ({ ...prev, event_type: '' }));
              }}>
                <option value="">-- Seleccionar --</option>
                {disciplines.filter(d =>
                  tournament.disciplines?.includes(d.id) || !tournament.disciplines?.length
                ).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>2. Disciplina *</label>
              <select name="event_type" value={manualForm.event_type} onChange={handleManualChange} disabled={!manualForm.discipline}>
                <option value="">-- Seleccionar --</option>
                {eventTypes.filter(et => et.discipline === manualForm.discipline).map(et => (
                  <option key={et.id} value={et.id}>{et.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>3. Sexo *</label>
              <select name="sex" value={manualForm.sex} onChange={handleManualChange}>
                <option value="">-- Seleccionar --</option>
                {sexes.filter(s => tournament.sexes?.includes(s.id) || !tournament.sexes?.length).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>4. Categoria *</label>
              <select name="category" value={manualForm.category} onChange={handleManualChange}>
                <option value="">-- Seleccionar --</option>
                {categories.filter(c => tournament.categories?.includes(c.id) || !tournament.categories?.length).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>5. Clasificaciones Funcionales (puede elegir mas de una) *</label>
            <div className="checkbox-group">
              {classifications
                .filter(c =>
                  (!manualForm.discipline || c.discipline === manualForm.discipline) &&
                  (!tournament.functional_classifications?.length || tournament.functional_classifications.includes(c.id))
                )
                .map(c => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      checked={manualForm.functional_classifications.includes(c.id)}
                      onChange={(e) => handleManualMultiChange(c.id, e.target.checked)}
                    />
                    {c.code} - {c.name}
                  </label>
                ))}
            </div>
          </div>
          <div className="form-group">
            <label>Nombre de la Prueba</label>
            <input type="text" name="name" value={manualForm.name} onChange={handleManualChange} placeholder="Se completa automaticamente" />
          </div>
          <button type="submit" className="btn-primary">Crear Prueba</button>
        </form>
      )}

      {showForm && (
        <div className="form-card">
          <h3>Generar Pruebas</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Configura un grupo de pruebas (combinacion de disciplinas, sexos, categorias y clasificaciones).
            Podes agregar varios grupos y recien al final confirmar la creacion de todos.
          </p>

          <div className="form-group">
            <label>Disciplinas *</label>
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
                    checked={currentGroup.event_types.includes(et.id)}
                    onChange={(e) => handleMultiChange('event_types', et.id, e.target.checked)}
                  />
                  {et.name} (Tipo: {et.discipline_name})
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
                    checked={currentGroup.sexes.includes(s.id)}
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
                    checked={currentGroup.categories.includes(c.id)}
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
                  checked={currentGroup.functional_classifications.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCurrentGroup(prev => ({ ...prev, functional_classifications: [] }));
                    }
                  }}
                />
                Sin clasificacion (abierto)
              </label>
              {filteredClassifications.map(c => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={currentGroup.functional_classifications.includes(c.id)}
                    onChange={(e) => handleMultiChange('functional_classifications', c.id, e.target.checked)}
                  />
                  {c.code} - {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="combo-preview">
            <strong>Este grupo genera {totalCombos} prueba(s)</strong>
            <p>{currentGroup.event_types.length} disciplinas × {currentGroup.sexes.length} sexos × {currentGroup.categories.length} categorias
              {currentGroup.functional_classifications.length > 0 && ` × ${currentGroup.functional_classifications.length} clasificaciones`}
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={addGroup} disabled={creating}>Agregar Grupo</button>

          {groups.length > 0 && (
            <>
              <h3 style={{ marginTop: '1.5rem' }}>Grupos agregados ({groups.length})</h3>
              {groups.map((g, idx) => (
                <div key={g.id} className="detail-section" style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <strong>Grupo {idx + 1}: {groupCount(g)} prueba(s)</strong>
                      <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
                        {g.event_types.length} disciplinas × {g.sexes.length} sexos × {g.categories.length} categorias
                        {g.functional_classifications.length > 0 && ` × ${g.functional_classifications.length} clasificaciones`}
                      </p>
                    </div>
                    <button className="btn-sm btn-danger" onClick={() => removeGroup(g.id)} disabled={creating}>Quitar</button>
                  </div>
                </div>
              ))}
              {creating ? (
                <div className="combo-preview" style={{ marginTop: '1rem' }}>
                  <strong>Creando pruebas... {progress.created} / {progress.total}</strong>
                  <div style={{ background: 'var(--bg-2)', borderRadius: 8, height: 12, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progress.total ? Math.round((progress.created / progress.total) * 100) : 0}%`, background: 'var(--primary)', height: 12, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                    Tiempo transcurrido: {progress.elapsed}s
                    {progress.eta !== null && ` - Tiempo estimado restante: ${progress.eta}s`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="combo-preview" style={{ marginTop: '1rem' }}>
                    <strong>Se generaran {totalGroupsCount} pruebas en total</strong>
                  </div>
                  <button type="button" className="btn-primary" onClick={handleSubmit}>Confirmar Creacion de {totalGroupsCount} Pruebas</button>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ margin: 0 }}><strong>Total de pruebas: {totalCount}</strong></p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar prueba (nombre, sexo, categoria, clasif.)..."
            style={{ minWidth: '260px', padding: '0.5rem 0.75rem' }}
          />
          {search && (
            <button className="btn-sm" onClick={() => { setSearch(''); setPage(1); }}>Limpiar</button>
          )}
          {pageCount > 1 && (
            <>
              <button className="btn-sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Anterior</button>
              <span style={{ fontSize: '0.875rem' }}>Pagina {safePage} de {pageCount}</span>
              <button className="btn-sm" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>Siguiente</button>
            </>
          )}
        </div>
      </div>
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
          {pageEvents.map(e => (
            <tr key={e.id}>
              <td>
                <strong>{e.name}</strong>
                {e.is_final && <span className="badge badge-approved" style={{ marginLeft: '0.5rem' }}>Oficial</span>}
              </td>
              <td>{e.event_type_name}</td>
              <td>{e.sex_name}</td>
              <td>{e.category_name}</td>
              <td>{e.classifications_list?.length ? e.classifications_list.join(', ') : (e.classification_code || 'Libre')}</td>
              <td>
                <input type="date" value={e.scheduled_date || ''} size="10"
                  onChange={(ev) => handleScheduleChange(e.id, 'scheduled_date', ev.target.value)} />
                <input type="time" value={e.scheduled_time || ''} size="8"
                  onChange={(ev) => handleScheduleChange(e.id, 'scheduled_time', ev.target.value)} />
              </td>
              <td>
                <input type="text" value={e.venue_detail || ''} size="12"
                  onChange={(ev) => handleScheduleChange(e.id, 'venue_detail', ev.target.value)} />
              </td>
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
                  {eventAthletes[e.id] ? `${eventAthletes[e.id].length}` : (e.athlete_count || 0)}
                </button>
              </td>
              <td>
                {e.is_track && <Link to={`/dashboard/events/${e.id}/lanes`} className="btn-sm">Carriles</Link>}
                <button className="btn-sm" onClick={() => handleDownloadEventStartList(e.id)}>StartList</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(e.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {Object.keys(eventAthletes).map(eventId => {
        const event = allDisplayedEvents.find(e => e.id === eventId);
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

      {totalCount === 0 && <p>No hay pruebas {showWithAthletes ? 'con inscriptos' : 'creadas'}. {!showWithAthletes && 'Usa el boton "Generar Pruebas" para crearlas automaticamente.'}</p>}
    </div>
  );
};

export default TournamentEvents;
