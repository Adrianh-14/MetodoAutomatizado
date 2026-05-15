import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate matrix background columns
  const cols = Array.from({ length: 50 }).map((_, i) => {
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let text = '';
    for(let j=0; j<20; j++) text += chars.charAt(Math.floor(Math.random() * chars.length));
    
    return (
      <div key={i} className="matrix-col" style={{
        left: `${i * 2}%`,
        animationDuration: `${Math.random() * 5 + 3}s`,
        animationDelay: `${Math.random() * 5}s`
      }}>
        {text}
      </div>
    );
  });

  return (
    <div className="login-page">
      <div className="login-bg">
        {cols}
      </div>
      
      <div className="login-card animate-in">
        <h1 className="login-title">ACCESO_SISTEMA</h1>
        <p className="login-subtitle">MILLONESGANG // AUTENTICACIÓN REQUERIDA</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">Identidad [Email]</label>
            <input 
              type="email" 
              className="input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@millonesgang.com"
              required 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Clave [Password]</label>
            <input 
              type="password" 
              className="input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          
          {error && <div className="login-error">{error === 'Authentication failed' ? 'Fallo de Autenticación' : error}</div>}
          
          <button type="submit" className="btn login-btn" disabled={isLoading}>
            {isLoading ? 'VERIFICANDO...' : 'INICIALIZAR_CONEXIÓN'}
          </button>
        </form>
      </div>
      <div className="scanlines"></div>
    </div>
  );
};

export default LoginPage;
