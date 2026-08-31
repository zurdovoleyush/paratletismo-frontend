import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { competitionApi } from '../api';
import { formatMark, effClassCode, medalOf } from '../utils/marks';

const DEFAULT_FILTERS = { discipline: 'all', sex: 'all', category: 'all', classification: 'all', top: '3' };

const Records = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(DEFAULT_FILTERS);

  const loadRecords = (f) => {
    setLoading(true);
    const params = {};
    if (f.discipline && f.discipline !== 'all') params.discipline = f.discipline;
    if (f.sex && f.sex !== 'all') params.sex = f.sex;
    if (f.category && f.category !== 'all') params.category = f.category;
    if (f.classification && f.classification !== 'all') params.classification = f.classification;
    if (f.top && f.top !== 'all') params.top = f.top;
    competitionApi.getRecords(params)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRecords(DEFAULT_FILTERS); }, []);

  const applyFilters = (e) => {
    e.preventDefault();
    setFilters({ ...showFilters });
    loadRecords({ ...showFilters });
  };

  const clearFilters = () => {
    setShowFilters({ ...DEFAULT_FILTERS });
    setFilters({ ...DEFAULT_FILTERS });
    loadRecords({ ...DEFAULT_FILTERS });
  };

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && v !== 'all').map(([k]) => k);

  return (
    <div className="public-page">
      <header className="public-header">
        <div>
          <h1>🏅 Paratletismo - Records</h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
            Mejores marcas por disciplina, categoria, sexo y clasificacion funcional
          </p>
        </div>
        <nav className="public-nav">
          <Link to="/tournaments" className="nav-btn">Torneos</Link>
          <Link to="/results/en-curso" className="nav-btn">En Curso</Link>
          <Link to="/results/finalizados" className="nav-btn">Finalizados</Link>
          <Link to="/login" className="nav-btn nav-btn-primary">Iniciar Sesion</Link>
          <Link to="/register" className="nav-link-plain">Registrarse</Link>
        </nav>
      </header>
      <main className="public-content">
        <form className="results-filters records-filters" onSubmit={applyFilters}>
          <div>
            <label>Disciplina</label>
            <select value={showFilters.discipline} onChange={e => setShowFilters(s => ({ ...s, discipline: e.target.value }))}>
              <option value="all">Todas</option>
              {(data?.filters?.disciplines || []).map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Sexo</label>
            <select value={showFilters.sex} onChange={e => setShowFilters(s => ({ ...s, sex: e.target.value }))}>
              <option value="all">Todos</option>
              {(data?.filters?.sexes || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Categoria</label>
            <select value={showFilters.category} onChange={e => setShowFilters(s => ({ ...s, category: e.target.value }))}>
              <option value="all">Todas</option>
              {(data?.filters?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Clasificacion Funcional</label>
            <select value={showFilters.classification} onChange={e => setShowFilters(s => ({ ...s, classification: e.target.value }))}>
              <option value="all">Todas</option>
              {(data?.filters?.classifications || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Cuanto mostramos</label>
            <select value={showFilters.top} onChange={e => setShowFilters(s => ({ ...s, top: e.target.value }))}>
              <option value="3">Top 3</option>
              <option value="5">Top 5</option>
              <option value="8">Top 8</option>
            </select>
          </div>
          <div className="records-filters-actions">
            <button type="submit" className="btn-primary">Filtrar</button>
            {activeFilters.length > 0 && (
              <button type="button" className="btn-secondary" onClick={clearFilters}>Limpiar</button>
            )}
          </div>
        </form>

        {loading ? (
          <p>Cargando records...</p>
        ) : !data || data.groups.length === 0 ? (
          <p>No hay records registrados aun. Los records aparecen cuando se cargan resultados numericos de torneos publicos.</p>
        ) : (
          <>
            <p className="tournament-location">
              {data.groups.length} {data.groups.length === 1 ? 'record registrado' : 'records registrados'} en torneos publicos.
            </p>
            <div className="records-grid">
              {data.groups.map(g => (
                <div key={g.key} className="record-card">
                  <div className="record-card-header">
                    <h3>{g.event_type_name}</h3>
                    <div className="record-card-tags">
                      {g.sex_name && <span className="tag tag-sex">{g.sex_name}</span>}
                      {g.category_name && <span className="tag">{g.category_name}</span>}
                      {g.class_codes.map(c => (
                        <span key={c} className="tag tag-class">{(g.is_time_based ? 'T' : 'F') + c.slice(1)}</span>
                      ))}
                    </div>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Atleta</th>
                        <th>Clasif.</th>
                        <th>Marca</th>
                        <th>Institucion</th>
                        <th>Torneo</th>
                        <th>Anio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.top.map(t => {
                        const cls = effClassCode(g.is_time_based, t.classification, g.class_codes[0]);
                        return (
                          <tr key={t.athlete_id} className={`record-row record-${t.rank}`}>
                            <td className="record-pos">{medalOf(t.rank)}</td>
                            <td><Link to={`/atleta/${t.athlete_id}`}>{t.athlete_name}</Link></td>
                            <td>{cls || '-'}</td>
                            <td><strong>{formatMark({ mark: t.mark, value: t.value, is_time_based: g.is_time_based, unit: g.unit })}</strong>
                              {t.wind !== null && t.wind !== undefined && <span className="hint"> ({Number(t.wind).toFixed(1)} m/s)</span>}
                            </td>
                            <td className="hint">{t.institution || '-'}</td>
                            <td className="hint">{t.tournament_name || '-'}</td>
                            <td className="hint">{t.tournament_date ? new Date(t.tournament_date).getFullYear() : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {g.total > g.top.length && (
                    <p className="hint record-more">y {g.total - g.top.length} mas de {g.total} atletas</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Records;