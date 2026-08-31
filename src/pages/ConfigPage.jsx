import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { configApi } from '../api';

const configFields = {
  disciplines: { title: 'Tipos de Prueba', api: 'getDisciplines', createApi: 'createDiscipline', updateApi: 'updateDiscipline', deleteApi: 'deleteDiscipline' },
  sexes: { title: 'Sexos', api: 'getSexes', createApi: 'createSex', updateApi: 'updateSex', deleteApi: 'deleteSex' },
  categories: { title: 'Categorias', api: 'getCategories', createApi: 'createCategory', updateApi: 'updateCategory', deleteApi: 'deleteCategory' },
  classifications: { title: 'Clasificaciones Funcionales', api: 'getClassifications', createApi: 'createClassification', updateApi: 'updateClassification', deleteApi: 'deleteClassification' },
  'event-types': { title: 'Disciplinas', api: 'getEventTypes', createApi: 'createEventType', updateApi: 'updateEventType', deleteApi: 'deleteEventType' },
};

const ConfigPage = () => {
  const { type } = useParams();
  const config = configFields[type];
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState([]);

  useEffect(() => {
    if (config) {
      configApi[config.api]()
        .then(res => setItems(res.data.results || res.data))
        .catch(() => {});
    }
    if (type === 'classifications') {
      configApi.getDisciplines().then(res => setDropdownOptions(res.data.results || res.data)).catch(() => {});
    }
    if (type === 'event-types') {
      configApi.getDisciplines().then(res => setDropdownOptions(res.data.results || res.data)).catch(() => {});
    }
  }, [type]);

  if (!config) return <p>Configuracion no encontrada</p>;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await configApi[config.updateApi](editingItem.id, formData);
      } else {
        await configApi[config.createApi](formData);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({});
      const res = await configApi[config.api]();
      setItems(res.data.results || res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert(editingItem ? 'Error al actualizar' : 'Error al crear');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Estas seguro de eliminar este registro?')) return;
    try {
      await configApi[config.deleteApi](id);
      const res = await configApi[config.api]();
      setItems(res.data.results || res.data);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        alert(Object.values(errors).flat().join(', '));
      } else {
        alert('Error al eliminar');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({});
  };

  const getFields = () => {
    switch (type) {
      case 'disciplines':
        return [
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'description', label: 'Descripcion', type: 'textarea' },
        ];
      case 'sexes':
        return [
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'code', label: 'Codigo', type: 'text' },
        ];
      case 'categories':
        return [
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'description', label: 'Descripcion', type: 'textarea' },
          { key: 'min_age', label: 'Edad Minima', type: 'number' },
          { key: 'max_age', label: 'Edad Maxima', type: 'number' },
        ];
      case 'classifications':
        return [
          { key: 'code', label: 'Codigo', type: 'text' },
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'discipline', label: 'Tipo de Prueba', type: 'select', options: dropdownOptions },
          { key: 'description', label: 'Descripcion', type: 'textarea' },
        ];
      case 'event-types':
        return [
          { key: 'name', label: 'Nombre (ej: 100 mts, 200 mts, Lanzamiento de bala)', type: 'text' },
          { key: 'discipline', label: 'Tipo de Prueba', type: 'select', options: dropdownOptions },
          { key: 'is_time_based', label: 'Basado en Tiempo', type: 'checkbox' },
          { key: 'is_distance_based', label: 'Basado en Distancia', type: 'checkbox' },
          { key: 'unit', label: 'Unidad', type: 'text' },
          { key: 'description', label: 'Descripcion', type: 'textarea' },
        ];
      default:
        return [];
    }
  };

  const fields = getFields();

  return (
    <div className="page">
      <div className="page-header">
        <h1>{config.title}</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h3>{editingItem ? 'Editar' : 'Nuevo'}</h3>
          {fields.map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              {f.type === 'textarea' && (
                <textarea name={f.key} value={formData[f.key] || ''} onChange={handleChange} rows={2} />
              )}
              {f.type === 'text' && (
                <input type="text" name={f.key} value={formData[f.key] || ''} onChange={handleChange} />
              )}
              {f.type === 'number' && (
                <input type="number" name={f.key} value={formData[f.key] || ''} onChange={handleChange} />
              )}
              {f.type === 'checkbox' && (
                <input type="checkbox" name={f.key} checked={formData[f.key] || false} onChange={handleChange} />
              )}
              {f.type === 'select' && (
                <select name={f.key} value={formData[f.key] || ''} onChange={handleChange} required>
                  <option value="">Seleccionar</option>
                  {f.options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              )}
            </div>
          ))}
          <button type="submit" className="btn-primary">{editingItem ? 'Actualizar' : 'Crear'}</button>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            {fields.map(f => <th key={f.key}>{f.label}</th>)}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              {fields.map(f => (
                <td key={f.key}>
                  {f.type === 'checkbox' ? (item[f.key] ? 'Si' : 'No') :
                   f.type === 'select' ? (item[f.key + '_name'] || item[f.key] || '-') :
                   item[f.key] || '-'}
                </td>
              ))}
              <td>
                <button className="btn-sm" onClick={() => handleEdit(item)} style={{ marginRight: '0.5rem' }}>Editar</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p>No hay registros</p>}
    </div>
  );
};

export default ConfigPage;
