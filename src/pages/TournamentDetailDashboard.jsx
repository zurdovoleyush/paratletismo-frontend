import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentApi, configApi, competitionApi, usersApi } from '../api';
import { useAuth } from '../context/AuthContext';

const statusLabels = {
  draft: 'Borrador', registration_open: 'Inscripcion Abierta',
  registration_closed: 'Inscripcion Cerrada', in_progress: 'En Progreso',
  completed: 'Completado', cancelled: 'Cancelado',
};

const TABS = [
  { key: 'info', label: 'Informacion' },
  { key: 'events', label: 'Pruebas' },
  { key: 'registrations', label: 'Inscripciones' },
  { key: 'judges', label: 'Jueces' },
  { key: 'schedule', label: 'Programacion' },
  { key: 'results', label: 'Resultados' },
];

const JudgesTab = ({ tournament, events, judges, headJudges, handleUpdateField, updateMsg, setUpdateMsg }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedJudge, setSelectedJudge] = useState('');
  const [isHead, setIsHead] = useState(false);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (selectedEvent) {
      competitionApi.getJudgeAssignments(selectedEvent)
        .then(res => setAssignments(res.data.results || res.data))
        .catch(() => {});
    }
  }, [selectedEvent]);

  const handleAssign = async () => {
    if (!selectedEvent || !selectedJudge) return;
    try {
      await competitionApi.createJudgeAssignment(selectedEvent, {
        tournament_event: selectedEvent, judge: selectedJudge, is_head: isHead,
      });
      setSelectedJudge('');
      setIsHead(false);
      const res = await competitionApi.getJudgeAssignments(selectedEvent);
      setAssignments(res.data.results || res.data);
      setUpdateMsg('Juez asignado');
    } catch (err) {
      alert('Error al asignar juez');
    }
  };

  const handleRemove = async (assignmentId) => {
    try {
      const api = (await import('../api/api')).default;
      await api.delete(`/competitions/judges/${assignmentId}/`);
      const res = await competitionApi.getJudgeAssignments(selectedEvent);
      setAssignments(res.data.results || res.data);
    } catch (err) {
      alert('Error al remover');
    }
  };

  return (
    <div>
      {updateMsg && <p style={{ color: 'var(--success)' }}>{updateMsg}</p>}

      <div className="form-card">
        <h3>Juez Principal del Torneo</h3>
        <div className="form-group">
          <select value={tournament.head_judge || ''}
            onChange={(e) => handleUpdateField('head_judge', e.target.value || null)}>
            <option value="">Sin asignar</option>
            {[...headJudges, ...judges].map(j => (
              <option key={j.id} value={j.id}>{j.first_name} {j.last_name} ({j.role_display})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-card">
        <h3>Asignar Juez a Prueba</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Prueba</label>
            <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="">Seleccionar prueba</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.sex_name || 'Multiple'} - {e.category_name || 'Multiple'})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Juez</label>
            <select value={selectedJudge} onChange={(e) => setSelectedJudge(e.target.value)}>
              <option value="">Seleccionar juez</option>
              {[...headJudges, ...judges].map(j => (
                <option key={j.id} value={j.id}>{j.first_name} {j.last_name} ({j.role_display})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={isHead} onChange={(e) => setIsHead(e.target.checked)} />
            Es Juez Principal de esta prueba
          </label>
        </div>
        <button className="btn-primary" onClick={handleAssign} disabled={!selectedEvent || !selectedJudge}>
          Asignar Juez
        </button>
      </div>

      {selectedEvent && (
        <div className="form-card">
          <h3>Jueces Asignados a: {events.find(e => e.id === selectedEvent)?.name}</h3>
          <table className="data-table">
            <thead>
              <tr><th>Juez</th><th>Rol</th><th>Es Principal</th><th>Asignado</th><th>Accion</th></tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td>{a.judge_name}</td>
                  <td>{a.is_head ? 'Juez Principal' : 'Juez'}</td>
                  <td>{a.is_head ? 'Si' : 'No'}</td>
                  <td>{new Date(a.assigned_at).toLocaleString()}</td>
                  <td><button className="btn-sm btn-danger" onClick={() => handleRemove(a.id)}>Remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignments.length === 0 && <p>No hay jueces asignados</p>}
        </div>
      )}
    </div>
  );
};

const ScheduleTab = ({ tournament, events, eventAthletes, setUpdateMsg }) => {
  const [scheduleData, setScheduleData] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyWithAthletes, setOnlyWithAthletes] = useState(true);

  useEffect(() => {
    const initial = {};
    events.forEach(e => {
      initial[e.id] = {
        scheduled_date: e.scheduled_date || '',
        scheduled_time: e.scheduled_time || '',
        call_time: e.call_time || '',
        venue_detail: e.venue_detail || '',
      };
    });
    setScheduleData(initial);
  }, [events]);

  const handleScheduleChange = (eventId, field, value) => {
    setScheduleData(prev => ({ ...prev, [eventId]: { ...prev[eventId], [field]: value } }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const schedules = Object.entries(scheduleData).map(([eventId, data]) => ({
        event_id: eventId, ...data,
      }));
      const res = await tournamentApi.bulkScheduleEvents(tournament.id, { schedules });
      setUpdateMsg(`${res.data.updated} pruebas programadas`);
    } catch (err) {
      alert('Error al guardar programacion');
    } finally {
      setSaving(false);
    }
  };

  const eventsWithAthletes = events.filter(e => (e.athlete_count || 0) > 0);

  const matchesSearch = (e) =>
    !search || (e.name || '').toLowerCase().includes(search.toLowerCase());

  const displayedEvents = (onlyWithAthletes ? eventsWithAthletes : events).filter(matchesSearch);
  const eventsWithoutSchedule = displayedEvents.filter(e => !scheduleData[e.id]?.scheduled_date);

  return (
    <div>
      <div className="form-card" style={{ marginBottom: '1rem' }}>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group">
            <label>Buscar prueba</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: 100 mts, Femenino, T36, Salto..."
              style={{ minWidth: '250px' }}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={onlyWithAthletes}
                onChange={(e) => setOnlyWithAthletes(e.target.checked)}
                style={{ marginRight: '0.4rem' }}
              />
              Solo pruebas con inscriptos
            </label>
          </div>
        </div>
        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', margin: 0 }}>
          {displayedEvents.length} prueba(s) en vista
          {onlyWithAthletes && ` de ${events.length} totales (${eventsWithAthletes.length} con inscriptos)`}
        </p>
      </div>

      {eventsWithoutSchedule.length > 0 && (
        <div className="detail-section">
          <h3>Pruebas sin programar ({eventsWithoutSchedule.length})</h3>
          <table className="data-table">
            <thead>
              <tr><th>Prueba</th><th>Inscriptos</th><th>Asignar Fecha</th><th>Camara de Llamada</th><th>Hora de Prueba</th><th>Lugar</th></tr>
            </thead>
            <tbody>
              {eventsWithoutSchedule.map(e => (
                <tr key={e.id}>
                  <td><strong>{e.name}</strong></td>
                  <td>{e.athlete_count || 0}</td>
                  <td>
                    <input type="date" value={scheduleData[e.id]?.scheduled_date || ''}
                      onChange={(ev) => handleScheduleChange(e.id, 'scheduled_date', ev.target.value)} />
                  </td>
                  <td>
                    <input type="time" value={scheduleData[e.id]?.call_time || ''}
                      onChange={(ev) => handleScheduleChange(e.id, 'call_time', ev.target.value)} />
                  </td>
                  <td>
                    <input type="time" value={scheduleData[e.id]?.scheduled_time || ''}
                      onChange={(ev) => handleScheduleChange(e.id, 'scheduled_time', ev.target.value)} />
                  </td>
                  <td>
                    <input type="text" value={scheduleData[e.id]?.venue_detail || ''} placeholder="Lugar"
                      onChange={(ev) => handleScheduleChange(e.id, 'venue_detail', ev.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="detail-section">
        <h3>{onlyWithAthletes ? 'Pruebas con Inscriptos' : 'Todas las Pruebas'} ({displayedEvents.length})</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Prueba</th><th>Inscriptos</th><th>Fecha</th><th>Camara de Llamada</th><th>Hora de Prueba</th><th>Lugar</th>
            </tr>
          </thead>
          <tbody>
            {displayedEvents.map(e => (
              <tr key={e.id}>
                <td><strong>{e.name}</strong></td>
                <td>{e.athlete_count || 0}</td>
                <td>
                  <input type="date" value={scheduleData[e.id]?.scheduled_date || ''}
                    onChange={(ev) => handleScheduleChange(e.id, 'scheduled_date', ev.target.value)} />
                </td>
                <td>
                  <input type="time" value={scheduleData[e.id]?.call_time || ''}
                    onChange={(ev) => handleScheduleChange(e.id, 'call_time', ev.target.value)} />
                </td>
                <td>
                  <input type="time" value={scheduleData[e.id]?.scheduled_time || ''}
                    onChange={(ev) => handleScheduleChange(e.id, 'scheduled_time', ev.target.value)} />
                </td>
                <td>
                  <input type="text" value={scheduleData[e.id]?.venue_detail || ''} placeholder="Lugar"
                    onChange={(ev) => handleScheduleChange(e.id, 'venue_detail', ev.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayedEvents.length === 0 && <p>No hay pruebas que coincidan con la busqueda.</p>}
      </div>

      <button className="btn-primary" onClick={handleSaveAll} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Programacion'}
      </button>
    </div>
  );
};

const ResultsTab = ({ tournament, events, setUpdateMsg }) => {
  const [search, setSearch] = useState('');
  const [onlyWithAthletes, setOnlyWithAthletes] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [athleteEvents, setAthleteEvents] = useState([]);
  const [lanes, setLanes] = useState({});
  const [resultEntries, setResultEntries] = useState({});
  const [existingResults, setExistingResults] = useState({});
  const [finalResults, setFinalResults] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(false);

  const eventsWithAthletes = events.filter(e => (e.athlete_count || 0) > 0);
  const displayedEvents = (onlyWithAthletes ? eventsWithAthletes : events).filter(e =>
    !search || (e.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const loadEventData = async (eventId) => {
    setLoadingEvent(true);
    setSelectedEventId(eventId);
    setSelectedEvent(events.find(e => e.id === eventId) || null);
    setAthleteEvents([]);
    setLanes({});
    setResultEntries({});
    setExistingResults({});
    setFinalResults([]);
    try {
      const [laneRes, frRes] = await Promise.all([
        competitionApi.getLaneAssignments(eventId),
        competitionApi.getFinalResults({ tournament_event: eventId }),
      ]);
      const aes = laneRes.data.athlete_events || [];
      setAthleteEvents(aes);
      const laneMap = {};
      aes.forEach(ae => { laneMap[ae.id] = ae.lane || ''; });
      setLanes(laneMap);
      setFinalResults(frRes.data.results || frRes.data);

      const res = await competitionApi.getResults({});
      const allResults = res.data.results || res.data;
      const ids = new Set(aes.map(a => a.id));
      const grouped = {};
      allResults.filter(r => ids.has(r.athlete_event)).forEach(r => {
        if (!grouped[r.athlete_event]) grouped[r.athlete_event] = [];
        grouped[r.athlete_event].push(r);
      });
      const best = {};
      const isTrack = events.find(e => e.id === eventId)?.is_track;
      Object.entries(grouped).forEach(([aeId, list]) => {
        const valid = list.filter(r => r.is_valid);
        if (valid.length === 0) return;
        const sorted = [...valid].sort((a, b) => {
          const av = a.value != null ? parseFloat(a.value) : Number.MAX_VALUE;
          const bv = b.value != null ? parseFloat(b.value) : Number.MAX_VALUE;
          return isTrack ? av - bv : bv - av;
        });
        best[aeId] = sorted[0];
      });
      setExistingResults(best);
    } catch (err) {
      alert('Error al cargar la prueba');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleLaneChange = (aeId, value) => {
    setLanes(prev => ({ ...prev, [aeId]: value === '' ? '' : parseInt(value) || value }));
  };

  const handleAutoAssign = () => {
    const ordered = athleteEvents
      .filter(ae => ae.status !== 'withdrawn')
      .map((ae, i) => ({ [ae.id]: i + 1 }));
    setLanes(prev => ({ ...prev, ...Object.assign({}, ...ordered) }));
  };

  const handleSaveLanes = async () => {
    const lanesData = athleteEvents
      .filter(ae => lanes[ae.id] != null && lanes[ae.id] !== '')
      .map(ae => ({ athlete_event_id: ae.id, lane: parseInt(lanes[ae.id]) }));
    if (lanesData.length === 0) {
      alert('Asigna al menos un carril');
      return;
    }
    try {
      const res = await competitionApi.assignLanes(selectedEventId, { lanes: lanesData });
      setUpdateMsg(`${res.data.message || 'Carriles guardados'} (${lanesData.length})`);
    } catch (err) {
      alert('Error al guardar carriles');
    }
  };

  const handleResultChange = (aeId, value) => {
    setResultEntries(prev => ({ ...prev, [aeId]: value }));
  };

  const handleSaveResults = async () => {
    const results = Object.entries(resultEntries)
      .filter(([, v]) => v && String(v).trim() !== '')
      .map(([aeId, mark]) => ({
        athlete_event: aeId,
        attempt_number: 1,
        value: mark,
        mark: String(mark),
        is_valid: true,
      }));
    if (results.length === 0) {
      alert('Ingresa al menos un resultado');
      return;
    }
    try {
      const res = await competitionApi.createBulkResults(selectedEventId, { results });
      setUpdateMsg(res.data.message || 'Resultados guardados');
      setResultEntries({});
      loadEventData(selectedEventId);
    } catch (err) {
      alert('Error al guardar resultados');
    }
  };

  const handleCalculateFinal = async () => {
    if (!selectedEventId) return;
    try {
      const res = await competitionApi.calculateFinalResults({ tournament_event: selectedEventId });
      setUpdateMsg(res.data.message || 'Posiciones finales calculadas');
      const fr = await competitionApi.getFinalResults({ tournament_event: selectedEventId });
      setFinalResults(fr.data.results || fr.data);
    } catch (err) {
      alert('Error al calcular posiciones finales');
    }
  };

  const sortedAthletes = [...athleteEvents].sort((a, b) => {
    const la = parseInt(lanes[a.id]) || 999;
    const lb = parseInt(lanes[b.id]) || 999;
    return la - lb || (a.bib_number || 0) - (b.bib_number || 0);
  });

  const isTrack = selectedEvent?.is_track;

  return (
    <div>
      <div className="form-card" style={{ marginBottom: '1rem' }}>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group">
            <label>Buscar prueba</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: 100 mts, Femenino, T36, Salto..."
              style={{ minWidth: '250px' }}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={onlyWithAthletes}
                onChange={(e) => setOnlyWithAthletes(e.target.checked)}
                style={{ marginRight: '0.4rem' }}
              />
              Solo pruebas con inscriptos
            </label>
          </div>
        </div>
        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', margin: 0 }}>
          {displayedEvents.length} prueba(s) en vista
          {onlyWithAthletes && ` de ${events.length} totales (${eventsWithAthletes.length} con inscriptos)`}
        </p>
      </div>

      <div className="form-card" style={{ marginBottom: '1rem' }}>
        <h3>Seleccionar Prueba</h3>
        <div className="form-group">
          <select
            value={selectedEventId}
            onChange={(e) => { if (e.target.value) loadEventData(e.target.value); }}
            style={{ width: '100%' }}
          >
            <option value="">Seleccionar una prueba...</option>
            {displayedEvents.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} - {e.sex_name || 'Multiple'} - {e.category_name || 'Multiple'}
                {e.is_track ? ' (Pista)' : ' (Campo)'} - {e.athlete_count || 0} inscriptos
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedEvent && (
        <div className="detail-section">
          <h3>{selectedEvent.name} - {isTrack ? 'Pista' : 'Campo'}</h3>
          {loadingEvent ? (
            <p>Cargando...</p>
          ) : (
            <>
              {isTrack && athleteEvents.length > 0 && (
                <div className="form-card" style={{ marginBottom: '1rem' }}>
                  <h4>Asignar Andariveles</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button className="btn-sm" onClick={handleAutoAssign}>Auto-Asignar</button>
                    <button className="btn-primary" onClick={handleSaveLanes}>Guardar Carriles</button>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr><th>Carril</th><th>Atleta</th><th>Clasif.</th><th>Dorsal</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                      {sortedAthletes.map(ae => (
                        <tr key={ae.id} className={ae.status === 'withdrawn' ? 'row-withdrawn' : ''}>
                          <td>
                            <input type="number" min="0" max="20" size="2" style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                              value={lanes[ae.id] || ''}
                              onChange={(e) => handleLaneChange(ae.id, e.target.value)}
                              disabled={ae.status === 'withdrawn'} />
                          </td>
                          <td>{ae.athlete_name}</td>
                          <td>{ae.classification_code || '-'}</td>
                          <td>{ae.bib_number || '-'}</td>
                          <td>{ae.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {athleteEvents.length > 0 && (
                <div className="form-card">
                  <h4>Cargar {isTrack ? 'Tiempos (mm:ss,000)' : 'Marcas'}</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {isTrack && <th>Carril</th>}
                        <th>Atleta</th>
                        <th>Clasif.</th>
                        <th>{isTrack ? 'Tiempo (mm:ss,000)' : 'Marca (ej: 12.45)'}</th>
                        <th>Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAthletes.map(ae => {
                        const existing = existingResults[ae.id];
                        return (
                          <tr key={ae.id} className={ae.status === 'withdrawn' ? 'row-withdrawn' : ''}>
                            {isTrack && <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{lanes[ae.id] || '-'}</td>}
                            <td>
                              {ae.athlete_name}
                              {ae.institution_name && <span className="hint"> ({ae.institution_name})</span>}
                            </td>
                            <td>{ae.classification_code || '-'}</td>
                            <td>
                              <input
                                type="text"
                                placeholder={isTrack ? 'mm:ss,000' : 'ej: 12.45'}
                                value={resultEntries[ae.id] || ''}
                                onChange={(e) => handleResultChange(ae.id, e.target.value)}
                                disabled={ae.status === 'withdrawn'}
                              />
                            </td>
                            <td>{existing ? existing.mark : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={handleSaveResults}>Guardar Resultados</button>
                    <button className="btn-primary" onClick={handleCalculateFinal}>Calcular Posiciones Finales</button>
                  </div>
                </div>
              )}

              {athleteEvents.length === 0 && <p>No hay atletas inscriptos en esta prueba.</p>}
            </>
          )}

          {finalResults.length > 0 && (
            <div className="form-card" style={{ marginTop: '1rem' }}>
              <h4>Posiciones Finales</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Atleta</th><th>Clasif.</th><th>Marca</th><th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {finalResults.map(fr => (
                    <tr key={fr.id} className={fr.rank <= 3 ? 'top3' : ''}>
                      <td><strong>{fr.rank || '-'}</strong></td>
                      <td>{fr.athlete_name}</td>
                      <td>{fr.classification || '-'}</td>
                      <td>{fr.best_mark || '-'}</td>
                      <td>{fr.is_dnf ? 'DNF' : fr.is_dns ? 'DNS' : fr.is_dq ? 'DQ' : 'OK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TournamentDetailDashboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [tournament, setTournament] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [judges, setJudges] = useState([]);
  const [headJudges, setHeadJudges] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [eventAthletes, setEventAthletes] = useState({});
  const [showEventAthletes, setShowEventAthletes] = useState(null);
  const [myInstitution, setMyInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateMsg, setUpdateMsg] = useState('');

  const isManager = user?.id === tournament?.admin_user || user?.role === 'superadmin' || myInstitution?.id === tournament?.organizer;

  useEffect(() => {
    Promise.allSettled([
      tournamentApi.getTournament(id),
      tournamentApi.getTournamentEvents(id),
      competitionApi.getRegistrations({ tournament: id }),
      configApi.getDisciplines(),
      configApi.getEventTypes(),
      configApi.getSexes(),
      configApi.getCategories(),
      configApi.getClassifications(),
      usersApi.getUsers({ role: 'judge' }),
      usersApi.getUsers({ role: 'head_judge' }),
      tournamentApi.getMyInstitution(),
    ]).then(([tRes, eRes, rRes, dRes, etRes, sRes, cRes, clRes, jRes, hjRes, iRes]) => {
      if (tRes.status === 'fulfilled') setTournament(tRes.value.data);
      if (eRes.status === 'fulfilled') setEvents(eRes.value.data.results || eRes.value.data);
      if (rRes.status === 'fulfilled') setRegistrations(rRes.value.data.results || rRes.value.data);
      if (dRes.status === 'fulfilled') setDisciplines(dRes.value.data.results || dRes.value.data);
      if (etRes.status === 'fulfilled') setEventTypes(etRes.value.data.results || etRes.value.data);
      if (sRes.status === 'fulfilled') setSexes(sRes.value.data.results || sRes.value.data);
      if (cRes.status === 'fulfilled') setCategories(cRes.value.data.results || cRes.value.data);
      if (clRes.status === 'fulfilled') setClassifications(clRes.value.data.results || clRes.value.data);
      if (jRes.status === 'fulfilled') setJudges(jRes.value.data.results || jRes.value.data);
      if (hjRes.status === 'fulfilled') setHeadJudges(hjRes.value.data.results || hjRes.value.data);
      if (iRes.status === 'fulfilled') setMyInstitution(iRes.value.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await tournamentApi.updateStatus(id, newStatus);
      const res = await tournamentApi.getTournament(id);
      setTournament(res.data);
      setUpdateMsg('Estado actualizado');
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      await tournamentApi.updateTournament(id, { ...tournament, [field]: value });
      const res = await tournamentApi.getTournament(id);
      setTournament(res.data);
      setUpdateMsg('Torneo actualizado');
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  const loadEventAthletes = async (eventId) => {
    try {
      const res = await competitionApi.getAthleteEvents(eventId);
      setEventAthletes(prev => ({ ...prev, [eventId]: res.data.results || res.data }));
    } catch (err) {}
  };

  const statusTransitions = {
    draft: ['registration_open', 'cancelled'],
    registration_open: ['registration_closed'],
    registration_closed: ['in_progress'],
    in_progress: ['completed'],
  };

  if (loading) return <p>Cargando...</p>;
  if (!tournament) return <p>Torneo no encontrado</p>;

  const renderInfoTab = () => (
    <div>
      <div className="detail-section">
        <h2>Informacion General</h2>
        <p>{tournament.description}</p>
        <div className="info-grid">
          <div><strong>Lugar:</strong> {tournament.venue}</div>
          <div><strong>Direccion:</strong> {tournament.address}, {tournament.city}</div>
          <div><strong>Inicio:</strong> {new Date(tournament.tournament_start).toLocaleString()}</div>
          <div><strong>Fin:</strong> {new Date(tournament.tournament_end).toLocaleString()}</div>
          <div><strong>Inscripcion abre:</strong> {new Date(tournament.registration_opens).toLocaleString()}</div>
          <div><strong>Inscripcion cierra:</strong> {new Date(tournament.registration_closes).toLocaleString()}</div>
          {tournament.registration_fee > 0 && <div><strong>Costo:</strong> ${tournament.registration_fee}</div>}
          <div><strong>Participantes:</strong> {tournament.participant_count}</div>
          <div><strong>Pruebas:</strong> {tournament.event_count}</div>
          <div><strong>Pecheras numeradas:</strong> {tournament.use_bibs ? 'Si' : 'No'}</div>
          {tournament.max_participants && <div><strong>Max. Participantes:</strong> {tournament.max_participants}</div>}
        </div>
      </div>

      {isManager && (
        <div className="form-card">
          <h3>Configuracion</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Max. Pruebas por Atleta</label>
              <input type="number" min="1" value={tournament.max_events_per_athlete || ''}
                onChange={(e) => handleUpdateField('max_events_per_athlete', parseInt(e.target.value) || null)} />
            </div>
<div className="form-group">
            <label>Juez Principal del Torneo</label>
            <select value={tournament.head_judge || ''}
              onChange={(e) => handleUpdateField('head_judge', e.target.value || null)}>
              <option value="">Sin asignar</option>
              {[...headJudges, ...judges].map(j => (
                <option key={j.id} value={j.id}>{j.first_name} {j.last_name} ({j.role_display})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={tournament.use_bibs !== false}
                onChange={(e) => handleUpdateField('use_bibs', e.target.checked)}
              />
              Usar pecheras numeradas (dorsales)
            </label>
            <small>Si esta desactivado, el torneo no genera pecheras ni las muestra en listas y resultados.</small>
          </div>
        </div>
          <div className="form-group">
            <label>Estado</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`badge badge-${tournament.status}`}>{statusLabels[tournament.status]}</span>
              {statusTransitions[tournament.status] && (
                <select onChange={(e) => e.target.value && handleStatusChange(e.target.value)} defaultValue="">
                  <option value="" disabled>Cambiar estado...</option>
                  {statusTransitions[tournament.status].map(s => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {updateMsg && <p style={{ color: 'var(--success)' }}>{updateMsg}</p>}
        </div>
      )}

      <div className="detail-section">
        <h2>Tipos de Prueba</h2>
        {isManager ? (
          <div className="checkbox-group">
            {disciplines.map(d => (
              <label key={d.id}>
                <input
                  type="checkbox"
                  checked={tournament.disciplines?.includes(d.id) || false}
                  onChange={(e) => {
                    const current = tournament.disciplines || [];
                    const updated = e.target.checked
                      ? [...current, d.id]
                      : current.filter(id => id !== d.id);
                    handleUpdateField('disciplines', updated);
                  }}
                />
                {d.name}
              </label>
            ))}
          </div>
        ) : (
          <div className="tags">
            {tournament.disciplines_list?.map((d, i) => <span key={i} className="tag">{d}</span>)}
          </div>
        )}
      </div>
      <div className="detail-section">
        <h2>Sexos</h2>
        {isManager ? (
          <div className="checkbox-group">
            {sexes.map(s => (
              <label key={s.id}>
                <input
                  type="checkbox"
                  checked={tournament.sexes?.includes(s.id) || false}
                  onChange={(e) => {
                    const current = tournament.sexes || [];
                    const updated = e.target.checked
                      ? [...current, s.id]
                      : current.filter(id => id !== s.id);
                    handleUpdateField('sexes', updated);
                  }}
                />
                {s.name}
              </label>
            ))}
          </div>
        ) : (
          <div className="tags">
            {tournament.sexes_list?.map((s, i) => <span key={i} className="tag">{s}</span>)}
          </div>
        )}
      </div>
      <div className="detail-section">
        <h2>Categorias</h2>
        {isManager ? (
          <div className="checkbox-group">
            {categories.map(c => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={tournament.categories?.includes(c.id) || false}
                  onChange={(e) => {
                    const current = tournament.categories || [];
                    const updated = e.target.checked
                      ? [...current, c.id]
                      : current.filter(id => id !== c.id);
                    handleUpdateField('categories', updated);
                  }}
                />
                {c.name}
              </label>
            ))}
          </div>
        ) : (
          <div className="tags">
            {tournament.categories_list?.map((c, i) => <span key={i} className="tag">{c}</span>)}
          </div>
        )}
      </div>
      <div className="detail-section">
        <h2>Clasificaciones Funcionales</h2>
        {isManager ? (
          <div className="checkbox-group">
            {classifications.map(cl => (
              <label key={cl.id}>
                <input
                  type="checkbox"
                  checked={tournament.functional_classifications?.includes(cl.id) || false}
                  onChange={(e) => {
                    const current = tournament.functional_classifications || [];
                    const updated = e.target.checked
                      ? [...current, cl.id]
                      : current.filter(id => id !== cl.id);
                    handleUpdateField('functional_classifications', updated);
                  }}
                />
                {cl.code} - {cl.name}
              </label>
            ))}
          </div>
        ) : (
          <div className="tags">
            {tournament.functional_classifications_list?.map((c, i) => <span key={i} className="tag">{c}</span>)}
          </div>
        )}
      </div>
    </div>
  );

  const renderEventsTab = () => {
    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Link to={`/dashboard/tournaments/${id}/events`} className="btn-primary">
            Gestionar Pruebas (vista completa)
          </Link>
        </div>

        <h2>Pruebas ({events.length})</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Prueba</th>
              <th>Disciplina</th>
              <th>Sexo</th>
              <th>Categoria</th>
              <th>Clasif.</th>
              <th>Fecha/Hora</th>
              <th>Estado</th>
              <th>Inscriptos</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td><strong>{e.name}</strong></td>
                <td>{e.event_type_name}</td>
                <td>{e.sex_name || (e.sexes_names?.join(', ') || 'Multiple')}</td>
                <td>{e.category_name || (e.categories_names?.join(', ') || 'Multiple')}</td>
                <td>{e.classifications_list?.join(', ') || e.classification_code || 'Libre'}</td>
                <td>
                  {e.scheduled_date ? new Date(e.scheduled_date).toLocaleDateString() : '-'}
                  {e.call_time ? ` Camara: ${e.call_time}` : ''}
                  {e.scheduled_time ? ` Prueba: ${e.scheduled_time}` : ''}
                </td>
                <td><span className={`badge badge-${e.status}`}>{statusLabels[e.status] || e.status}</span></td>
                <td>
                  <button className="btn-sm" onClick={() => {
                    if (showEventAthletes === e.id) {
                      setShowEventAthletes(null);
                    } else {
                      setShowEventAthletes(e.id);
                      if (!eventAthletes[e.id]) loadEventAthletes(e.id);
                    }
                  }}>
                    {showEventAthletes === e.id ? 'Ocultar' : `Ver (${eventAthletes[e.id]?.length ?? e.athlete_count ?? 0})`}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <p>No hay pruebas. Usa "Gestionar Pruebas" para crearlas.</p>}

        {showEventAthletes && eventAthletes[showEventAthletes]?.length > 0 && (
          <div className="form-card" style={{ marginTop: '1rem' }}>
            <h4>Inscriptos en: {events.find(e => e.id === showEventAthletes)?.name}</h4>
            <table className="data-table">
              <thead>
                <tr><th>Atleta</th><th>Sexo</th><th>Clasif.</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {eventAthletes[showEventAthletes].map(r => (
                  <tr key={r.id}>
                    <td>{r.athlete_name || 'Atleta'}</td>
                    <td>{r.sex_name || '-'}</td>
                    <td>{r.classification_code || '-'}</td>
                    <td><span className={`badge badge-${r.status || 'pending'}`}>{r.status || 'Pendiente'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderRegistrationsTab = () => {
    const handleApprove = async (regId) => {
      try {
        await competitionApi.approveRegistration(regId);
        const res = await competitionApi.getRegistrations({ tournament: id });
        setRegistrations(res.data.results || res.data);
        setUpdateMsg('Inscripcion aprobada');
      } catch (err) {
        alert('Error al aprobar');
      }
    };
    const handleReject = async (regId) => {
      try {
        await competitionApi.rejectRegistration(regId);
        const res = await competitionApi.getRegistrations({ tournament: id });
        setRegistrations(res.data.results || res.data);
        setUpdateMsg('Inscripcion rechazada');
      } catch (err) {
        alert('Error al rechazar');
      }
    };

    const pending = registrations.filter(r => r.status === 'pending');
    const approved = registrations.filter(r => r.status === 'approved');
    const rejected = registrations.filter(r => r.status === 'rejected');

    return (
      <div>
        {updateMsg && <p style={{ color: 'var(--success)' }}>{updateMsg}</p>}
        <div className="info-grid" style={{ marginBottom: '1rem' }}>
          <div><strong>Pendientes:</strong> {pending.length}</div>
          <div><strong>Aprobadas:</strong> {approved.length}</div>
          <div><strong>Rechazadas:</strong> {rejected.length}</div>
        </div>

        {pending.length > 0 && (
          <div className="detail-section">
            <h3>Pendientes ({pending.length})</h3>
            <table className="data-table">
              <thead>
                <tr><th>Atleta</th><th>Institucion</th><th>Registrado por</th><th>Pago</th><th>Cert. Medico</th><th>Comprobante Pago</th><th>Fecha</th><th>Accion</th></tr>
              </thead>
              <tbody>
                {pending.map(r => (
                  <tr key={r.id}>
                    <td>{r.athlete_name || r.athlete}</td>
                    <td>{r.institution_name || '-'}</td>
                    <td>{r.registered_by_name || '-'}</td>
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
                      <button className="btn-sm btn-danger" onClick={() => handleReject(r.id)}>Rechazar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {approved.length > 0 && (
          <div className="detail-section">
            <h3>Aprobadas ({approved.length})</h3>
            <table className="data-table">
              <thead>
                <tr><th>Atleta</th><th>Institucion</th><th>Registrado por</th></tr>
              </thead>
              <tbody>
                {approved.map(r => (
                  <tr key={r.id}>
                    <td>{r.athlete_name || r.athlete}</td>
                    <td>{r.institution_name || '-'}</td>
                    <td>{r.registered_by_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {registrations.length === 0 && <p>No hay inscripciones todavia.</p>}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{tournament.name}</h1>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            <span className={`badge badge-${tournament.status}`}>{statusLabels[tournament.status]}</span>
            {' '}{tournament.city} - {tournament.participant_count} participantes, {tournament.event_count} pruebas
          </p>
        </div>
        <Link to={`/tournaments/${id}`} className="btn-secondary">Ver Pagina Publica</Link>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
        {TABS.map(tab => (
          <button key={tab.key}
            className={activeTab === tab.key ? 'btn-primary' : 'btn-sm'}
            onClick={() => { setActiveTab(tab.key); setUpdateMsg(''); }}
            style={{ padding: '0.5rem 1rem' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && renderInfoTab()}
      {activeTab === 'events' && renderEventsTab()}
      {activeTab === 'registrations' && renderRegistrationsTab()}
      {activeTab === 'judges' && (
        <JudgesTab
          tournament={tournament} events={events} judges={judges} headJudges={headJudges}
          handleUpdateField={handleUpdateField} updateMsg={updateMsg} setUpdateMsg={setUpdateMsg}
        />
      )}
      {activeTab === 'schedule' && (
        <ScheduleTab
          tournament={tournament} events={events} eventAthletes={eventAthletes}
          setUpdateMsg={setUpdateMsg}
        />
      )}
      {activeTab === 'results' && (
        <ResultsTab
          tournament={tournament} events={events}
          setUpdateMsg={setUpdateMsg}
        />
      )}
    </div>
  );
};

export default TournamentDetailDashboard;
