import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaChartLine, FaBolt, FaDollarSign, FaShieldAlt, FaCoins, FaGlobeAmericas } from 'react-icons/fa';

const Home = () => {
  return (
    <>
      <style>{`
        .home-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #FFFFFF;
          overflow-x: hidden;
        }

        .hero-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
          padding: 2rem 1rem;
          max-width: 1400px;
          margin: 0 auto;
          min-height: calc(100vh - 80px);
          position: relative;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: center;
          order: 1;
          position: relative;
          z-index: 2;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .gradient-text {
          background: linear-gradient(135deg, #F0B90B, #F8D33A, #F0B90B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .hero-subtitle {
          font-size: 1.1rem;
          color: #CBD5E1;
          line-height: 1.7;
          margin: 0;
          max-width: 100%;
          font-weight: 400;
        }

        .hero-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
        }

        .primary-button {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          padding: 1.2rem 2rem;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 25px rgba(240, 185, 11, 0.3);
          text-align: center;
          display: inline-block;
          position: relative;
          overflow: hidden;
          border: none;
          cursor: pointer;
        }

        .primary-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .primary-button:hover::before {
          left: 100%;
        }

        .primary-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(240, 185, 11, 0.5);
        }

        .primary-button:active {
          transform: translateY(-1px);
        }

        .secondary-button {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
          padding: 1.2rem 2rem;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          border: 2px solid rgba(240, 185, 11, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          display: inline-block;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .secondary-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(240, 185, 11, 0.1), transparent);
          transition: left 0.5s;
        }

        .secondary-button:hover::before {
          left: 100%;
        }

        .secondary-button:hover {
          background: rgba(240, 185, 11, 0.15);
          border-color: rgba(240, 185, 11, 0.5);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(240, 185, 11, 0.2);
        }

        .hero-graphics {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          order: 2;
          position: relative;
          z-index: 2;
        }

        .graphic-card {
          background: linear-gradient(135deg, rgba(43, 47, 54, 0.8), rgba(30, 32, 38, 0.6));
          padding: 2rem 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(240, 185, 11, 0.2);
          text-align: center;
          backdrop-filter: blur(15px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .graphic-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #F0B90B, transparent);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }

        .graphic-card:hover::before {
          transform: scaleX(1);
        }

        .graphic-card:hover {
          background: linear-gradient(135deg, rgba(43, 47, 54, 0.9), rgba(30, 32, 38, 0.7));
          border-color: rgba(240, 185, 11, 0.4);
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(240, 185, 11, 0.15);
        }

        .graphic-card h3 {
          margin: 1rem 0 0.5rem 0;
          font-size: 1.3rem;
          color: #FFFFFF;
          font-weight: 700;
        }

        .graphic-card p {
          margin: 0.5rem 0 0 0;
          font-size: 0.95rem;
          color: #CBD5E1;
          line-height: 1.5;
        }

        .graphic-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 0 15px rgba(240, 185, 11, 0.4));
          transition: transform 0.3s ease;
        }

        .graphic-card:hover .graphic-icon {
          transform: scale(1.1) rotate(5deg);
        }

        /* BSC Network Features Section */
        .features-section {
          padding: 6rem 1rem;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          position: relative;
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-title h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-title p {
          font-size: 1.2rem;
          color: #CBD5E1;
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        .feature-card {
          background: rgba(43, 47, 54, 0.6);
          padding: 2.5rem 2rem;
          border-radius: 20px;
          border: 1px solid rgba(240, 185, 11, 0.1);
          text-align: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .feature-card:hover {
          border-color: rgba(240, 185, 11, 0.3);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(240, 185, 11, 0.1);
        }

        .feature-icon {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 0 20px rgba(240, 185, 11, 0.3));
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #FFFFFF;
        }

        .feature-card p {
          color: #CBD5E1;
          line-height: 1.6;
          font-size: 1rem;
        }

        /* Stats Section */
        .stats-section {
          padding: 4rem 1rem;
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
        }

        .stats-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .stat-item {
          text-align: center;
          padding: 2rem 1rem;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #F0B90B;
          margin-bottom: 0.5rem;
          display: block;
        }

        .stat-label {
          color: #CBD5E1;
          font-size: 1rem;
          font-weight: 500;
        }

        /* Floating Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }

        /* Background Elements */
        .bg-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .bg-element {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240, 185, 11, 0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }

        .bg-element:nth-child(1) {
          width: 200px;
          height: 200px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .bg-element:nth-child(2) {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .bg-element:nth-child(3) {
          width: 100px;
          height: 100px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        /* Tablet: 640px+ */
        @media (min-width: 640px) {
          .hero-section {
            padding: 3rem 2rem;
          }

          .hero-title {
            font-size: 3rem;
          }

          .hero-subtitle {
            font-size: 1.2rem;
          }

          .hero-buttons {
            flex-direction: row;
            justify-content: center;
          }

          .primary-button,
          .secondary-button {
            padding: 1.2rem 2.5rem;
          }

          .hero-graphics {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }

          .graphic-card {
            padding: 2rem 1.5rem;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-container {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Desktop: 768px+ */
        @media (min-width: 768px) {
          .hero-section {
            padding: 4rem 2rem;
          }

          .hero-title {
            font-size: 3.5rem;
          }

          .hero-subtitle {
            font-size: 1.3rem;
          }

          .graphic-card {
            padding: 2.5rem 2rem;
          }

          .graphic-icon {
            font-size: 3.5rem;
          }
        }

        /* Large Desktop: 1024px+ */
        @media (min-width: 1024px) {
          .hero-section {
            grid-template-columns: 1fr 1fr;
            gap: 5rem;
            padding: 8rem 2rem;
          }

          .hero-content {
            text-align: left;
            order: 1;
          }

          .hero-title {
            font-size: 4rem;
          }

          .hero-subtitle {
            font-size: 1.4rem;
            max-width: 90%;
          }

          .hero-buttons {
            justify-content: flex-start;
            margin-top: 2rem;
          }

          .hero-graphics {
            grid-template-columns: 1fr;
            gap: 2rem;
            order: 2;
          }

          .graphic-card h3 {
            font-size: 1.4rem;
          }

          .graphic-card p {
            font-size: 1rem;
          }

          .features-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 3rem;
          }

          .feature-card {
            padding: 3rem 2rem;
          }
        }

        /* Extra Large: 1280px+ */
        @media (min-width: 1280px) {
          .hero-title {
            font-size: 4.5rem;
          }

          .hero-subtitle {
            font-size: 1.5rem;
          }
        }

        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          .primary-button,
          .secondary-button {
            padding: 1.3rem 2.5rem;
            font-size: 1.1rem;
          }

          .graphic-card:hover {
            transform: none;
          }

          .primary-button:hover,
          .secondary-button:hover {
            transform: none;
          }
        }
      `}</style>

      <div className="home-container">
        {/* Background Elements */}
        <div className="bg-elements">
          <div className="bg-element"></div>
          <div className="bg-element"></div>
          <div className="bg-element"></div>
        </div>

        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              BSC Network'te
              <span className="gradient-text"> Kendi Token'ını Oluştur</span>
            </h1>
            <p className="hero-subtitle">
              Binance Smart Chain'de saniyeler içinde kendi token'ınızı oluşturun. 
              Kod yazmaya gerek yok. Düşük gas ücretleri ve yüksek hızla 
              token ekonomi trendine katılın.
            </p>
            <div className="hero-buttons">
              <Link to="/create" className="primary-button">
                <FaRocket style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} /> Token Oluştur
              </Link>
              <Link to="/tokens" className="secondary-button">
                <FaChartLine style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} /> Token'ları Keşfet
              </Link>
            </div>
          </div>
          <div className="hero-graphics">
            <div className="graphic-card floating">
              <div className="graphic-icon"><FaBolt style={{color: '#F0B90B', fontSize: '3rem'}} /></div>
              <h3>Yüksek Hız</h3>
              <p>BSC'nin hızlı ağ yapısıyla anında işlem</p>
            </div>
            <div className="graphic-card floating" style={{animationDelay: '1s'}}>
              <div className="graphic-icon"><FaDollarSign style={{color: '#F0B90B', fontSize: '3rem'}} /></div>
              <h3>Düşük Maliyet</h3>
              <p>Ethereum'a göre çok daha düşük gas ücretleri</p>
            </div>
            <div className="graphic-card floating" style={{animationDelay: '2s'}}>
              <div className="graphic-icon"><FaShieldAlt style={{color: '#F0B90B', fontSize: '3rem'}} /></div>
              <h3>Güvenli</h3>
              <p>Binance güvencesiyle güvenli token oluşturma</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-container">
            <div className="section-title">
              <h2>Neden BSC Network?</h2>
              <p>Binance Smart Chain'in benzersiz avantajlarından yararlanın</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon"><FaRocket style={{color: '#F0B90B', fontSize: '3.5rem'}} /></div>
                <h3>3 Saniyede Token</h3>
                <p>Basit formu doldurarak saniyeler içinde kendi BEP-20 token'ınızı oluşturun</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaCoins style={{color: '#F0B90B', fontSize: '3.5rem'}} /></div>
                <h3>Düşük Gas Ücreti</h3>
                <p>Ethereum'a göre %90'a varan oranda daha düşük işlem ücretleri</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaGlobeAmericas style={{color: '#F0B90B', fontSize: '3.5rem'}} /></div>
                <h3>Geniş Ekosistem</h3>
                <p>Binance'in dev ekosistemine ve kullanıcı kitlesine erişim</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;

