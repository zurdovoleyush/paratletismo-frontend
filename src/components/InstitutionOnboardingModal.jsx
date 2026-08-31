const InstitutionOnboardingModal = ({ onClose, onGoToProfile }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h2 style={{ marginTop: 0 }}>Bienvenido a Paratletismo</h2>
      <p>
        Para poder gestionar atletas, entrenadores, inscripciones y torneos, primero tenes que
        completar el perfil de tu institucion.
      </p>
      <p style={{ color: 'var(--text-light)' }}>
        Los datos de nombre, nombre corto y email se tomaron del registro. Solo falta completar
        la informacion adicional de tu institucion.
      </p>
      <div className="form-actions">
        <button type="button" className="btn-primary" onClick={onGoToProfile}>Completar Mi Perfil</button>
        <button type="button" className="btn-secondary" onClick={onClose}>Ahora no</button>
      </div>
    </div>
  </div>
);

export default InstitutionOnboardingModal;
