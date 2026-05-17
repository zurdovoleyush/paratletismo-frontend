import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className="error-page">
    <h1>403</h1>
    <h2>Acceso No Autorizado</h2>
    <p>No tienes permisos para acceder a esta seccion</p>
    <Link to="/dashboard" className="btn-primary">Volver al Dashboard</Link>
  </div>
);

export default Unauthorized;
