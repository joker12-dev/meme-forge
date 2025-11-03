import React from 'react';
import { FaShieldAlt, FaLock, FaUserShield, FaCookie, FaDatabase, FaEnvelope } from 'react-icons/fa';
import './LegalPages.css';

const Privacy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <FaShieldAlt className="legal-icon" />
          <h1>Gizlilik Politikası</h1>
          <p className="legal-subtitle">Son Güncelleme: 20 Ekim 2024</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <div className="section-header">
              <FaUserShield className="section-icon" />
              <h2>1. Genel Bakış</h2>
            </div>
            <p>
              Meme Token Platform olarak, kullanıcılarımızın gizliliğine saygı duyuyor ve 
              kişisel verilerinizi korumak için gerekli tüm önlemleri alıyoruz. Bu gizlilik 
              politikası, platformumuzu kullanırken toplanan, işlenen ve saklanan verileri 
              açıklamaktadır.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaDatabase className="section-icon" />
              <h2>2. Toplanan Bilgiler</h2>
            </div>
            
            <h3>2.1 Otomatik Olarak Toplanan Bilgiler</h3>
            <ul>
              <li><strong>Cüzdan Adresi:</strong> MetaMask veya diğer Web3 cüzdanlarınızın genel adresi</li>
              <li><strong>İşlem Verileri:</strong> Blockchain üzerindeki token oluşturma ve işlem geçmişi</li>
              <li><strong>Kullanım Verileri:</strong> Platform kullanım istatistikleri ve etkileşim verileri</li>
              <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgileri</li>
            </ul>

            <h3>2.2 Kullanıcı Tarafından Sağlanan Bilgiler</h3>
            <ul>
              <li><strong>Token Bilgileri:</strong> Oluşturduğunuz tokenların adı, sembolü, logosu</li>
              <li><strong>Sosyal Medya Linkleri:</strong> Token sayfasında paylaşılan opsiyonel linkler</li>
              <li><strong>İletişim Bilgileri:</strong> Destek talebi oluşturduğunuzda sağlanan e-posta</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaLock className="section-icon" />
              <h2>3. Bilgilerin Kullanımı</h2>
            </div>
            <p>Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:</p>
            <ul>
              <li>Platform hizmetlerini sağlamak ve iyileştirmek</li>
              <li>Token oluşturma ve yönetim işlemlerini gerçekleştirmek</li>
              <li>Kullanıcı deneyimini kişiselleştirmek ve optimize etmek</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
              <li>Yasal yükümlülüklere uymak</li>
              <li>Kullanıcı desteği sağlamak</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaCookie className="section-icon" />
              <h2>4. Çerezler ve Takip Teknolojileri</h2>
            </div>
            <p>
              Platformumuz, kullanıcı deneyimini geliştirmek için çerezler ve benzeri 
              teknolojiler kullanır:
            </p>
            <ul>
              <li><strong>Zorunlu Çerezler:</strong> Platform işlevselliği için gerekli</li>
              <li><strong>Analitik Çerezler:</strong> Kullanım istatistiklerini toplar</li>
              <li><strong>Tercih Çerezleri:</strong> Kullanıcı ayarlarını saklar</li>
            </ul>
            <p>
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya reddedebilirsiniz. 
              Ancak, bazı özelliklerin çalışması için çerezler gerekli olabilir.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2>5. Veri Güvenliği</h2>
            </div>
            <p>Verilerinizi korumak için aşağıdaki önlemleri alıyoruz:</p>
            <ul>
              <li>SSL/TLS şifreleme ile güvenli veri aktarımı</li>
              <li>Güvenli sunucu altyapısı ve düzenli güvenlik güncellemeleri</li>
              <li>Erişim kontrolü ve yetkilendirme mekanizmaları</li>
              <li>Düzenli güvenlik denetimleri ve izleme</li>
              <li>Veri minimizasyonu prensipleri</li>
            </ul>
            <div className="info-box">
              <p>
                <strong>Önemli Not:</strong> Blockchain üzerindeki işlemler herkese açık ve 
                değiştirilemezdir. Cüzdan adresiniz ve işlemleriniz blockchain gezginlerinde 
                görüntülenebilir.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaDatabase className="section-icon" />
              <h2>6. Veri Saklama</h2>
            </div>
            <p>
              Kişisel verilerinizi yalnızca gerekli olduğu süre boyunca saklarız. 
              Token verileri blockchain üzerinde kalıcı olarak saklanır. Platform 
              veritabanındaki diğer veriler için:
            </p>
            <ul>
              <li>Aktif kullanıcı verileri: Hesap silinene kadar</li>
              <li>İşlem kayıtları: Yasal gereklilikler doğrultusunda</li>
              <li>Log dosyaları: 90 gün</li>
              <li>Analitik veriler: 24 ay</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaUserShield className="section-icon" />
              <h2>7. Kullanıcı Hakları</h2>
            </div>
            <p>KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul>
              <li><strong>Erişim Hakkı:</strong> Hangi verilerinizin işlendiğini öğrenme</li>
              <li><strong>Düzeltme Hakkı:</strong> Yanlış verilerin düzeltilmesini talep etme</li>
              <li><strong>Silme Hakkı:</strong> Verilerinizin silinmesini talep etme</li>
              <li><strong>İtiraz Hakkı:</strong> Veri işlemeye itiraz etme</li>
              <li><strong>Taşınabilirlik Hakkı:</strong> Verilerinizi başka bir platforma aktarma</li>
              <li><strong>Otomatik Karar Alma:</strong> Otomatik kararlara itiraz etme</li>
            </ul>
            <p>
              Haklarınızı kullanmak için <a href="mailto:privacy@memetoken.com">privacy@memetoken.com</a> 
              adresinden bizimle iletişime geçebilirsiniz.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaEnvelope className="section-icon" />
              <h2>8. Üçüncü Taraf Paylaşımı</h2>
            </div>
            <p>
              Verilerinizi üçüncü taraflarla paylaşmıyoruz. Ancak, aşağıdaki durumlar istisnadır:
            </p>
            <ul>
              <li><strong>Blockchain Ağı:</strong> İşlemler halka açık blockchain'de kaydedilir</li>
              <li><strong>Hizmet Sağlayıcılar:</strong> Hosting, analitik gibi teknik hizmetler</li>
              <li><strong>Yasal Yükümlülükler:</strong> Yasal talep veya mahkeme kararı durumunda</li>
            </ul>
            <p>
              Tüm üçüncü taraf hizmet sağlayıcılarımız veri koruma anlaşmalarına tabidir.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2>9. Çocukların Gizliliği</h2>
            </div>
            <p>
              Platformumuz 18 yaşın altındaki kullanıcılara yönelik değildir. Bilerek 
              18 yaşın altındaki bireylerden kişisel veri toplamıyoruz. Ebeveyn veya 
              vasi olarak, çocuğunuzun izinsiz veri sağladığını fark ederseniz, 
              lütfen bizimle iletişime geçin.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaLock className="section-icon" />
              <h2>10. Politika Değişiklikleri</h2>
            </div>
            <p>
              Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler 
              durumunda, platform üzerinde bildirim yapacağız. Politika değişikliklerini 
              düzenli olarak gözden geçirmenizi öneririz.
            </p>
            <p>
              Güncellemeler bu sayfada yayınlanacak ve "Son Güncelleme" tarihi değişecektir.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaEnvelope className="section-icon" />
              <h2>11. İletişim</h2>
            </div>
            <p>
              Gizlilik politikamız hakkında sorularınız veya endişeleriniz varsa, 
              bizimle iletişime geçebilirsiniz:
            </p>
            <div className="contact-info">
              <p><strong>E-posta:</strong> privacy@memetoken.com</p>
              <p><strong>Veri Koruma Sorumlusu:</strong> dpo@memetoken.com</p>
              <p><strong>Adres:</strong> [Şirket Adresi]</p>
            </div>
          </section>

          <div className="legal-footer">
            <p>
              Bu gizlilik politikası, Türkiye Cumhuriyeti Kişisel Verilerin Korunması 
              Kanunu (KVKK) ve Avrupa Birliği Genel Veri Koruma Yönetmeliği (GDPR) 
              ile uyumlu olarak hazırlanmıştır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

