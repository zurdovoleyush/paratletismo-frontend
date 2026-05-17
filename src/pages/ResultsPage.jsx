import { useState, useEffect } from 'react';
import { competitionApi } from '../api';

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    competitionApi.getMyRegistrations()
      .then(res => {
        const regs = res.data.results || res.data;
        if (regs.length > 0) {
          competitionApi.getFinalResults({ tournament: regs[0].tournament })
            .then(r => setResults(r.data.results || r.data))
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="page">
      <h1>Resultados</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>Prueba</th>
            <th>Atleta</th>
            <th>Clasificacion</th>
            <th>Puesto</th>
            <th>Marca</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id}>
              <td>{r.tournament_event_name}</td>
              <td>{r.athlete_name}</td>
              <td>{r.classification || '-'}</td>
              <td>{r.rank || (r.is_dnf ? 'DNF' : r.is_dns ? 'DNS' : r.is_dq ? 'DQ' : '-')}</td>
              <td>{r.best_mark || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {results.length === 0 && <p>No hay resultados disponibles</p>}
    </div>
  );
};

export default ResultsPage;
