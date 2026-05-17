import { useState, useEffect } from 'react';
import { tournamentApi } from '../api';
import { useAuth } from '../context/AuthContext';

const CoachProfile = () => {
  const { user } = useAuth();
  const [coach, setCoach] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentApi.getAvailableInstitutions()
      .then(res => setInstitutions(res.data.results || res.data))
      .catch(() => {});

    tournamentApi.getMyInstitution()
      .then(res => {
        setCoach(res.data);
        if (res.data?.institution) {
          setSelectedInstitution(res.data.institution);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectInstitution = async () => {
    if (!selectedInstitution) {
      alert('Debes seleccionar una institucion');
      return;
    }
    try {
      await tournamentApi.setCoachInstitution({ institution: selectedInstitution });
      const res = await tournamentApi.getMyInstitution();
      setCoach(res.data);
      alert('Institucion asignada correctamente');
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al asignar institucion');
      }
    }
  };

  if (loading) return <p>Cargando...</p>;

  const hasInstitution = coach?.institution;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Perfil del Entrenador</h1>
      </div>

      <div className="profile-card">
        <h2>{user?.first_name} {user?.last_name}</h2>
        <div className="info-grid">
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Telefono:</strong> {user?.phone || '-'}</div>
          <div><strong>Institucion actual:</strong> {hasInstitution ? coach.institution_name : 'Sin asignar'}</div>
        </div>
      </div>

      {!hasInstitution ? (
        <div className="detail-section" style={{ marginTop: '2rem' }}>
          <h3>Seleccionar Institucion</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Para poder crear atletas debes estar asignado a una institucion. Selecciona una de la lista:
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Seleccionar institucion</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={handleSelectInstitution} disabled={!selectedInstitution}>
              Asignar
            </button>
          </div>
          {institutions.length === 0 && (
            <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
              No hay instituciones registradas en el sistema. Contacta al administrador.
            </p>
          )}
        </div>
      ) : (
        <div className="detail-section" style={{ marginTop: '2rem' }}>
          <h3>Cambiar Institucion</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              style={{ flex: 1 }}
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={handleSelectInstitution}>
              Cambiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachProfile;
