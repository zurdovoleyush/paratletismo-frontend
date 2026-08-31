import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentApi } from '../api';

const TournamentPayments = () => {
  const [pending, setPending] = useState([]);
  const [paid, setPaid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ amount: '', notes: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendRes, paidRes] = await Promise.all([
        tournamentApi.getTournaments({ payment_status: 'pending' }),
        tournamentApi.getTournaments({ payment_status: 'paid' }),
      ]);
      const pend = pendRes.data?.results || pendRes.data || [];
      const pay = paidRes.data?.results || paidRes.data || [];
      setPending(pend);
      setPaid(pay);
    } catch (err) {
      console.error('Error cargando pagos de torneos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnable = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await tournamentApi.enableTournamentPayment(selected.id, {
        status: 'paid',
        amount: form.amount || null,
        notes: form.notes || '',
      });
      setSelected(null);
      setForm({ amount: '', notes: '' });
      loadData();
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al habilitar torneo: ' + err.message);
      }
    }
  };

  const handleRevert = async (t) => {
    if (!window.confirm(`Marcar "${t.name}" como pendiente de pago? Se volvera al estado Borrador y quedara oculto al publico.`)) return;
    try {
      await tournamentApi.enableTournamentPayment(t.id, { status: 'pending' });
      loadData();
    } catch (err) {
      alert('Error al revertir: ' + (err.response?.data?.detail || err.message));
    }
  };

  const renderRow = (t) => (
    <tr key={t.id}>
      <td><strong>{t.name}</strong></td>
      <td>{t.organizer_name}</td>
      <td>{t.city}, {t.province}</td>
      <td>{new Date(t.tournament_start).toLocaleDateString('es-AR')} - {new Date(t.tournament_end).toLocaleDateString('es-AR')}</td>
      <td>${t.registration_fee}</td>
      {t.payment_status === 'paid' ? (
        <td>{t.payment_amount != null ? `$${t.payment_amount}` : '-'}</td>
      ) : (
        <td className="text-muted">-</td>
      )}
      <td>
        <div className="action-buttons">
          {t.payment_status === 'pending' ? (
            <>
              <button className="btn-success" onClick={() => { setSelected(t); setForm({ amount: '', notes: '' }); }}>
                Habilitar
              </button>
              <Link to={`/dashboard/tournaments/${t.id}`} className="btn-sm">Administrar</Link>
            </>
          ) : (
            <>
              <span className="badge badge-success">Habilitado</span>
              <button className="btn-warning" onClick={() => handleRevert(t)}>Revertir</button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderTable = (list) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Torneo</th>
          <th>Organizador</th>
          <th>Lugar</th>
          <th>Fechas</th>
          <th>Inscripcion ($)</th>
          <th>Monto pagado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>{list.map(renderRow)}</tbody>
    </table>
  );

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pagos de Torneos</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn-sm ${tab === 'pending' ? 'btn-primary' : ''}`} onClick={() => setTab('pending')}>
          Por Habilitar ({pending.length})
        </button>
        <button className={`btn-sm ${tab === 'paid' ? 'btn-primary' : ''}`} onClick={() => setTab('paid')}>
          Habilitados ({paid.length})
        </button>
      </div>

      {tab === 'pending' && (
        pending.length === 0
          ? <p>No hay torneos pendientes de pago.</p>
          : renderTable(pending)
      )}
      {tab === 'paid' && (
        paid.length === 0
          ? <p>No hay torneos habilitados.</p>
          : renderTable(paid)
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Habilitar Torneo - {selected.name}</h2>
            <form onSubmit={handleEnable} className="form-card">
              <div className="form-group">
                <label>Monto del servicio ($)</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Observaciones</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Registrar Pago y Habilitar</button>
                <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: var(--bg-card); border-radius: 12px; padding: 24px; width: 90%; max-width: 500px;
        }
        .form-actions { display: flex; gap: 8px; margin-top: 16px; }
        .action-buttons { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .text-muted { color: var(--text-light); font-size: 0.85rem; }
        .badge-success { background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; }
        .btn-success { background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 4px 10px; }
        .btn-warning { background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 4px 10px; }
      `}</style>
    </div>
  );
};

export default TournamentPayments;
