import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🏅 Paratletismo</h1>
          <p>Sistema de Gestion de Torneos</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tu contraseña"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>
        </form>
        <div className="auth-actions">
          <Link to="/tournaments" className="action-btn action-tournaments">
            <span className="action-icon">🏆</span>
            <span className="action-text">
              <strong>Ver Torneos</strong>
              <small>Torneos publicos</small>
            </span>
          </Link>
          <Link to="/results/en-curso" className="action-btn action-inprogress">
            <span className="action-icon">📊</span>
            <span className="action-text">
              <strong>Resultados en Curso</strong>
              <small>En progreso</small>
            </span>
          </Link>
          <Link to="/results/finalizados" className="action-btn action-completed">
            <span className="action-icon">🏁</span>
            <span className="action-text">
              <strong>Resultados Finalizados</strong>
              <small>Completados</small>
            </span>
          </Link>
          <Link to="/records" className="action-btn action-records">
            <span className="action-icon">🥇</span>
            <span className="action-text">
              <strong>Records</strong>
              <small>Mejores marcas</small>
            </span>
          </Link>
        </div>
        <div className="auth-links">
          <Link to="/register" className="auth-register-link">Registrarse</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
