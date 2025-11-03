import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaEnvelope, 
  FaTwitter, 
  FaTelegram, 
  FaDiscord, 
  FaMapMarkerAlt, 
  FaClock,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowLeft
} from 'react-icons/fa';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    // Form validasyonu
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus({ 
        type: 'error', 
        message: 'Lütfen tüm alanları doldurunuz.' 
      });
      setIsSubmitting(false);
      return;
    }

    // Email validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus({ 
        type: 'error', 
        message: 'Lütfen geçerli bir e-posta adresi giriniz.' 
      });
      setIsSubmitting(false);
      return;
    }

    // Backend API çağrısı
    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.' 
        });
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setStatus({ 
          type: 'error', 
          message: data.error || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.' 
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus({ 
        type: 'error', 
        message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      {/* Hero Section */}
      <div className="contact-hero">
        <Link to="/" className="back-link">
          <FaArrowLeft /> Ana Sayfaya Dön
        </Link>
        <h1 className="contact-title">
          <FaEnvelope className="title-icon" />
          Bizimle İletişime Geçin
        </h1>
        <p className="contact-subtitle">
          Sorularınız, önerileriniz veya destek talepleriniz için her zaman buradayız
        </p>
      </div>

      {/* Main Content */}
      <div className="contact-content">
        {/* Contact Form */}
        <div className="contact-form-section">
          <div className="form-header">
            <h2>İletişim Formu</h2>
            <p>Formu doldurarak bize ulaşabilirsiniz</p>
          </div>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Adınız Soyadınız *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ad Soyad"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">E-posta Adresiniz *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@email.com"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Konu *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="form-input form-select"
              >
                <option value="">Konu Seçiniz</option>
                <option value="general">Genel Sorular</option>
                <option value="support">Teknik Destek</option>
                <option value="partnership">İş Ortaklığı</option>
                <option value="token">Token Oluşturma</option>
                <option value="listing">Token Listeleme</option>
                <option value="bug">Hata Bildirimi</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Mesajınız *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Mesajınızı buraya yazınız..."
                rows="6"
                className="form-input form-textarea"
              ></textarea>
            </div>

            {status.message && (
              <div className={`form-status ${status.type}`}>
                {status.type === 'success' ? (
                  <FaCheckCircle className="status-icon" />
                ) : (
                  <FaExclamationCircle className="status-icon" />
                )}
                <span>{status.message}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Mesaj Gönder
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="contact-info-section">
          <div className="info-card">
            <div className="info-icon">
              <FaEnvelope />
            </div>
            <h3>E-posta</h3>
            <p>support@fourmeme.com</p>
            <p className="info-detail">7/24 müşteri desteği</p>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FaClock />
            </div>
            <h3>Çalışma Saatleri</h3>
            <p>Pazartesi - Cuma</p>
            <p className="info-detail">09:00 - 18:00 (GMT+3)</p>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FaMapMarkerAlt />
            </div>
            <h3>Adres</h3>
            <p>İstanbul, Türkiye</p>
            <p className="info-detail">Blockchain Teknoloji Merkezi</p>
          </div>

          <div className="social-section">
            <h3>Sosyal Medya</h3>
            <p className="social-description">
              Güncellemeler ve duyurular için bizi takip edin
            </p>
            <div className="social-links">
              <a 
                href="https://twitter.com/fourmeme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link twitter"
              >
                <FaTwitter />
              </a>
              <a 
                href="https://t.me/fourmeme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link telegram"
              >
                <FaTelegram />
              </a>
              <a 
                href="https://discord.gg/fourmeme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link discord"
              >
                <FaDiscord />
              </a>
            </div>
          </div>

          <div className="faq-callout">
            <h3>Sıkça Sorulan Sorular</h3>
            <p>
              Sorularınızın cevaplarını SSS sayfamızda bulabilirsiniz.
            </p>
            <Link to="/docs" className="faq-link">
              Dokümantasyona Git
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="contact-additional">
        <div className="additional-card">
          <h3>⚡ Hızlı Yanıt</h3>
          <p>Ortalama yanıt süremiz 24 saat içindedir. Acil durumlar için telegram kanalımızdan ulaşabilirsiniz.</p>
        </div>
        <div className="additional-card">
          <h3>🔒 Gizlilik</h3>
          <p>Tüm iletişimleriniz gizli tutulur ve üçüncü şahıslarla paylaşılmaz. Detaylı bilgi için gizlilik politikamıza göz atın.</p>
        </div>
        <div className="additional-card">
          <h3>🤝 İş Ortaklığı</h3>
          <p>İş ortaklığı teklifleri için partnership@fourmeme.com adresine e-posta gönderebilirsiniz.</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;

