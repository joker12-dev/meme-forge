import React, { useState } from 'react';
import { FaLock, FaUser, FaSignInAlt, FaExclamationCircle } from 'react-icons/fa';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        // Pass user data from backend to parent component
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="lock-icon">
            <FaLock />
          </div>
          <h1>Admin Paneli</h1>
          <p>Devam etmek için giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              <FaUser /> Kullanıcı Adı
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Kullanıcı adınızı girin"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Şifre
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Şifrenizi girin"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Giriş yapılıyor...
              </>
            ) : (
              <>
                <FaSignInAlt />
                Giriş Yap
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-hint">
            💡 Varsayılan: admin / Admin123!
          </p>
        </div>
      </div>

      {/* Background decorations */}
      <div className="login-bg-decoration"></div>
    </div>
  );
};

export default AdminLogin;

