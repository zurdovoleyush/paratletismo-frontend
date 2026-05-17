import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentApi, configApi } from '../api';

const CreateTournament = () => {
  const navigate = useNavigate();
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
    disciplines: [],
    sexes: [],
    categories: [],
    rules: '',
  });
  const [disciplines, setDisciplines] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    configApi.getDisciplines().then(res => setDisciplines(res.data.results || res.data)).catch(() => {});
    configApi.getSexes().then(res => setSexes(res.data.results || res.data)).catch(() => {});
    configApi.getCategories().then(res => setCategories(res.data.results || res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const current = formData[name];
      setFormData({
        ...formData,
        [name]: checked ? [...current, value] : current.filter(v => v !== value),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
            <input type="number" name="max_participants" value={formData.max_participants} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Disciplinas</label>
          <div className="checkbox-group">
            {disciplines.map(d => (
              <label key={d.id}>
                <input type="checkbox" name="disciplines" value={d.id} checked={formData.disciplines.includes(d.id)} onChange={handleChange} />
                {d.name}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Sexos</label>
          <div className="checkbox-group">
            {sexes.map(s => (
              <label key={s.id}>
                <input type="checkbox" name="sexes" value={s.id} checked={formData.sexes.includes(s.id)} onChange={handleChange} />
                {s.name}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Categorias</label>
          <div className="checkbox-group">
            {categories.map(c => (
              <label key={c.id}>
                <input type="checkbox" name="categories" value={c.id} checked={formData.categories.includes(c.id)} onChange={handleChange} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Reglamento</label>
          <textarea name="rules" value={formData.rules} onChange={handleChange} rows={4} />
        </div>
        <button type="submit" className="btn-primary">Crear Torneo</button>
      </form>
    </div>
  );
};

export default CreateTournament;
