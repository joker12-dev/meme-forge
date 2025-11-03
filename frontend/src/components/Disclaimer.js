import React from 'react';
import { FaExclamationTriangle, FaShieldAlt, FaChartLine, FaUserShield, FaGavel, FaLightbulb } from 'react-icons/fa';
import './LegalPages.css';

const Disclaimer = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <FaExclamationTriangle className="legal-icon" />
          <h1>Sorumluluk Reddi</h1>
          <p className="legal-subtitle">Son Güncelleme: 20 Ekim 2024</p>
        </div>

        <div className="legal-content">
          <div className="critical-warning">
            <FaExclamationTriangle className="warning-icon" />
            <div>
              <h2>ÖNEMLİ UYARI</h2>
              <p>
                Bu platform ve sunduğu hizmetler yüksek riskler içermektedir. 
                Platformu kullanmadan önce bu sorumluluk reddini dikkatlice okuyun 
                ve anladığınızdan emin olun. Kaybetmeyi göze alamayacağınız parayı 
                asla yatırmayın.
              </p>
            </div>
          </div>

          <section className="legal-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2>1. Genel Sorumluluk Reddi</h2>
            </div>
            <p>
              Meme Token Platform ("Platform"), token oluşturma ve yönetim araçları 
              sağlar ancak finansal tavsiye, yatırım önerisi veya herhangi bir tür 
              profesyonel danışmanlık hizmeti SUNMAZ.
            </p>
            <ul>
              <li>Platform, eğitim ve bilgilendirme amaçlıdır</li>
              <li>İçerik "OLDUĞU GİBİ" ve "MEVCUT OLDUĞU HALDE" sunulmaktadır</li>
              <li>Hiçbir türde garanti verilmemektedir (açık veya zımni)</li>
              <li>Kullanım riski tamamen kullanıcıya aittir</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaChartLine className="section-icon" />
              <h2>2. Yatırım Riski Uyarısı</h2>
            </div>
            
            <div className="warning-box">
              <FaExclamationTriangle />
              <div>
                <h3>Kripto Para Riskleri</h3>
                <ul>
                  <li><strong>Aşırı Volatilite:</strong> Kripto paralar aşırı fiyat dalgalanmalarına tabidir</li>
                  <li><strong>Toplam Kayıp Riski:</strong> Yatırımınızın tamamını kaybedebilirsiniz</li>
                  <li><strong>Likidite Riski:</strong> Tokenları satamayabilir veya takas edemeyebilirsiniz</li>
                  <li><strong>Teknoloji Riski:</strong> Akıllı kontratlarda hatalar olabilir</li>
                  <li><strong>Düzenleyici Risk:</strong> Yasal statü değişebilir</li>
                  <li><strong>Dolandırıcılık Riski:</strong> Scam ve pump & dump şemaları yaygındır</li>
                </ul>
              </div>
            </div>

            <p className="highlight-text">
              <strong>UYARI:</strong> Bu platform üzerinden oluşturulan hiçbir token, 
              güvenlik, emtia, hisse senedi veya başka bir düzenlenmiş finansal araç 
              olarak kabul edilmemeli ve bu şekilde kullanılmamalıdır.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaLightbulb className="section-icon" />
              <h2>3. Finansal Tavsiye Değildir</h2>
            </div>
            <p>
              Platform üzerinde sağlanan hiçbir bilgi, içerik veya araç, finansal, 
              yatırım, vergi veya yasal tavsiye olarak yorumlanmamalıdır:
            </p>
            <ul>
              <li>Platformda listelenen tokenlar, onay veya tavsiye anlamına gelmez</li>
              <li>Fiyat tahminleri veya analizler garanti değildir</li>
              <li>Geçmiş performans gelecek sonuçların göstergesi değildir</li>
              <li>Her kullanıcının durumu farklıdır ve profesyonel danışmanlık almalıdır</li>
            </ul>
            <div className="info-box">
              <p>
                <strong>Tavsiye:</strong> Herhangi bir yatırım kararı almadan önce, 
                lisanslı bir finansal danışman, vergi danışmanı veya hukuk danışmanı 
                ile görüşün.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2>4. Teknik ve Güvenlik Sorumluluk Reddi</h2>
            </div>
            
            <h3>4.1 Akıllı Kontrat Riskleri</h3>
            <ul>
              <li>Akıllı kontratlar kod hataları içerebilir</li>
              <li>Güvenlik açıkları keşfedilebilir ve exploit edilebilir</li>
              <li>Denetimler yapılsa bile, tüm riskleri ortadan kaldırmaz</li>
              <li>Blockchain işlemleri geri alınamaz</li>
            </ul>

            <h3>4.2 Platform Garantileri</h3>
            <p>Platform aşağıdaki garantileri VERMEZ:</p>
            <ul>
              <li>Kesintisiz veya hatasız çalışma</li>
              <li>Hataların düzeltileceği</li>
              <li>Virüs veya zararlı bileşen içermediği</li>
              <li>Güvenlik ihlallerine karşı koruma</li>
              <li>Üçüncü taraf hizmetlerin güvenilirliği</li>
            </ul>

            <h3>4.3 Network Riskleri</h3>
            <div className="warning-box">
              <FaExclamationTriangle />
              <div>
                <ul>
                  <li>Blockchain network'ü konjesyona uğrayabilir</li>
                  <li>Gas ücretleri öngörülemez şekilde artabilir</li>
                  <li>İşlemler başarısız olabilir ancak ücretler ödenebilir</li>
                  <li>Network fork'ları veya güncellemeleri etkileyebilir</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaUserShield className="section-icon" />
              <h2>5. Kullanıcı Sorumluluğu</h2>
            </div>
            <p>
              Kullanıcı olarak, aşağıdakilerden tamamen siz sorumlusunuz:
            </p>
            <ul>
              <li><strong>Due Diligence:</strong> Herhangi bir tokene yatırım yapmadan önce araştırma yapmak</li>
              <li><strong>Güvenlik:</strong> Özel anahtarlarınızı ve cüzdan bilgilerinizi korumak</li>
              <li><strong>Yasal Uyum:</strong> Yerel yasalara ve düzenlemelere uymak</li>
              <li><strong>Vergi Yükümlülükleri:</strong> Vergi beyannamesi ve ödeme sorumluluğu</li>
              <li><strong>Risk Yönetimi:</strong> Yatırım risklerini anlamak ve yönetmek</li>
              <li><strong>Bilgilenme:</strong> Platform güncellemelerini ve duyurularını takip etmek</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaGavel className="section-icon" />
              <h2>6. Yasal ve Düzenleyici Uyarılar</h2>
            </div>
            
            <h3>6.1 Düzenleyici Belirsizlik</h3>
            <p>
              Kripto para düzenlemeleri ülkeden ülkeye değişir ve hızla gelişmektedir. 
              Mevcut yasal düzenlemeler:
            </p>
            <ul>
              <li>Net veya tutarlı olmayabilir</li>
              <li>Öngörülemez şekilde değişebilir</li>
              <li>Tokenlerin yasal statüsünü etkileyebilir</li>
              <li>Platform operasyonlarını sınırlayabilir</li>
            </ul>

            <h3>6.2 Yetki Alanı Kısıtlamaları</h3>
            <div className="warning-box">
              <FaExclamationTriangle />
              <div>
                <p>
                  Platform, kripto para ticaretinin veya token oluşturmanın yasaklandığı 
                  veya kısıtlandığı yetki alanlarındaki kullanıcılara hizmet vermeyebilir. 
                  Yerel yasalarınızı kontrol etmek sizin sorumluluğunuzdadır.
                </p>
              </div>
            </div>

            <h3>6.3 Lisans ve Kayıt</h3>
            <p>
              Platform, belirli yetki alanlarında gerekli olabilecek finansal hizmet 
              lisanslarına sahip olmayabilir. Platfor:
            </p>
            <ul>
              <li>Broker-dealer değildir</li>
              <li>Yatırım danışmanı değildir</li>
              <li>Mali kurum değildir</li>
              <li>Borsa veya ticaret platformu değildir</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaExclamationTriangle className="section-icon" />
              <h2>7. Üçüncü Taraf Riskleri</h2>
            </div>
            <p>
              Platform, üçüncü taraf hizmetlere bağlıdır ve bunlardan sorumlu değildir:
            </p>
            <ul>
              <li><strong>Cüzdan Sağlayıcıları:</strong> MetaMask, Trust Wallet vb.</li>
              <li><strong>Blockchain Network:</strong> Binance Smart Chain</li>
              <li><strong>DeFi Protokoller:</strong> PancakeSwap, DEX'ler</li>
              <li><strong>Oracle Servisleri:</strong> Fiyat feedleri</li>
              <li><strong>IPFS/Arweave:</strong> Dosya depolama</li>
            </ul>
            <p>
              Bu hizmetlerdeki kesintiler, hatalar veya güvenlik ihlalleri platformu 
              ve tokenları etkileyebilir.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2>8. Dolandırıcılık ve Scam Uyarısı</h2>
            </div>
            <div className="critical-warning">
              <FaExclamationTriangle className="warning-icon" />
              <div>
                <h3>Yaygın Dolandırıcılık Türleri</h3>
                <ul>
                  <li><strong>Rug Pull:</strong> Geliştiriciler likiditeyi çeker ve kaçar</li>
                  <li><strong>Pump & Dump:</strong> Koordineli fiyat manipülasyonu</li>
                  <li><strong>Honeypot:</strong> Satış yapılamayan tokenlar</li>
                  <li><strong>Phishing:</strong> Sahte siteler ve cüzdan dolandırıcılığı</li>
                  <li><strong>Ponzi Şemaları:</strong> Sürdürülemez "garantili" getiriler</li>
                </ul>
                <p className="highlight-text">
                  <strong>DİKKAT:</strong> Platform, tokenlerin meşruiyetini doğrulamaz. 
                  Her zaman kendi araştırmanızı yapın (DYOR - Do Your Own Research).
                </p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaGavel className="section-icon" />
              <h2>9. Sorumluluk Sınırlaması</h2>
            </div>
            <p>
              Yasaların izin verdiği maksimum ölçüde, Platform ve operatörleri 
              aşağıdakilerden SORUMLU DEĞİLDİR:
            </p>
            <ul>
              <li>Doğrudan veya dolaylı finansal kayıplar</li>
              <li>Token değer kaybı veya likidite eksikliği</li>
              <li>Akıllı kontrat hataları veya exploitler</li>
              <li>Dolandırıcılık veya hırsızlık</li>
              <li>Network kesintileri veya gecikmeler</li>
              <li>Veri kaybı veya bozulması</li>
              <li>Üçüncü taraf eylemleri veya ihmalleri</li>
              <li>Yasal veya düzenleyici değişiklikler</li>
              <li>Fırsat maliyeti veya kayıp kar</li>
            </ul>
            <div className="info-box">
              <p>
                <strong>Maksimum Sorumluluk:</strong> Her durumda, toplam sorumluluğumuz 
                son 12 ayda platforma ödediğiniz ücretlerin %100'ü ile sınırlıdır.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaLightbulb className="section-icon" />
              <h2>10. En İyi Uygulamalar</h2>
            </div>
            <p>
              Riskleri minimize etmek için şu önerileri takip edin:
            </p>
            <ul>
              <li>✅ Kaybetmeyi göze alamayacağınız parayı yatırmayın</li>
              <li>✅ Portföyünüzü çeşitlendirin</li>
              <li>✅ Tokenları dağıtmadan önce kontratı denetleyin</li>
              <li>✅ Küçük testler ile başlayın</li>
              <li>✅ Özel anahtarlarınızı asla paylaşmayın</li>
              <li>✅ İki faktörlü kimlik doğrulama kullanın</li>
              <li>✅ Donanım cüzdanları kullanmayı düşünün</li>
              <li>✅ Düzenli olarak güvenlik güncellemelerini kontrol edin</li>
              <li>✅ Şüpheli projelere ve "garanti" getiri vaatlerine dikkat edin</li>
              <li>✅ Profesyonel danışmanlık alın</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaUserShield className="section-icon" />
              <h2>11. Güncellemeler ve Değişiklikler</h2>
            </div>
            <p>
              Bu sorumluluk reddi bildirimde bulunmaksızın güncellenebilir. 
              Önemli değişiklikler platform üzerinden duyurulacaktır. Platformu 
              kullanmaya devam ederek, güncellenmiş sorumluluk reddini kabul 
              etmiş olursunuz.
            </p>
            <p>
              Bu belgeyi düzenli olarak gözden geçirmeniz önerilir.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaGavel className="section-icon" />
              <h2>12. Onay ve Kabul</h2>
            </div>
            <div className="critical-warning">
              <FaExclamationTriangle className="warning-icon" />
              <div>
                <p>
                  Platformu kullanarak, aşağıdakileri ONAYLAMIŞ ve KABUL ETMİŞ olursunuz:
                </p>
                <ul>
                  <li>Bu sorumluluk reddini tamamen okuduğunuzu ve anladığınızı</li>
                  <li>Kripto para risklerinin farkında olduğunuzu</li>
                  <li>Kendi araştırmanızı yaptığınızı veya yapacağınızı</li>
                  <li>Profesyonel tavsiye almanız gerektiğini anladığınızı</li>
                  <li>Tüm riskleri kabul ettiğinizi</li>
                  <li>Platform ve operatörlerinin sorumlu olmadığını kabul ettiğinizi</li>
                  <li>Kaybetmeyi göze alabileceğiniz paralarla işlem yaptığınızı</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="legal-footer">
            <p className="final-warning">
              <strong>SON UYARI:</strong> Kripto paralar ve DeFi protokolleri yüksek risklidir. 
              Bu belgedeki tüm uyarıları ciddiye alın. Anlayamadığınız veya uygun olmayan 
              yatırımlardan kaçının. Şüphe duyduğunuzda profesyonel danışmanlık alın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;

