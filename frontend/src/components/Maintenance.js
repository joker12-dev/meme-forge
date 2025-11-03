import React, { useEffect, useState } from 'react';
import './Maintenance.css';

const Maintenance = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Rastgele partiküller oluştur
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="maintenance-page">
      {/* Arka plan partikülleri */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      <div className="maintenance-container">
        <div className="maintenance-content">
          {/* Ana ikon */}
          <div className="maintenance-icon-wrapper">
            <div className="icon-circle">
              <div className="icon-inner">
                🔧
              </div>
            </div>
            <div className="icon-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>

          {/* Başlık ve mesaj */}
          <h1 className="maintenance-title">
            <span className="title-line">SİTE BAKIM</span>
            <span className="title-line">MODUNDA</span>
          </h1>

          <div className="maintenance-divider"></div>

          <p className="maintenance-message">
            Sistemlerimizi sizin için geliştiriyoruz
          </p>

          <div className="maintenance-info">
            <div className="info-item">
              <div className="info-icon">⚡</div>
              <div className="info-text">Performans İyileştirmeleri</div>
            </div>
            <div className="info-item">
              <div className="info-icon">🔒</div>
              <div className="info-text">Güvenlik Güncellemeleri</div>
            </div>
            <div className="info-item">
              <div className="info-icon">🚀</div>
              <div className="info-text">Yeni Özellikler</div>
            </div>
          </div>

          <p className="maintenance-submessage">
            En kısa sürede yeniden hizmetinizdeyiz
          </p>

          {/* Alt loading */}
          <div className="maintenance-loading">
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

