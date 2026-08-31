import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentApi } from '../api';

const CreateTournament = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    address: '',
    city: '',
    province: '',
    registration_opens: '',
    registration_closes: '',
    tournament_start: '',
    tournament_end: '',
    registration_fee: '0',
    max_participants: '',
    max_events_per_athlete: '',
    organizer: '',
    rules: '',
    use_bibs: true,
  });
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    tournamentApi.getInstitutions().then(res => setInstitutions(res.data.results || res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleToggle = (name, checked) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tournamentApi.createTournament(formData);
      navigate('/dashboard/tournaments');
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.entries(errors).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
      } else {
        alert('Error al crear torneo: ' + JSON.stringify(err.response?.data || err.message));
      }
      console.error('Create tournament error:', err.response?.status, err.response?.data);
    }
  };

  return (
    <div className="page">
      <h1>Crear Torneo</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label>Nombre</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Descripcion</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Lugar</label>
            <input type="text" name="venue" value={formData.venue} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Direccion</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Ciudad</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Provincia</label>
            <input type="text" name="province" value={formData.province} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Inscripcion Abre</label>
            <input type="datetime-local" name="registration_opens" value={formData.registration_opens} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Inscripcion Cierra</label>
            <input type="datetime-local" name="registration_closes" value={formData.registration_closes} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Inicio Torneo</label>
            <input type="datetime-local" name="tournament_start" value={formData.tournament_start} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Fin Torneo</label>
            <input type="datetime-local" name="tournament_end" value={formData.tournament_end} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Costo Inscripcion ($)</label>
            <input type="number" name="registration_fee" value={formData.registration_fee} onChange={handleChange} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label>Max Participantes</label>
            <input type="number" name="max_participants" value={formData.max_participants} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>Max Pruebas por Atleta</label>
            <input type="number" name="max_events_per_athlete" value={formData.max_events_per_athlete} onChange={handleChange} min="0" />
            <small>Dejalo en 0 para que cada atleta pueda inscribirse sin limite de pruebas</small>
          </div>
        </div>
        <div className="form-group">
          <label>Reglamento</label>
          <textarea name="rules" value={formData.rules} onChange={handleChange} rows={4} />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.use_bibs !== false}
              onChange={(e) => handleToggle('use_bibs', e.target.checked)}
            />
            Usar pecheras numeradas (dorsales)
          </label>
        </div>
          {user?.role === 'superadmin' && (
            <div className="form-group">
              <label>Institucion Organizadora (opcional)</label>
              <select name="organizer" value={formData.organizer || ''} onChange={handleChange}>
                <option value="">Sin institucion</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
              <small>Las instituciones son opcionales y no condicionan la creacion del torneo.</small>
            </div>
          )}
        <button type="submit" className="btn-primary">Crear Torneo</button>
      </form>
    </div>
  );
};

export default CreateTournament;
