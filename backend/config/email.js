const nodemailer = require('nodemailer');

// Email transporter setup
const createTransporter = () => {
  // Gmail örneği (app password kullanmalı)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // Custom SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const transporter = createTransporter();

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️  Email service not configured properly:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

// Generate HTML email template for contact reply
const generateContactReplyTemplate = (message, senderName) => {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #f5f7fa;
          padding: 20px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%);
          padding: 48px 32px;
          text-align: center;
          color: #ffffff;
          border-bottom: 3px solid #667eea;
        }
        .logo-section {
          margin-bottom: 16px;
        }
        .logo-text {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .tagline {
          font-size: 13px;
          opacity: 0.85;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 40px 32px;
        }
        .greeting {
          color: #1a1f3a;
          font-size: 15px;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .greeting-name {
          font-weight: 600;
          color: #667eea;
        }
        .message-container {
          margin: 32px 0;
        }
        .message-label {
          font-size: 12px;
          font-weight: 600;
          color: #999999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .message-box {
          background: #f8f9fc;
          border-left: 4px solid #667eea;
          padding: 20px;
          border-radius: 4px;
          line-height: 1.8;
        }
        .message-box p {
          color: #444444;
          font-size: 15px;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
        }
        .signature-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .signature {
          color: #555555;
          font-size: 14px;
          line-height: 1.8;
        }
        .signature-name {
          font-weight: 600;
          color: #1a1f3a;
          margin-top: 8px;
        }
        .verification-badge {
          display: inline-block;
          background: #f0f4ff;
          color: #667eea;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #e0e7ff;
          margin-top: 12px;
        }
        .info-box {
          background: #fef9e7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          border-radius: 4px;
          margin: 24px 0;
        }
        .info-box p {
          color: #92400e;
          font-size: 13px;
          margin: 0;
          line-height: 1.6;
        }
        .info-box strong {
          color: #78350f;
        }
        .footer {
          background: #f8f9fc;
          padding: 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-brand {
          color: #1a1f3a;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .footer-description {
          color: #999999;
          font-size: 12px;
          margin-bottom: 20px;
        }
        .social-links {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 20px 0;
        }
        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #e5e7eb;
          color: #1a1f3a;
          border-radius: 50%;
          text-decoration: none;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .social-link:hover {
          background: #667eea;
          color: white;
        }
        .footer-links {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          margin-top: 16px;
        }
        .footer-links a {
          color: #667eea;
          text-decoration: none;
          font-size: 11px;
          margin: 0 8px;
        }
        .footer-links a:hover {
          text-decoration: underline;
        }
        .copyright {
          color: #ccc;
          font-size: 11px;
          margin-top: 16px;
        }
        @media (max-width: 600px) {
          .container {
            border-radius: 0;
          }
          .header {
            padding: 32px 20px;
          }
          .logo-text {
            font-size: 22px;
          }
          .content {
            padding: 24px 20px;
          }
          .footer {
            padding: 24px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo-text">Meme Forge</div>
            <div class="tagline">Support Center</div>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            <p>Merhaba,</p>
            <p style="margin-top: 12px;">Mesajınıza verdiğimiz cevap aşağıdadır:</p>
          </div>

          <!-- Message Container -->
          <div class="message-container">
            <div class="message-label">Support Yanıtı</div>
            <div class="message-box">
              <p>${message}</p>
            </div>
          </div>

          <!-- Signature -->
          <div class="signature-section">
            <div class="signature">
              <p>Saygılarımızla,</p>
              <p class="signature-name">${senderName}</p>
              <p style="margin-top: 4px; font-size: 13px; color: #999999;">Meme Forge Support Team</p>
              <div class="verification-badge">✓ Verified Response</div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="info-box">
            <p><strong>İletişim Desteği:</strong><br>
            Başka sorunuz varsa, bu email'e cevap vererek ya da destek sayfamız üzerinden iletişime geçebilirsiniz.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-brand">Meme Forge</div>
          <div class="footer-description">Kripto Token Platformu</div>
          
          <div class="social-links">
            <a href="https://twitter.com/memeforge" class="social-link" title="Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s1.1 2 5.5 2.75z"/>
              </svg>
            </a>
            <a href="https://discord.gg/memeforge" class="social-link" title="Discord">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.25-.129.599-.129.948v5.439h-3.554s.05-8.736 0-9.646h3.554v1.364c.429-.659 1.196-1.598 2.905-1.598 2.12 0 3.714 1.383 3.714 4.355v5.525zM5.337 8.855a2.06 2.06 0 11.001-4.118 2.058 2.058 0 01-.001 4.118zm1.743 11.597H3.564V9.541h3.516v10.911zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
              </svg>
            </a>
            <a href="https://t.me/memeforge" class="social-link" title="Telegram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.91 3.79L20.3 20.84c-.25 1.1-.98 1.37-1.99.85l-2.8-2.06-1.35 1.3c-.15.15-.27.28-.55.28l.2-2.82 5.14-4.64c.22-.2-.05-.31-.34-.1L6.87 13.5l-2.81-.88c-1.22-.38-1.24-1.23.26-1.83l16.89-6.51c.78-.29 1.47.17 1.2 1.31z"/>
              </svg>
            </a>
          </div>

          <div class="footer-links">
            <a href="https://memeforge.com/privacy">Gizlilik Politikası</a>
            <a href="https://memeforge.com/terms">Kullanım Şartları</a>
            <a href="https://memeforge.com/contact">İletişim</a>
          </div>

          <p class="copyright">© ${currentYear} Meme Forge. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send contact reply email
const sendContactReply = async (contactEmail, subject, message, senderName = 'Meme Forge Support') => {
  try {
    if (!process.env.EMAIL_USER) {
      console.warn('⚠️  EMAIL_USER not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    const htmlTemplate = generateContactReplyTemplate(message, senderName);

    const mailOptions = {
      from: `"${senderName}" <${process.env.EMAIL_USER}>`,
      to: contactEmail,
      subject: `Re: ${subject}`,
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Generate HTML email template for welcome email
const generateWelcomeTemplate = (username) => {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #f5f7fa;
          padding: 20px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%);
          padding: 60px 32px;
          text-align: center;
          color: #ffffff;
          border-bottom: 3px solid #667eea;
        }
        .header-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header-subtitle {
          font-size: 16px;
          color: #667eea;
          font-weight: 600;
        }
        .content {
          padding: 40px 32px;
        }
        .welcome-message {
          color: #1a1f3a;
          font-size: 15px;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .username-highlight {
          color: #667eea;
          font-weight: 600;
        }
        .features-section {
          margin: 32px 0;
        }
        .features-title {
          font-size: 12px;
          font-weight: 700;
          color: #999999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .feature-card {
          background: #f8f9fc;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          border-color: #667eea;
          background: #fafbff;
        }
        .feature-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: white;
        }
        .feature-title {
          color: #1a1f3a;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .feature-desc {
          color: #666666;
          font-size: 12px;
          line-height: 1.5;
        }
        .cta-section {
          margin: 32px 0;
          text-align: center;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 36px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
        }
        .tips-section {
          background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
          border-left: 4px solid #f59e0b;
          padding: 20px;
          border-radius: 4px;
          margin: 24px 0;
        }
        .tips-title {
          color: #b45309;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .tips-content {
          color: #92400e;
          font-size: 13px;
          line-height: 1.7;
        }
        .tips-content strong {
          color: #78350f;
        }
        .divider {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 32px 0;
        }
        .footer {
          background: #f8f9fc;
          padding: 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-brand {
          color: #1a1f3a;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .footer-description {
          color: #999999;
          font-size: 12px;
          margin-bottom: 20px;
        }
        .social-links {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 20px 0;
        }
        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #e5e7eb;
          color: #1a1f3a;
          border-radius: 50%;
          text-decoration: none;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .social-link:hover {
          background: #667eea;
          color: white;
        }
        .footer-links {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          margin-top: 16px;
        }
        .footer-links a {
          color: #667eea;
          text-decoration: none;
          font-size: 11px;
          margin: 0 8px;
        }
        .footer-links a:hover {
          text-decoration: underline;
        }
        .copyright {
          color: #ccc;
          font-size: 11px;
          margin-top: 16px;
        }
        @media (max-width: 600px) {
          .container {
            border-radius: 0;
          }
          .header {
            padding: 40px 20px;
          }
          .header-title {
            font-size: 26px;
          }
          .content {
            padding: 24px 20px;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .footer {
            padding: 24px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-title">Hoşgeldiniz</div>
          <div class="header-subtitle"><span class="username-highlight">${username}</span></div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="welcome-message">
            <p>Merhaba <span class="username-highlight">${username}</span>,</p>
            <p style="margin-top: 12px;">Meme Forge platformuna hoşgeldiniz. Kripto token dünyasında yolculuğunuza başlamaya hazırsınız. Aşağıda başlangıç için temel özellikleri bulabilirsiniz.</p>
          </div>

          <!-- Features Section -->
          <div class="features-section">
            <div class="features-title">Platform Özellikleri</div>
            <div class="features-grid">
              <!-- Feature 1 -->
              <div class="feature-card">
                <div class="feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
                <div class="feature-title">Token Oluştur</div>
                <div class="feature-desc">Dakikalar içinde kendi kripto token'ınızı oluşturun</div>
              </div>

              <!-- Feature 2 -->
              <div class="feature-card">
                <div class="feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div class="feature-title">Trading</div>
                <div class="feature-desc">Hızlı ve güvenli token alıp satın</div>
              </div>

              <!-- Feature 3 -->
              <div class="feature-card">
                <div class="feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div class="feature-title">Topluluk</div>
                <div class="feature-desc">Benzer fikirli kripto meraklılarıyla bağlantı kurun</div>
              </div>

              <!-- Feature 4 -->
              <div class="feature-card">
                <div class="feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div class="feature-title">Analitik</div>
                <div class="feature-desc">Detaylı token analitiği ve raporlar</div>
              </div>
            </div>
          </div>

          <!-- Tips Section -->
          <div class="tips-section">
            <div class="tips-title">Başlangıç İpuçları</div>
            <div class="tips-content">
              <p style="margin-bottom: 8px;"><strong>✓ Profilinizi tamamlayın</strong> – Daha fazla özelliğe erişim sağlayın</p>
              <p style="margin-bottom: 8px;"><strong>✓ İlk token'ınızı oluşturun</strong> – Basit ve kolay adımlarla</p>
              <p><strong>✓ Topluluğa katılın</strong> – Discord kanalımızda diğer kullanıcılarla bağlantı kurun</p>
            </div>
          </div>

          <!-- CTA -->
          <div class="cta-section">
            <a href="https://memeforge.com" class="cta-button">Platforma Git</a>
          </div>

          <div style="text-align: center; font-size: 13px; color: #999999; margin-top: 24px;">
            Sorularınız varsa, destek ekibimiz size yardımcı olmaktan mutlu olacaktır.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-brand">Meme Forge</div>
          <div class="footer-description">Kripto Token Platformu</div>
          
          <div class="social-links">
            <a href="https://twitter.com/memeforge" class="social-link" title="Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s1.1 2 5.5 2.75z"/>
              </svg>
            </a>
            <a href="https://discord.gg/memeforge" class="social-link" title="Discord">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.25-.129.599-.129.948v5.439h-3.554s.05-8.736 0-9.646h3.554v1.364c.429-.659 1.196-1.598 2.905-1.598 2.12 0 3.714 1.383 3.714 4.355v5.525zM5.337 8.855a2.06 2.06 0 11.001-4.118 2.058 2.058 0 01-.001 4.118zm1.743 11.597H3.564V9.541h3.516v10.911zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
              </svg>
            </a>
            <a href="https://t.me/memeforge" class="social-link" title="Telegram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.91 3.79L20.3 20.84c-.25 1.1-.98 1.37-1.99.85l-2.8-2.06-1.35 1.3c-.15.15-.27.28-.55.28l.2-2.82 5.14-4.64c.22-.2-.05-.31-.34-.1L6.87 13.5l-2.81-.88c-1.22-.38-1.24-1.23.26-1.83l16.89-6.51c.78-.29 1.47.17 1.2 1.31z"/>
              </svg>
            </a>
          </div>

          <div class="footer-links">
            <a href="https://memeforge.com/privacy">Gizlilik Politikası</a>
            <a href="https://memeforge.com/terms">Kullanım Şartları</a>
            <a href="https://memeforge.com/contact">İletişim</a>
          </div>

          <p class="copyright">© ${currentYear} Meme Forge. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, username) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.warn('⚠️  EMAIL_USER not configured, skipping welcome email');
      return { success: false };
    }

    const htmlTemplate = generateWelcomeTemplate(username);

    const mailOptions = {
      from: `"Meme Forge" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Meme Forge\'a Hoşgeldiniz! 🚀',
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.response);
    return { success: true };
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    return { success: false };
  }
};

module.exports = {
  transporter,
  sendContactReply,
  sendWelcomeEmail
};
