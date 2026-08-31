import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { tournamentApi, competitionApi } from '../api';

const STATUS_CONFIG = {
  'en-curso': { backend: 'in_progress', label: 'En Curso' },
  'finalizados': { backend: 'completed', label: 'Finalizados' },
};

const statusLabels = {
  in_progress: 'En Progreso',
  completed: 'Completado',
};

const cleanEventName = (e) => {
  const raw = (e.name || '').trim();
  const known = [e.sex_name, e.category_name]
    .filter(p => p && p !== 'Multiple')
    .map(p => String(p).trim().toLowerCase());
  const parts = raw
    .split('-')
    .map(s => s.trim())
    .filter(s => s && !known.includes(s.toLowerCase()));
  const name = parts.join(' - ');
  const cap = x => x.replace(/\b\w/g, c => c.toUpperCase());
  const extra = known.filter(k => !raw.toLowerCase().includes(k)).map(cap);
  const sex = String(e.sex_name || '').trim().toLowerCase();
  const sexShort = ['fem', 'femenino', 'female', 'f'].includes(sex) ? 'Fem'
    : ['masc', 'masculino', 'male', 'm'].includes(sex) ? 'Masc'
    : ['mixto', 'mixed'].includes(sex) ? 'Mixto' : '';
  return { name, extra, sexShort };
};

const PublicResults = () => {
  const { status } = useParams();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['en-curso'];
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsOpen, setResultsOpen] = useState({});
  const [resultsByTournament, setResultsByTournament] = useState({});
  const [loadingResults, setLoadingResults] = useState({});
  const [filters, setFilters] = useState({});

  const DEFAULT_FILTERS = { discipline: 'all', sex: 'all', classification: 'all', category: 'all' };

  const updateFilter = (tid, key, value) =>
    setFilters(prev => ({ ...prev, [tid]: { ...DEFAULT_FILTERS, ...prev[tid], [key]: value } }));

  const effClass = (e, fr) =>
    e.is_track && String(fr.classification || '').startsWith('F')
      ? 'T' + fr.classification.slice(1)
      : (fr.classification || '');

  useEffect(() => {
    setLoading(true);
    setTournaments([]);
    setResultsOpen({});
    setResultsByTournament({});
    tournamentApi.getTournaments({ status: cfg.backend })
      .then(res => setTournaments(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const toggleResults = async (t) => {
    const id = t.id;
    const willOpen = !resultsOpen[id];
    setResultsOpen(prev => ({ ...prev, [id]: willOpen }));
    if (willOpen && !resultsByTournament[id]) {
      setLoadingResults(prev => ({ ...prev, [id]: true }));
      try {
        const res = await competitionApi.getTournamentPublicResults(id);
        setResultsByTournament(prev => ({ ...prev, [id]: res.data }));
      } catch (err) {
        alert('No se pudieron cargar los resultados');
      } finally {
        setLoadingResults(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  return (
    <div className="public-page">
      <header className="public-header">
        <h1>🏅 Paratletismo - Resultados</h1>
        <nav className="public-nav">
          <Link to="/records" className="nav-btn">🥇 Records</Link>
          <Link to="/tournaments" className="nav-btn">Torneos</Link>
          <Link to={`/results/${status === 'en-curso' ? 'finalizados' : 'en-curso'}`} className="nav-btn">
            Ver {status === 'en-curso' ? 'Finalizados' : 'En Curso'}
          </Link>
          <Link to="/login" className="nav-btn nav-btn-primary">Iniciar Sesion</Link>
          <Link to="/register" className="nav-link-plain">Registrarse</Link>
        </nav>
      </header>
      <main className="public-content">
        <h2>Resultados de Torneos {cfg.label}</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : tournaments.length === 0 ? (
          <p>No hay torneos {cfg.label.toLowerCase()} en este momento</p>
        ) : (
          <div className="tournament-grid">
            {tournaments.map(t => (
              <div key={t.id} className="tournament-card">
                <h3>{t.name}</h3>
                <p className="tournament-location">{t.city}, {t.province}</p>
                <p>{new Date(t.tournament_start).toLocaleDateString()} - {new Date(t.tournament_end).toLocaleDateString()}</p>
                <div className="tournament-status">
                  <span className={`badge badge-${t.status}`}>{statusLabels[t.status]}</span>
                  <button className="btn-sm" onClick={() => toggleResults(t)}>
                    {resultsOpen[t.id] ? 'Ocultar Resultados' : 'Ver Resultados'}
                  </button>
                </div>

                {resultsOpen[t.id] && (
                  <div style={{ marginTop: '1rem', overflow: 'auto' }}>
                    {loadingResults[t.id] ? (
                      <p>Cargando resultados...</p>
                    ) : resultsByTournament[t.id]?.events?.length ? (() => {
                      const evts = resultsByTournament[t.id].events;
                      const f = { ...DEFAULT_FILTERS, ...(filters[t.id] || {}) };
                      const disciplines = [...new Set(evts.map(e => e.event_type_name).filter(Boolean))].sort();
                      const sexes = [...new Set(evts.map(e => e.sex_name).filter(Boolean))].sort();
                      const categories = [...new Set([
                        ...evts.map(e => e.category_name).filter(Boolean),
                        ...(t.categories_list || []),
                      ])].filter(c => c !== 'Multiple').sort();
                      const classes = [...new Set([
                        ...evts.flatMap(e => (e.final_results || []).map(fr => effClass(e, fr)).filter(Boolean)),
                        ...evts.flatMap(e => e.functional_classifications || []),
                        ...(t.functional_classifications_list || []),
                      ])].sort();
                      const filtered = evts
                        .filter(e => f.discipline === 'all' || e.event_type_name === f.discipline)
                        .filter(e => f.sex === 'all' || e.sex_name === f.sex)
                        .filter(e => f.category === 'all' || (e.category_name && e.category_name === f.category))
                        .map(e => ({
                          ...e,
                          final_results: (e.final_results || []).filter(fr => f.classification === 'all' || effClass(e, fr) === f.classification),
                        }))
                        .filter(e => e.final_results.length > 0);
                      const shownMarks = filtered.reduce((acc, e) => acc + e.final_results.length, 0);
                      return (
                        <>
                          <div className="results-filters">
                            <div>
                              <label>Disciplina</label>
                              <select value={f.discipline} onChange={ev => updateFilter(t.id, 'discipline', ev.target.value)}>
                                <option value="all">Todas</option>
                                {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label>Sexo</label>
                              <select value={f.sex} onChange={ev => updateFilter(t.id, 'sex', ev.target.value)}>
                                <option value="all">Todos</option>
                                {sexes.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label>Categoria</label>
                              <select value={f.category} onChange={ev => updateFilter(t.id, 'category', ev.target.value)}>
                                <option value="all">Todas</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label>Clasificacion Funcional</label>
                              <select value={f.classification} onChange={ev => updateFilter(t.id, 'classification', ev.target.value)}>
                                <option value="all">Todas</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            {(filtered.length !== evts.length || shownMarks !== evts.reduce((acc, e) => acc + e.final_results.length, 0)) && (
                              <button className="btn-sm" onClick={() => setFilters(prev => ({ ...prev, [t.id]: { ...DEFAULT_FILTERS } }))}>
                                Limpiar Filtros
                              </button>
                            )}
                          </div>
                          {filtered.length === 0 ? (
                            <p>No hay resultados que coincidan con los filtros</p>
                          ) : (
                            filtered.map(e => {
                              const { name, extra, sexShort } = cleanEventName(e);
                              return (
                              <div key={e.id} className="detail-section" style={{ marginBottom: '1rem' }}>
                                <h4 style={{ marginBottom: '0.25rem' }}>{name}{sexShort && <span style={{ fontWeight: 'normal', fontSize: '0.85em' }}> · {sexShort}</span>}</h4>
                                <p className="tournament-location">
                                  {e.event_type_name}
                                  {extra.length > 0 && <> · {extra.join(' · ')}</>}
                                  {e.scheduled_date && <> · {new Date(e.scheduled_date).toLocaleDateString()}</>}
                                </p>
                                {e.final_results.length > 0 ? (
                                  <table className="data-table">
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Atleta</th>
                                        <th>Clasif.</th>
                                        <th>Marca</th>
                                        <th>Viento</th>
                                        <th>Puntos</th>
                                        <th>Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {e.final_results.map(fr => (
                                        <tr key={fr.id} className={fr.rank <= 3 ? 'top3' : ''}>
                                          <td>{fr.rank || '-'}</td>
                                          <td>{fr.athlete ? <Link to={`/atleta/${fr.athlete}`}>{fr.athlete_name}</Link> : fr.athlete_name}</td>
                                          <td>{effClass(e, fr) || '-'}</td>
                                          <td>{fr.best_mark || '-'}</td>
                                          <td>{(fr.wind !== null && fr.wind !== undefined) ? `${Number(fr.wind).toFixed(1)} m/s` : '-'}</td>
                                          <td>{fr.points || '-'}</td>
                                          <td>{fr.is_dnf ? 'DNF' : fr.is_dns ? 'DNS' : fr.is_dq ? 'DQ' : 'OK'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p>Sin resultados aun</p>
                                )}
                              </div>
                              );
                            })
                          )}
                        </>
                      );
                    })() : (
                      <p>No hay resultados disponibles para este torneo</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicResults;