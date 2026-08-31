import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { competitionApi, readBlobError } from '../api';

const ResultsPage = () => {
  const { user } = useAuth();
  const [myAssignments, setMyAssignments] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [athleteEvents, setAthleteEvents] = useState([]);
  const [resultEntries, setResultEntries] = useState({});
  const [existingResults, setExistingResults] = useState({});
  const [finalResults, setFinalResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('results');
  const [laneMode, setLaneMode] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'judge' || user.role === 'head_judge')) {
      competitionApi.getMyJudgeAssignments()
        .then(res => setMyAssignments(res.data.results || res.data))
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  const loadAthleteEvents = async (eventId) => {
    try {
      const res = await competitionApi.getLaneAssignments(eventId);
      const events = res.data.athlete_events || [];
      if (events.length === 0) {
        const res2 = await competitionApi.getAthleteEvents(eventId);
        const events2 = res2.data.results || res2.data;
        setAthleteEvents(events2);
      } else {
        setAthleteEvents(events);
      }
      setSelectedEventId(eventId);
      setResultEntries({});
      setExistingResults({});
    } catch (err) {
      alert('Error al cargar atletas');
    }
  };

  const loadExistingResults = async (eventId) => {
    try {
      const res = await competitionApi.getResults({});
      const allResults = res.data.results || res.data;
      const eventAthleteIds = athleteEvents.map(ae => ae.id);
      const filtered = allResults.filter(r => eventAthleteIds.includes(r.athlete_event));
      const grouped = {};
      filtered.forEach(r => {
        if (!grouped[r.athlete_event]) grouped[r.athlete_event] = [];
        grouped[r.athlete_event].push(r);
      });
      setExistingResults(grouped);
    } catch (err) {}
  };

  useEffect(() => {
    if (selectedEventId && athleteEvents.length > 0) {
      loadExistingResults(selectedEventId);
    }
  }, [selectedEventId, athleteEvents]);

  const handleResultChange = (athleteEventId, field, value) => {
    setResultEntries(prev => ({
      ...prev,
      [athleteEventId]: { ...prev[athleteEventId], [field]: value },
    }));
  };

  const handleSubmitAll = async () => {
    const results = Object.entries(resultEntries)
      .filter(([_, data]) => data.value || data.mark)
      .map(([athleteEventId, data]) => ({
        athlete_event: athleteEventId,
        attempt_number: data.attempt_number || 1,
        value: data.value || null,
        mark: data.mark || '',
        is_valid: data.is_valid !== undefined ? data.is_valid : true,
        wind: data.wind || null,
        notes: data.notes || '',
      }));

    if (results.length === 0) {
      alert('Ingresa al menos un resultado');
      return;
    }

    try {
      const res = await competitionApi.createBulkResults(selectedEventId, { results });
      alert(`${res.data.message || 'Resultados guardados'}`);
      setResultEntries({});
      loadExistingResults(selectedEventId);
    } catch (err) {
      alert('Error al guardar resultados');
    }
  };

  const loadFinalResults = async () => {
    if (!selectedEventId) return;
    try {
      const res = await competitionApi.getFinalResults({ tournament_event: selectedEventId });
      setFinalResults(res.data.results || res.data);
    } catch (err) {
      alert('Error al cargar resultados finales');
    }
  };

  const handleCalculateFinal = async () => {
    if (!selectedEventId) return;
    try {
      const res = await competitionApi.calculateFinalResults({ tournament_event: selectedEventId });
      alert(res.data.message || 'Posiciones finales calculadas');
      loadFinalResults();
    } catch (err) {
      alert('Error al calcular');
    }
  };

  const handleDownloadFinalList = async () => {
    if (!selectedEventId) return;
    try {
      await competitionApi.getEventFinalList(selectedEventId);
    } catch (err) {
      alert(await readBlobError(err));
    }
  };

  const sortedAthletes = [...athleteEvents].sort((a, b) => {
    if (laneMode) return (a.lane || 999) - (b.lane || 999);
    return (a.bib_number || 0) - (b.bib_number || 0);
  });

  if (loading) return <p>Cargando...</p>;

  const isJudge = user?.role === 'judge' || user?.role === 'head_judge';

  return (
    <div className="page">
      <div className="page-header">
        <h1>Resultados</h1>
        {isJudge && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn-sm ${mode === 'judge' ? 'btn-primary' : ''}`} onClick={() => setMode('judge')}>
              Cargar Resultados
            </button>
            <button className={`btn-sm ${mode === 'results' ? 'btn-primary' : ''}`} onClick={() => setMode('results')}>
              Ver Resultados
            </button>
          </div>
        )}
      </div>

      {mode === 'judge' && isJudge && (
        <>
          <div className="form-card">
            <h3>Mis Pruebas Asignadas</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Seleccionar prueba</label>
                <select value={selectedEventId} onChange={(e) => loadAthleteEvents(e.target.value)}>
                  <option value="">Seleccionar</option>
                  {myAssignments.map(a => (
                    <option key={a.id} value={a.tournament_event}>
                      {a.tournament_event_name} - {a.is_head ? 'Principal' : 'Juez'}
                    </option>
                  ))}
                </select>
              </div>
              {selectedEventId && athleteEvents.some(ae => ae.lane) && (
                <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                  <label>
                    <input type="checkbox" checked={laneMode} onChange={(e) => setLaneMode(e.target.checked)} />
                    {' '}Ordenar por carril
                  </label>
                </div>
              )}
            </div>
          </div>

          {selectedEventId && sortedAthletes.length > 0 && (
            <div className="form-card">
              <h3>Ingresar Resultados {laneMode ? '(por Carril)' : ''}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {laneMode && <th>Carril</th>}
                      <th>Atleta</th>
                      <th>Intento</th>
                      <th>Tiempo / Valor</th>
                      <th>Marca (ej: 1:23.45)</th>
                      <th>Valido</th>
                      <th>Viento</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAthletes.map(ae => {
                      const existing = existingResults[ae.id] || [];
                      const lastAttempt = existing.length > 0
                        ? Math.max(...existing.map(r => r.attempt_number))
                        : 0;
                      return (
                        <tr key={ae.id} className={ae.status === 'withdrawn' ? 'row-withdrawn' : ''}>
                          {laneMode && <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{ae.lane || '-'}</td>}
                          <td>
                            {ae.athlete_name}
                            {ae.classification_code && <span className="badge" style={{ marginLeft: '0.5rem' }}>{ae.classification_code}</span>}
                          </td>
                          <td>
                            <input type="number" min="1" size="3"
                              value={resultEntries[ae.id]?.attempt_number || lastAttempt + 1}
                              onChange={(e) => handleResultChange(ae.id, 'attempt_number', parseInt(e.target.value))}
                              disabled={ae.status === 'withdrawn'} />
                            {existing.length > 0 && <span className="hint"> (ult: {lastAttempt})</span>}
                          </td>
                          <td>
                            <input type="text" size="8" placeholder="ej: 10.45"
                              value={resultEntries[ae.id]?.value || ''}
                              onChange={(e) => handleResultChange(ae.id, 'value', e.target.value)}
                              disabled={ae.status === 'withdrawn'} />
                          </td>
                          <td>
                            <input type="text" size="10" placeholder="ej: 1:23.45"
                              value={resultEntries[ae.id]?.mark || ''}
                              onChange={(e) => handleResultChange(ae.id, 'mark', e.target.value)}
                              disabled={ae.status === 'withdrawn'} />
                          </td>
                          <td>
                            <input type="checkbox"
                              checked={resultEntries[ae.id]?.is_valid !== false}
                              onChange={(e) => handleResultChange(ae.id, 'is_valid', e.target.checked)}
                              disabled={ae.status === 'withdrawn'} />
                          </td>
                          <td>
                            <input type="text" size="5" placeholder="0.0"
                              value={resultEntries[ae.id]?.wind || ''}
                              onChange={(e) => handleResultChange(ae.id, 'wind', e.target.value)}
                              disabled={ae.status === 'withdrawn'} />
                          </td>
                          <td>
                            <input type="text" size="8"
                              value={resultEntries[ae.id]?.notes || ''}
                              onChange={(e) => handleResultChange(ae.id, 'notes', e.target.value)}
                              disabled={ae.status === 'withdrawn'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={handleSubmitAll}>
                  Guardar Todos los Resultados
                </button>
                <button className="btn-primary" onClick={handleCalculateFinal}>
                  Calcular Posiciones Finales
                </button>
                <button className="btn-primary" onClick={handleDownloadFinalList}>
                  FinalList PDF
                </button>
                <button className="btn-sm" onClick={loadFinalResults}>
                  Actualizar Resultados Finales
                </button>
              </div>
            </div>
          )}

          {selectedEventId && finalResults.length > 0 && (
            <div className="form-card">
              <h3>Posiciones Finales</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Atleta</th>
                    <th>Clasif.</th>
                    <th>Mejor Marca</th>
                    <th>Puntos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {finalResults.map(fr => (
                    <tr key={fr.id} className={fr.rank <= 3 ? 'top3' : ''}>
                      <td><strong>{fr.rank || '-'}</strong></td>
                      <td>{fr.athlete_name}</td>
                      <td>{fr.classification || '-'}</td>
                      <td>{fr.best_mark || '-'}</td>
                      <td>{fr.points || '-'}</td>
                      <td>
                        {fr.is_dnf ? 'DNF' : fr.is_dns ? 'DNS' : fr.is_dq ? 'DQ' : 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedEventId && sortedAthletes.length === 0 && (
            <p>No hay atletas inscriptos en esta prueba</p>
          )}
        </>
      )}

      {mode === 'results' && (
        <div className="form-card">
          <h3>Resultados por Prueba</h3>
          <div className="form-group">
            <label>Seleccionar prueba</label>
            {isJudge ? (
              <select value={selectedEventId} onChange={(e) => { setSelectedEventId(e.target.value); }}>
                <option value="">Seleccionar</option>
                {myAssignments.map(a => (
                  <option key={a.id} value={a.tournament_event}>{a.tournament_event_name}</option>
                ))}
              </select>
            ) : (
              <input type="text" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}
                placeholder="UUID de la prueba" style={{ width: '100%' }} />
            )}
          </div>
          <button className="btn-sm" onClick={loadFinalResults}>Cargar Resultados Finales</button>
          <button className="btn-sm" onClick={handleDownloadFinalList} disabled={!selectedEventId}>FinalList PDF</button>

          {finalResults.length > 0 && (
            <table className="data-table" style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Atleta</th>
                  <th>Clasif.</th>
                  <th>Marca</th>
                  <th>Puntos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {finalResults.map(fr => (
                  <tr key={fr.id} className={fr.rank <= 3 ? 'top3' : ''}>
                    <td><strong>{fr.rank || '-'}</strong></td>
                    <td>{fr.athlete_name}</td>
                    <td>{fr.classification || '-'}</td>
                    <td>{fr.best_mark || '-'}</td>
                    <td>{fr.points || '-'}</td>
                    <td>
                      {fr.is_dnf ? 'DNF' : fr.is_dns ? 'DNS' : fr.is_dq ? 'DQ' : 'OK'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {finalResults.length === 0 && selectedEventId && <p>No hay resultados para esta prueba</p>}
        </div>
      )}

      {!isJudge && mode === 'results' && finalResults.length === 0 && !selectedEventId && (
        <p>Selecciona una prueba para ver los resultados finales.</p>
      )}
    </div>
  );
};

export default ResultsPage;
