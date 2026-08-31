import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { competitionApi } from '../api';
import { formatMark, effClassCode, medalOf } from '../utils/marks';

const PublicAthleteProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [bests, setBests] = useState(null);
  const [loading, setLoading] = useState(true);

  const cleanEventName = (r) => {
    const raw = (r.event_name || '').trim();
    const known = [r.sex_name, r.category_name]
      .filter(p => p && p !== 'Multiple')
      .map(p => String(p).trim().toLowerCase());
    const parts = raw
      .split('-')
      .map(s => s.trim())
      .filter(s => s && !known.includes(s.toLowerCase()));
    const name = parts.join(' - ');
    const cap = x => x.replace(/\b\w/g, c => c.toUpperCase());
    const extra = known.filter(k => !raw.toLowerCase().includes(k)).map(cap);
    const sex = String(r.sex_name || '').trim().toLowerCase();
    const sexShort = ['fem', 'femenino', 'female', 'f'].includes(sex) ? 'Fem'
      : ['masc', 'masculino', 'male', 'm'].includes(sex) ? 'Masc'
      : ['mixto', 'mixed'].includes(sex) ? 'Mixto' : '';
    return { name, extra, sexShort };
  };

  useEffect(() => {
    setLoading(true);
    competitionApi.getAthletePublicHistory(id)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    competitionApi.getAthleteBestMarks(id)
      .then(res => setBests(res.data.bests || []))
      .catch(() => setBests([]));
  }, [id]);

  return (
    <div className="public-page">
      <header className="public-header">
        <h1>Paratletismo - Historial del Atleta</h1>
        <nav className="public-nav">
          <Link to="/records" className="nav-btn">🥇 Records</Link>
          <Link to="/tournaments" className="nav-btn">Torneos</Link>
          <Link to="/results/finalizados" className="nav-btn">Resultados</Link>
          <Link to="/login" className="nav-btn nav-btn-primary">Iniciar Sesion</Link>
          <Link to="/register" className="nav-link-plain">Registrarse</Link>
        </nav>
      </header>
      <main className="public-content">
        {loading ? (
          <p>Cargando...</p>
        ) : !data ? (
          <p>No se pudo cargar el historial del atleta</p>
        ) : (
          <>
            <h2>{data.athlete_name}</h2>
            <p className="tournament-location">
              {data.institution && <> {data.institution}</>}
              {data.classification && <> · Clasif. {data.classification}</>}
            </p>

            {bests && bests.length > 0 && (
              <div className="profile-card best-card">
                <h2>🥇 Mejores Marcas Personales</h2>
                <p className="tournament-location">Mejor marca en cada disciplina donde participo, con su posicion en los records.</p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Disciplina</th>
                      <th>Sexo</th>
                      <th>Categoria</th>
                      <th>Clasif.</th>
                      <th>Marca</th>
                      <th>Torneo</th>
                      <th>Anio</th>
                      <th>Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bests.map((b, i) => (
                      <tr key={i} className={`record-row record-${b.rank <= 3 ? b.rank : 'best'}`}>
                        <td><strong>{b.event_type_name}</strong></td>
                        <td>{b.sex_name}</td>
                        <td>{b.category_name}</td>
                        <td>{effClassCode(b.is_time_based, null, b.class_codes[0]) || '-'}</td>
                        <td>
                          <strong>{formatMark(b)}</strong>
                          {(b.wind !== null && b.wind !== undefined) && <span className="hint"> ({Number(b.wind).toFixed(1)} m/s)</span>}
                        </td>
<td className="hint">{b.tournament_name}</td>
                      <td className="hint">{b.tournament_date ? new Date(b.tournament_date).getFullYear() : '-'}</td>
                      <td>{b.rank ? `${medalOf(b.rank)} ${b.rank}° de ${b.total}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.results.length === 0 ? (
              <p>Sin resultados registrados en torneos publicos.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Torneo</th>
                    <th>Fecha</th>
                    <th>Prueba</th>
                    <th>Marca</th>
                    <th>Viento</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r, i) => {
                    const { name, extra, sexShort } = cleanEventName(r);
                    return (
                    <tr key={i} className={r.rank <= 3 ? 'top3' : ''}>
                      <td>{r.tournament_name}</td>
                      <td>{r.tournament_date ? new Date(r.tournament_date).toLocaleDateString() : '-'}</td>
                      <td>
                        {name}
                        {sexShort && <> · {sexShort}</>}
                        {extra.length > 0 && <> · {extra.join(' · ')}</>}
                      </td>
                      <td>{r.is_dnf ? 'DNF' : r.is_dns ? 'DNS' : r.is_dq ? 'DQ' : (r.best_mark || '-')}</td>
                      <td>{r.wind !== null && r.wind !== undefined ? `${Number(r.wind).toFixed(1)} m/s` : '-'}</td>
                      <td>{r.rank ? (r.rank <= 3 ? `#${r.rank}` : r.rank) : '-'}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PublicAthleteProfile;