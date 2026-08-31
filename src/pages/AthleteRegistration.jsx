import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentApi, competitionApi } from '../api';

const AthleteRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState({}); // { tournamentId: { medical_certificate: File, payment_receipt: File } }
  const [lateUploads, setLateUploads] = useState({}); // { registrationId: { field: File } }

  useEffect(() => {
    tournamentApi.getAthletes()
      .then(res => {
        const found = (res.data.results || res.data).find(a => a.id === id);
        if (found) setAthlete(found);
      })
      .catch(() => {});

    competitionApi.getAthleteRegistrationOptions(id)
      .then(res => setOptions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegisterTournament = async (tournamentId) => {
    try {
      const files = uploadState[tournamentId] || {};
      const hasFiles = files.medical_certificate || files.payment_receipt;
      let payload;
      if (hasFiles) {
        payload = new FormData();
        payload.append('tournament', tournamentId);
        payload.append('athlete', id);
        if (files.medical_certificate) payload.append('medical_certificate', files.medical_certificate);
        if (files.payment_receipt) payload.append('payment_receipt', files.payment_receipt);
      } else {
        payload = { tournament: tournamentId, athlete: id };
      }
      await competitionApi.createRegistration(payload);
      setUploadState(prev => ({ ...prev, [tournamentId]: {} }));
      const res = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al inscribir en torneo');
      }
    }
  };

  const handleRegFileChange = (tournamentId, field, file) => {
    setUploadState(prev => ({
      ...prev,
      [tournamentId]: { ...(prev[tournamentId] || {}), [field]: file },
    }));
  };

  const handleDocChange = (regId, field, file) => {
    setLateUploads(prev => ({
      ...prev,
      [regId]: { ...(prev[regId] || {}), [field]: file },
    }));
  };

  const handleUploadDoc = async (t, field) => {
    const regId = t.registration_id;
    const file = lateUploads[regId]?.[field];
    if (!regId || !file) return;
    try {
      const formData = new FormData();
      formData.append(field, file);
      await competitionApi.updateRegistration(regId, formData);
      setLateUploads(prev => ({ ...prev, [regId]: { ...(prev[regId] || {}), [field]: null } }));
      const res = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al subir documentacion');
      }
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await competitionApi.registerAthleteToEvent(eventId, { athlete: id, tournament_event: eventId });
      const res = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al inscribir en prueba');
      }
    }
  };

  const handleAnularEvent = async (eventPk, athleteEventId) => {
    if (!athleteEventId) return;
    if (!window.confirm('Anular la inscripcion en esta prueba? Podras elegir otra prueba mientras no confirmes.')) return;
    try {
      await competitionApi.deleteAthleteEvent(eventPk, athleteEventId);
      const res = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al anular la inscripcion');
      }
    }
  };

  const handleConfirmEvents = async (registrationId) => {
    if (!registrationId) return;
    if (!window.confirm('Confirmar las inscripciones en las pruebas? Una vez confirmadas no podras modificarlas.')) return;
    try {
      const res = await competitionApi.confirmRegistrationEvents(registrationId);
      alert(res.data.message || 'Inscripciones confirmadas');
      const res2 = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res2.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al confirmar las inscripciones');
      }
    }
  };

  const handleCancelRegistration = async (tournamentId, registrationId) => {
    if (!registrationId) return;
    if (!window.confirm('¿Seguro que quieres cancelar la inscripcion del atleta en este torneo? Ya no aparecera como inscripto.')) return;
    try {
      await competitionApi.deleteRegistration(registrationId);
      const res = await competitionApi.getAthleteRegistrationOptions(id);
      setOptions(res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al cancelar la inscripcion');
      }
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!athlete || !options) return <p>Atleta no encontrado</p>;

  const regStatusLabels = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    withdrawn: 'Retirada',
  };

  const renderDocUpload = (t, field, label) => {
    const url = field === 'medical_certificate' ? t.medical_certificate : t.payment_receipt;
    const file = lateUploads[t.registration_id]?.[field];
    return (
      <div className="form-group">
        <label>{label}</label>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">Ver archivo cargado</a>
        ) : (
          <span style={{ color: '#999' }}>Pendiente</span>
        )}
        <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ fontSize: '0.8rem' }} onChange={e => handleDocChange(t.registration_id, field, e.target.files[0])} />
          {file && <button className="btn-sm btn-primary" onClick={() => handleUploadDoc(t, field)}>Subir</button>}
        </div>
      </div>
    );
  };

  const renderAthleteInfo = () => {
    const trackClass = athlete.track_classification_name || athlete.track_classification_code;
    const fieldClass = athlete.field_classification_name || athlete.field_classification_code;
    return (
      <div className="info-grid">
        <div><strong>Sexo:</strong> {athlete.sex_name || 'No definido'}</div>
        <div><strong>Edad:</strong> {athlete.age ? `${athlete.age} anos` : '-'}</div>
        <div><strong>Documento:</strong> {athlete.document_type || ''} {athlete.document_number || '-'}</div>
        <div><strong>Clasif. Pista:</strong> {trackClass || 'Sin clasificar'}</div>
        <div><strong>Clasif. Campo:</strong> {fieldClass || 'Sin clasificar'}</div>
        {athlete.coach_name && <div><strong>Entrenador:</strong> {athlete.coach_name}</div>}
        {athlete.institution_name && <div><strong>Institucion:</strong> {athlete.institution_name}</div>}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inscribir: {athlete.user_name}</h1>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Volver</button>
      </div>

      <div className="profile-card">
        <h2>Datos del Atleta</h2>
        {renderAthleteInfo()}
      </div>

      {options.tournaments.length === 0 ? (
        <p>No hay torneos activos en este momento</p>
      ) : (
        options.tournaments.map(t => (
          <div key={t.tournament.id} className="detail-section" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3>{t.tournament.name}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                  {t.tournament.venue} - {t.tournament.city}
                </p>
              </div>
              <span className={`badge badge-${t.is_registered_in_tournament ? 'approved' : 'pending'}`}>
                {t.is_registered_in_tournament ? 'Inscrito en Torneo' : 'No Inscrito'}
              </span>
            </div>

            {!t.is_registered_in_tournament && (
              <div style={{ marginBottom: '1rem' }}>
                <h4>Documentacion requerida</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Certificado Medico Aptó</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleRegFileChange(t.tournament.id, 'medical_certificate', e.target.files[0])} />
                    {uploadState[t.tournament.id]?.medical_certificate && <small>{uploadState[t.tournament.id].medical_certificate.name}</small>}
                  </div>
                  <div className="form-group">
                    <label>Comprobante de Pago</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleRegFileChange(t.tournament.id, 'payment_receipt', e.target.files[0])} />
                    {uploadState[t.tournament.id]?.payment_receipt && <small>{uploadState[t.tournament.id].payment_receipt.name}</small>}
                  </div>
                </div>
                {(!uploadState[t.tournament.id]?.medical_certificate || !uploadState[t.tournament.id]?.payment_receipt) && (
                  <small style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>
                    La ficha medica y el comprobante de pago son obligatorios para inscribirse.
                  </small>
                )}
                <button
                  className="btn-primary"
                  disabled={!uploadState[t.tournament.id]?.medical_certificate || !uploadState[t.tournament.id]?.payment_receipt}
                  onClick={() => handleRegisterTournament(t.tournament.id)}
                >
                  Inscribir en Torneo
                </button>
              </div>
            )}

            {t.is_registered_in_tournament && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className={`badge badge-${t.registration_status}`}>{regStatusLabels[t.registration_status]}</span>
                </div>

                {t.registration_status === 'rejected' && (
                  <div className="rejection-banner">
                    <strong>Tu inscripcion fue rechazada.</strong>
                    {t.rejection_reason && <p>Motivo: {t.rejection_reason}</p>}
                    <p>Subi la documentacion faltante o corregida para reenviar tu inscripcion al organizador.</p>
                  </div>
                )}

                <h4>Documentacion</h4>
                <div className="form-row">
                  {renderDocUpload(t, 'medical_certificate', 'Ficha medica (certificado medico apto)')}
                  {renderDocUpload(t, 'payment_receipt', 'Comprobante de pago')}
                </div>

                {t.registration_status === 'rejected' ? (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    Una vez que subas la documentacion tu inscripcion vuelve a quedar Pendiente para su revision. No podes cambiar las pruebas mientras esta rechazada.
                  </p>
                ) : (
                  <>
                <h4>Pruebas disponibles para este atleta ({t.eligible_events.length})</h4>
                {t.events_confirmed && (
                  <p className="badge badge-approved" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
                    Inscripcion confirmada - ya no se pueden realizar cambios
                  </p>
                )}
                {t.max_events_per_athlete > 0 && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Maximo de {t.max_events_per_athlete} pruebas por atleta - Inscrito en {t.registered_event_count}
                  </p>
                )}
                {t.eligible_events.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <p>No hay pruebas disponibles para este atleta en este torneo.</p>
                    <button className="btn-secondary" onClick={() => handleCancelRegistration(t.tournament.id, t.registration_id)}>
                      Cancelar inscripcion
                    </button>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Prueba</th>
                        <th>Sexo</th>
                        <th>Categoria</th>
                        <th>Clasif.</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.eligible_events.map(e => (
                        <tr key={e.id}>
                          <td><strong>{e.name}</strong></td>
                          <td>{e.sex_name || 'Multiple'}</td>
                          <td>{e.category_name || 'Multiple'}</td>
                          <td>{e.classification_code || 'Libre'}</td>
                          <td>{e.scheduled_date ? new Date(e.scheduled_date).toLocaleString() : '-'}</td>
                          <td>
                            {e.is_registered ? (
                              <span className="badge badge-approved">Inscrito</span>
                            ) : (
                              <span className="badge badge-pending">Disponible</span>
                            )}
                          </td>
                          <td>
                            {t.events_confirmed ? (
                              <span className="badge badge-approved">{e.is_registered ? 'Confirmada' : 'Cerrada'}</span>
                            ) : e.is_registered ? (
                              <button className="btn-sm btn-danger" onClick={() => handleAnularEvent(t.tournament.id, e.athlete_event_id)}>
                                Anular
                              </button>
                            ) : e.is_disabled ? (
                              <span className="badge badge-pending">Limite alcanzado</span>
                            ) : (
                              <button className="btn-sm btn-success" onClick={() => handleRegisterEvent(e.id)}>
                                Inscribir
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {t.registered_event_count > 0 && !t.events_confirmed && (
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-success" onClick={() => handleConfirmEvents(t.registration_id)}>
                      Confirmar Inscripcion
                    </button>
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AthleteRegistration;
