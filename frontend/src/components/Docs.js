import React, { useState } from 'react';
import { FaRocket, FaPalette, FaDollarSign, FaChartLine, FaCog, FaChevronDown, FaChevronUp, FaShieldAlt, FaExclamationCircle, FaCheckCircle, FaBook, FaQuestionCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Docs = () => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const documentationSections = [
    {
      id: 'getting-started',
      title: 'Başlangıç Rehberi',
      icon: <FaRocket size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'text',
          content: 'BSC Token Factory, Binance Smart Chain üzerinde kolayca token oluşturmanızı sağlayan kullanıcı dostu bir platformdur.'
        },
        {
          type: 'steps',
          title: 'Hızlı Başlangıç',
          steps: [
            'Cüzdanınızı bağlayın (MetaMask veya Trust Wallet)',
            'BSC Mainnet ağına geçiş yapın',
            'Token oluşturma sayfasına gidin',
            'Token bilgilerinizi girin',
            'Paket seçiminizi yapın',
            'Liquidity pool ayarlarınızı yapılandırın',
            'İşlemi onaylayın ve tokenınızı oluşturun'
          ]
        },
        {
          type: 'warning',
          content: 'Token oluşturmak için yeterli BNB bakiyeniz olduğundan emin olun. Gas ücretleri ve paket ücretleri için BNB gereklidir.'
        }
      ]
    },
    {
      id: 'token-creation',
      title: 'Token Oluşturma',
      icon: <FaPalette size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'text',
          content: 'Token oluşturma işlemi 5 adımdan oluşur:'
        },
        {
          type: 'subsections',
          subsections: [
            {
              title: '1. Token Bilgileri',
              content: 'Token adı, sembolü, toplam arz ve ondalık basamak bilgilerini girin. Token logosu yükleyebilirsiniz.'
            },
            {
              title: '2. Paket Seçimi',
              content: 'İhtiyaçlarınıza uygun paketi seçin (Basic, Standard, Premium)'
            },
            {
              title: '3. Liquidity Pool',
              content: 'PancakeSwap için liquidity pool oluşturun ve ayarlarını yapılandırın'
            },
            {
              title: '4. Sosyal Medya',
              content: 'Tokenınızın topluluğunu büyütmek için sosyal medya bağlantılarını ekleyin'
            },
            {
              title: '5. Önizleme',
              content: 'Tüm bilgileri kontrol edin ve token oluşturma işlemini başlatın'
            }
          ]
        }
      ]
    },
    {
      id: 'packages',
      title: 'Paketler ve Ücretler',
      icon: <FaDollarSign size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'text',
          content: '3 farklı paket seçeneği bulunmaktadır:'
        },
        {
          type: 'packages',
          packages: [
            {
              name: 'Basic',
              price: '0.001 BNB',  // %90 İNDİRİM!
              features: [
                'Temel token oluşturma',
                '18 decimal',
                'IPFS metadata',
                'Temel token özellikleri',
                'Tax: %0 (ücretsiz)'
              ],
              color: '#6B7280'
            },
            {
              name: 'Standard',
              price: '0.002 BNB',  // %87 İNDİRİM!
              features: [
                'Tüm Basic özellikleri',
                'Liquidity pool oluşturma',
                '30 gün LP lock',
                'Tax: %3 (Marketing 2% + Liquidity 1%)',
                'Gelişmiş token özellikleri'
              ],
              color: '#3B82F6'
            },
            {
              name: 'Premium',
              price: '0.003 BNB',  // %85 İNDİRİM!
              features: [
                'Tüm Standard özellikleri',
                '90 gün LP lock',
                'Auto-burn özelliği',
                'Premium destek',
                'Öncelikli listeleme',
                'Gelişmiş güvenlik'
              ],
              color: '#F0B90B'
            }
          ]
        },
        {
          type: 'fee-distribution',
          title: 'Fee Dağılımı',
          distribution: [
            { label: 'Platform', percentage: '70%', color: '#F0B90B' },
            { label: 'Geliştirme', percentage: '20%', color: '#10B981' },
            { label: 'Marketing', percentage: '10%', color: '#8B5CF6' }
          ]
        }
      ]
    },
    {
      id: 'liquidity-pool',
      title: 'Liquidity Pool',
      icon: <FaChartLine size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'text',
          content: 'Liquidity pool, tokenınızın PancakeSwap üzerinde işlem görebilmesi için gereklidir.'
        },
        {
          type: 'features',
          title: 'LP Özellikleri',
          features: [
            'Otomatik PancakeSwap listeleme',
            'LP token kilit mekanizması',
            'Başlangıç fiyatı belirleme',
            'Marketing ve liquidity tax ayarları',
            'Auto-burn özelliği (Premium)'
          ]
        },
        {
          type: 'warning',
          content: 'LP tokenları belirlediğiniz süre boyunca kilitlenecektir. Bu süre içinde liquidity çekemezsiniz.'
        },
        {
          type: 'recommendations',
          title: 'Öneriler',
          items: [
            'LP için token miktarını toplam arzın %30-70 arasında tutun',
            'BNB miktarını gerçekçi belirleyin',
            'Tax oranlarını %15\'i geçmeyecek şekilde ayarlayın',
            'LP kilit süresini en az 30 gün yapın'
          ]
        }
      ]
    },
    {
      id: 'security',
      title: 'Güvenlik',
      icon: <FaShieldAlt size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'text',
          content: 'Token güvenliği ve kontrat güvenliği en önemli önceliğimizdir.'
        },
        {
          type: 'security-features',
          features: [
            {
              title: 'Denetlenmiş Kontratlar',
              description: 'Tüm token kontratları güvenlik denetimlerinden geçmiştir'
            },
            {
              title: 'LP Kilit',
              description: 'Liquidity pool tokenları belirlenen süre boyunca güvende'
            },
            {
              title: 'Güvenli Cüzdan Bağlantısı',
              description: 'Cüzdan bilgileriniz asla saklanmaz'
            },
            {
              title: 'Anti-Honeypot',
              description: 'Tokenlarınız honeypot korumasına sahiptir'
            }
          ]
        },
        {
          type: 'best-practices',
          title: 'En İyi Uygulamalar',
          items: [
            'Private key\'lerinizi asla paylaşmayın',
            'Resmi web sitemiz dışında işlem yapmayın',
            'Token oluştururken gas ücretlerini kontrol edin',
            'LP kilit süresini uzun tutun'
          ]
        }
      ]
    },
    {
      id: 'trading',
      title: 'Trade ve Analiz',
      icon: <FaChartLine size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'text',
          content: 'Token detay sayfasında gerçek zamanlı trade ve analiz özellikleri bulunur.'
        },
        {
          type: 'features',
          title: 'Trade Özellikleri',
          features: [
            'Gerçek zamanlı fiyat takibi',
            'DexScreener entegrasyonu',
            'Canlı trade listesi',
            'Wallet bağlama ve swap',
            'Detaylı chart analizi'
          ]
        },
        {
          type: 'subsections',
          subsections: [
            {
              title: 'Token Analizi',
              content: 'Market cap, volume, holders, price change gibi metrikleri takip edin'
            },
            {
              title: 'Güvenlik Kontrolü',
              content: 'Token güvenlik durumunu ve honeypot kontrolünü görün'
            },
            {
              title: 'Topluluk Etkileşimi',
              content: 'Sosyal skor ve topluluk aktivitesini izleyin'
            }
          ]
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Sorun Giderme',
      icon: <FaCog size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'faq',
          questions: [
            {
              question: 'Cüzdanımı bağlayamıyorum',
              answer: 'MetaMask veya Trust Wallet kurulu olduğundan emin olun. BSC Mainnet ağına geçiş yapın.'
            },
            {
              question: 'Token oluşturma işlemi başarısız oldu',
              answer: 'BNB bakiyenizi kontrol edin. Gas ücreti için yeterli BNB\'nız olduğundan emin olun.'
            },
            {
              question: 'Tokenım PancakeSwap\'te görünmüyor',
              answer: 'Liquidity pool oluşturduysanız, kontrat adresini manuel olarak eklemeniz gerekebilir.'
            },
            {
              question: 'LP tokenlarımı ne zaman çekebilirim?',
              answer: 'Belirlediğiniz kilit süresi dolduktan sonra LP tokenlarınızı çekebilirsiniz.'
            }
          ]
        },
        {
          type: 'contact',
          title: 'Destek',
          content: 'Sorularınız için Telegram grubumuza katılabilir veya ticket oluşturabilirsiniz.'
        }
      ]
    },
    {
      id: 'api',
      title: 'API ve Geliştirici',
      icon: <FaCog size={24} style={{color: '#F0B90B'}} />,
      content: [
        {
          type: 'text',
          content: 'Geliştiriciler için API dokümantasyonu ve entegrasyon rehberi.'
        },
        {
          type: 'endpoints',
          title: 'API Endpoints',
          endpoints: [
            {
              method: 'GET',
              path: '/api/tokens',
              description: 'Tüm tokenları listele'
            },
            {
              method: 'POST',
              path: '/api/tokens/create',
              description: 'Yeni token oluştur'
            },
            {
              method: 'GET',
              path: '/api/tokens/:address',
              description: 'Token detaylarını getir'
            },
            {
              method: 'GET',
              path: '/api/trades/:tokenAddress',
              description: 'Token trade geçmişini getir'
            }
          ]
        },
        {
          type: 'code-example',
          title: 'Örnek Kullanım',
          language: 'javascript',
          code: `// Token oluşturma örneği
const createToken = async (tokenData) => {
  const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/tokens/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tokenData)
  });
  return await response.json();
};`
        }
      ]
    }
  ];

  const renderContent = (content) => {
    return content.map((item, index) => {
      switch (item.type) {
        case 'text':
          return <p key={index} className="doc-text">{item.content}</p>;
        
        case 'steps':
          return (
            <div key={index} className="steps-container">
              <h4 className="steps-title">{item.title}</h4>
              <ol className="steps-list">
                {item.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="step-item">
                    <span className="step-number">{stepIndex + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          );
        
        case 'warning':
          return (
            <div key={index} className="warning-box">
              <FaExclamationCircle size={20} />
              <span>{item.content}</span>
            </div>
          );
        
        case 'subsections':
          return (
            <div key={index} className="subsections-container">
              {item.subsections.map((subsection, subIndex) => (
                <div key={subIndex} className="subsection">
                  <h5 className="subsection-title">{subsection.title}</h5>
                  <p className="subsection-content">{subsection.content}</p>
                </div>
              ))}
            </div>
          );
        
        case 'packages':
          return (
            <div key={index} className="packages-grid">
              {item.packages.map((pkg, pkgIndex) => (
                <div key={pkgIndex} className="package-card" style={{ borderColor: pkg.color }}>
                  <div className="package-header" style={{ background: pkg.color }}>
                    <h4 className="package-name">{pkg.name}</h4>
                    <div className="package-price">{pkg.price}</div>
                  </div>
                  <div className="package-features">
                    {pkg.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="feature-item">
                        <FaCheckCircle size={16} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        
        case 'fee-distribution':
          return (
            <div key={index} className="fee-distribution">
              <h4 className="distribution-title">{item.title}</h4>
              <div className="distribution-bars">
                {item.distribution.map((dist, distIndex) => (
                  <div key={distIndex} className="distribution-item">
                    <div className="distribution-label">
                      <span>{dist.label}</span>
                      <span>{dist.percentage}</span>
                    </div>
                    <div className="distribution-bar">
                      <div 
                        className="distribution-fill"
                        style={{ 
                          width: dist.percentage,
                          backgroundColor: dist.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'features':
          return (
            <div key={index} className="features-list">
              <h4 className="features-title">{item.title}</h4>
              <ul>
                {item.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="feature-item-simple">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        
        case 'recommendations':
          return (
            <div key={index} className="recommendations-box">
              <h4 className="recommendations-title">{item.title}</h4>
              <ul>
                {item.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          );
        
        case 'security-features':
          return (
            <div key={index} className="security-features">
              {item.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="security-feature">
                  <h5 className="security-feature-title">{feature.title}</h5>
                  <p className="security-feature-desc">{feature.description}</p>
                </div>
              ))}
            </div>
          );
        
        case 'best-practices':
          return (
            <div key={index} className="best-practices">
              <h4 className="practices-title">{item.title}</h4>
              <ul>
                {item.items.map((practice, practiceIndex) => (
                  <li key={practiceIndex}>{practice}</li>
                ))}
              </ul>
            </div>
          );
        
        case 'faq':
          return (
            <div key={index} className="faq-section">
              {item.questions.map((faq, faqIndex) => (
                <div key={faqIndex} className="faq-item">
                  <h5 className="faq-question">Q: {faq.question}</h5>
                  <p className="faq-answer">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          );
        
        case 'contact':
          return (
            <div key={index} className="contact-box">
              <h4 className="contact-title">{item.title}</h4>
              <p>{item.content}</p>
              <div className="contact-links">
                <a href="https://t.me/bsc_token_factory" className="contact-link">
                  📢 Telegram Group
                </a>
                <a href="mailto:support@bsctokenfactory.com" className="contact-link">
                  ✉️ Email Support
                </a>
              </div>
            </div>
          );
        
        case 'endpoints':
          return (
            <div key={index} className="endpoints-section">
              <h4 className="endpoints-title">{item.title}</h4>
              <div className="endpoints-list">
                {item.endpoints.map((endpoint, endpointIndex) => (
                  <div key={endpointIndex} className="endpoint-item">
                    <span className={`endpoint-method ${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>
                    <span className="endpoint-path">{endpoint.path}</span>
                    <span className="endpoint-desc">{endpoint.description}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'code-example':
          return (
            <div key={index} className="code-section">
              <h4 className="code-title">{item.title}</h4>
              <pre className="code-block">
                <code>{item.code}</code>
              </pre>
            </div>
          );
        
        default:
          return null;
      }
    });
  };

  return (
    <div className="docs-container">
      <style>{`
        .docs-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #FFFFFF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .docs-header {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1rem 2rem 1rem;
          text-align: center;
        }

        .docs-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #F0B90B, #F8D33A, #F0B90B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .docs-subtitle {
          font-size: clamp(1rem, 3vw, 1.3rem);
          color: #CBD5E1;
          margin: 0 0 2rem 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .quick-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .quick-action-btn {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
          border: 1px solid rgba(240, 185, 11, 0.3);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quick-action-btn:hover {
          background: rgba(240, 185, 11, 0.2);
          transform: translateY(-2px);
        }

        .docs-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem 4rem 1rem;
        }

        .docs-sections {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .docs-section {
          background: rgba(43, 47, 54, 0.8);
          border: 1px solid rgba(240, 185, 11, 0.2);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .docs-section:hover {
          border-color: rgba(240, 185, 11, 0.4);
        }

        .section-header {
          padding: 1.5rem 2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background-color 0.3s ease;
        }

        .section-header:hover {
          background: rgba(240, 185, 11, 0.05);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0;
        }

        .section-icon {
          color: #F0B90B;
        }

        .section-toggle {
          color: #CBD5E1;
          transition: transform 0.3s ease;
        }

        .section-content {
          padding: 0 2rem;
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .section-content.open {
          padding: 0 2rem 2rem 2rem;
          max-height: 5000px;
        }

        .doc-text {
          color: #CBD5E1;
          line-height: 1.7;
          margin: 0 0 1.5rem 0;
          font-size: 1rem;
        }

        .steps-container {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          border: 1px solid rgba(240, 185, 11, 0.1);
        }

        .steps-title {
          color: #F0B90B;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 0;
          padding: 0;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          color: #CBD5E1;
        }

        .step-number {
          background: #F0B90B;
          color: #1E2026;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .warning-box {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #EF4444;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }

        .subsections-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .subsection {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .subsection-title {
          color: #F0B90B;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .subsection-content {
          color: #CBD5E1;
          margin: 0;
          line-height: 1.6;
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .package-card {
          background: rgba(30, 32, 38, 0.8);
          border-radius: 16px;
          border: 2px solid;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .package-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .package-header {
          padding: 1.5rem;
          text-align: center;
          color: #1E2026;
        }

        .package-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .package-price {
          font-size: 1.3rem;
          font-weight: 700;
        }

        .package-features {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #CBD5E1;
          font-size: 0.9rem;
        }

        .feature-item svg {
          color: #10B981;
          flex-shrink: 0;
        }

        .fee-distribution {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          border: 1px solid rgba(240, 185, 11, 0.2);
        }

        .distribution-title {
          color: #F0B90B;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .distribution-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .distribution-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .distribution-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #CBD5E1;
          font-weight: 600;
        }

        .distribution-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .distribution-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .features-list {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          border: 1px solid rgba(240, 185, 11, 0.1);
        }

        .features-title {
          color: #F0B90B;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .features-list ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #CBD5E1;
        }

        .feature-item-simple {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .recommendations-box {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
        }

        .recommendations-title {
          color: #10B981;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .recommendations-box ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #CBD5E1;
        }

        .recommendations-box li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .security-features {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .security-feature {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .security-feature-title {
          color: #F0B90B;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .security-feature-desc {
          color: #CBD5E1;
          margin: 0;
          line-height: 1.6;
        }

        .best-practices {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
        }

        .practices-title {
          color: #3B82F6;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .best-practices ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #CBD5E1;
        }

        .best-practices li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .faq-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .faq-item {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .faq-question {
          color: #F0B90B;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
        }

        .faq-answer {
          color: #CBD5E1;
          margin: 0;
          line-height: 1.6;
        }

        .contact-box {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          text-align: center;
        }

        .contact-title {
          color: #8B5CF6;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .contact-links {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .contact-link {
          background: rgba(139, 92, 246, 0.2);
          color: #8B5CF6;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .contact-link:hover {
          background: rgba(139, 92, 246, 0.3);
          transform: translateY(-2px);
        }

        .endpoints-section {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          border: 1px solid rgba(240, 185, 11, 0.1);
        }

        .endpoints-title {
          color: #F0B90B;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .endpoints-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .endpoint-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .endpoint-method {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .endpoint-method.get {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .endpoint-method.post {
          background: rgba(59, 130, 246, 0.2);
          color: #3B82F6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .endpoint-path {
          color: #F0B90B;
          font-family: monospace;
          font-weight: 600;
        }

        .endpoint-desc {
          color: #CBD5E1;
          flex: 1;
          text-align: right;
        }

        .code-section {
          background: rgba(30, 32, 38, 0.8);
          padding: 1.5rem;
          border-radius: 12px;
          margin: 1.5rem 0;
          border: 1px solid rgba(240, 185, 11, 0.2);
        }

        .code-title {
          color: #F0B90B;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .code-block {
          background: #1E2026;
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .code-block code {
          color: #CBD5E1;
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .docs-header {
            padding: 2rem 1rem 1rem 1rem;
          }

          .quick-actions {
            flex-direction: column;
            align-items: center;
          }

          .quick-action-btn {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }

          .section-header {
            padding: 1.25rem 1.5rem;
          }

          .section-content {
            padding: 0 1.5rem;
          }

          .section-content.open {
            padding: 0 1.5rem 1.5rem 1.5rem;
          }

          .packages-grid {
            grid-template-columns: 1fr;
          }

          .endpoint-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .endpoint-desc {
            text-align: left;
            width: 100%;
          }

          .contact-links {
            flex-direction: column;
          }

          .contact-link {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .section-header {
            padding: 1rem 1.25rem;
          }

          .section-title {
            font-size: 1.1rem;
          }

          .section-content {
            padding: 0 1.25rem;
          }

          .section-content.open {
            padding: 0 1.25rem 1.25rem 1.25rem;
          }
        }
      `}</style>

      <div className="docs-header">
        <h1 className="docs-title">📚 Dokümantasyon</h1>
        <p className="docs-subtitle">
          BSC Token Factory platformunu en iyi şekilde kullanmak için kapsamlı rehber ve dokümantasyon
        </p>
        
        <div className="quick-actions">
          <Link to="/create" className="quick-action-btn">
            <FaRocket size={20} />
            Token Oluştur
          </Link>
          <a href="#getting-started" className="quick-action-btn">
            <FaBook size={20} />
            Başlangıç Rehberi
          </a>
          <a href="#troubleshooting" className="quick-action-btn">
            <FaQuestionCircle size={20} />
            Sorun Giderme
          </a>
        </div>
      </div>

      <div className="docs-content">
        <div className="docs-sections">
          {documentationSections.map((section) => (
            <div key={section.id} className="docs-section" id={section.id}>
              <div 
                className="section-header"
                onClick={() => toggleSection(section.id)}
              >
                <h2 className="section-title">
                  <span className="section-icon">{section.icon}</span>
                  {section.title}
              </h2>
              <div className="section-toggle">
                {openSections[section.id] ? <FaChevronUp size={24} /> : <FaChevronDown size={24} />}
              </div>
            </div>              <div className={`section-content ${openSections[section.id] ? 'open' : ''}`}>
                {renderContent(section.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Docs;

