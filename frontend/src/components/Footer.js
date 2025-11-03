import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaTelegramPlane, FaDiscord, FaGithub, FaRocket, FaBook, FaShieldAlt, FaEnvelope } from 'react-icons/fa';
import api from '../utils/api';
import './Footer.css';

const Footer = () => {
  const [stats, setStats] = useState({
    tokensCreated: 0,
    totalVolume: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching platform stats...');
      const response = await api.get('/api/stats');
      console.log('📊 Stats response:', response.data);
      
      if (response.data.success) {
        setStats(response.data.stats);
        console.log('✅ Stats updated:', response.data.stats);
      } else {
        console.warn('⚠️ Stats request unsuccessful');
      }
    } catch (error) {
      console.error('❌ Stats fetch error:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M+`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(0)}K+`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}+`;
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo & Description */}
          <div className="footer-section">
            <div className="footer-logo">
              <FaRocket className="logo-icon" />
              <h3>MEME TOKEN</h3>
            </div>
            <p className="footer-description">
              Kendi meme tokenınızı dakikalar içinde oluşturun. 
              Güvenli, hızlı ve kullanıcı dostu platform.
            </p>
            <div className="footer-social">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaTwitter />
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaTelegramPlane />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaDiscord />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaGithub />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Hızlı Linkler</h4>
            <ul className="footer-links">
              <li><Link to="/">Ana Sayfa</Link></li>
              <li><Link to="/create">Token Oluştur</Link></li>
              <li><Link to="/tokens">Tokenlar</Link></li>
              <li><Link to="/docs">Dokümantasyon</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4>Kaynaklar</h4>
            <ul className="footer-links">
              <li>
                <Link to="/docs">
                  <FaBook className="link-icon" />
                  Dokümantasyon
                </Link>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <FaGithub className="link-icon" />
                  GitHub
                </a>
              </li>
              <li>
                <Link to="/docs#security">
                  <FaShieldAlt className="link-icon" />
                  Güvenlik
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <FaEnvelope className="link-icon" />
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div className="footer-section">
            <h4>İstatistikler</h4>
            <div className="footer-stats">
              <div className="stat-item">
                <span className="stat-number">
                  {loading ? '...' : formatNumber(stats.tokensCreated)}
                </span>
                <span className="stat-label">Oluşturulan Token</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {loading ? '...' : formatVolume(stats.totalVolume)}
                </span>
                <span className="stat-label">Toplam İşlem Hacmi</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {loading ? '...' : formatNumber(stats.activeUsers)}
                </span>
                <span className="stat-label">Token Yaratıcısı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2024 Meme Token Platform. Tüm hakları saklıdır.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy">Gizlilik Politikası</Link>
              <span className="separator">•</span>
              <Link to="/terms">Kullanım Şartları</Link>
              <span className="separator">•</span>
              <Link to="/disclaimer">Sorumluluk Reddi</Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="footer-glow"></div>
      </div>
    </footer>
  );
};

export default Footer;

