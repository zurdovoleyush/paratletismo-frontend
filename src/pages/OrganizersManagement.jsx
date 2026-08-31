import { useState, useEffect } from 'react';
import { tournamentApi } from '../api';

const OrganizersManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInst, setSelectedInst] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', valid_from: '', valid_until: '', notes: '' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadData();
  }, [showInactive]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, payRes] = await Promise.all([
        tournamentApi.getManageInstitutions(showInactive),
        tournamentApi.getOrganizationPayments(),
      ]);
      setInstitutions(instRes.data?.results || instRes.data || []);
      setPayments(payRes.data?.results || payRes.data || []);
    } catch (err) {
      console.error('Error loading organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrganize = async (inst) => {
    const newVal = !inst.can_organize;
    try {
      const res = await tournamentApi.toggleOrganize(inst.id, { can_organize: newVal });
      setInstitutions(prev => prev.map(i => i.id === inst.id ? res.data : i));
    } catch (err) {
      alert('Error al actualizar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const toggleActive = async (inst) => {
    const newVal = !inst.is_active;
    try {
      const res = await tournamentApi.toggleOrganize(inst.id, { is_active: newVal });
      setInstitutions(prev => prev.map(i => i.id === inst.id ? res.data : i));
    } catch (err) {
      alert('Error al actualizar: ' + (err.response?.data?.detail || err.message));
    }
  };

  const updateOrganizedUntil = async (inst, date) => {
    try {
      const res = await tournamentApi.toggleOrganize(inst.id, { can_organize: inst.can_organize, organized_until: date || null });
      setInstitutions(prev => prev.map(i => i.id === inst.id ? res.data : i));
    } catch (err) {
      alert('Error al actualizar fecha: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInst) return;
    try {
      await tournamentApi.createOrganizationPayment({
        institution: selectedInst.id,
        amount: paymentForm.amount,
        valid_from: paymentForm.valid_from,
        valid_until: paymentForm.valid_until,
        notes: paymentForm.notes,
      });
      await tournamentApi.toggleOrganize(selectedInst.id, {
        can_organize: true,
        organized_until: paymentForm.valid_until,
      });
      setShowPaymentForm(false);
      setPaymentForm({ amount: '', valid_from: '', valid_until: '', notes: '' });
      loadData();
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al registrar pago: ' + err.message);
      }
    }
  };

  const instPayments = (instId) => payments.filter(p => p.institution === instId);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Gestion de Organizadores</h1>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
          />
          Mostrar instituciones inactivas
        </label>
      </div>

      {showPaymentForm && selectedInst && (
        <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Registrar Pago - {selectedInst.name}</h2>
            <form onSubmit={handlePaymentSubmit} className="form-card">
              <div className="form-group">
                <label>Monto *</label>
                <input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Vigencia desde *</label>
                  <input type="date" value={paymentForm.valid_from} onChange={e => setPaymentForm({ ...paymentForm, valid_from: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Vigencia hasta *</label>
                  <input type="date" value={paymentForm.valid_until} onChange={e => setPaymentForm({ ...paymentForm, valid_until: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Observaciones</label>
                <textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Registrar Pago y Activar</button>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Activa</th>
            <th>Institucion</th>
            <th>Contacto</th>
            <th>Puede Organizar</th>
            <th>Vigencia</th>
            <th>Pagos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {institutions.map(inst => (
            <tr key={inst.id} style={inst.is_active ? {} : { opacity: 0.5 }}>
              <td>
                <input
                  type="checkbox"
                  checked={inst.is_active}
                  onChange={() => toggleActive(inst)}
                  title={inst.is_active ? 'Desactivar institucion' : 'Activar institucion'}
                />
              </td>
              <td>
                <strong>{inst.name}</strong>
                {inst.short_name && <small> ({inst.short_name})</small>}
              </td>
              <td>
                {inst.email && <div>{inst.email}</div>}
                {inst.phone && <div>{inst.phone}</div>}
              </td>
              <td>
                <span className={`badge ${inst.can_organize ? 'badge-success' : 'badge-secondary'}`}>
                  {inst.can_organize ? 'SI' : 'NO'}
                </span>
              </td>
              <td>
                {inst.organized_until ? (
                  <span>{inst.organized_until}</span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td>
                {instPayments(inst.id).length > 0 ? (
                  <details>
                    <summary>{instPayments(inst.id).length} pago(s)</summary>
                    {instPayments(inst.id).map(p => (
                      <div key={p.id} className="payment-item">
                        ${p.amount} | {p.valid_from} a {p.valid_until}
                        {p.notes && <div className="text-muted">{p.notes}</div>}
                      </div>
                    ))}
                  </details>
                ) : (
                  <span className="text-muted">Sin pagos</span>
                )}
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className={inst.can_organize ? 'btn-warning' : 'btn-success'}
                    onClick={() => toggleOrganize(inst)}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    {inst.can_organize ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => { setSelectedInst(inst); setShowPaymentForm(true); }}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    Registrar Pago
                  </button>
                  <input
                    type="date"
                    value={inst.organized_until || ''}
                    onChange={e => updateOrganizedUntil(inst, e.target.value)}
                    style={{ width: '140px', fontSize: '0.8rem' }}
                    title="Vencimiento"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: var(--bg-card); border-radius: 12px; padding: 24px; width: 90%; max-width: 500px;
        }
        .form-actions { display: flex; gap: 8px; margin-top: 16px; }
        .action-buttons { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
        .payment-item { font-size: 0.8rem; padding: 4px 0; border-bottom: 1px solid var(--border-color); }
        .text-muted { color: var(--text-light); font-size: 0.8rem; }
        .badge-success { background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; }
        .badge-secondary { background: #95a5a6; color: white; padding: 2px 8px; border-radius: 4px; }
        .btn-success { background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn-warning { background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default OrganizersManagement;