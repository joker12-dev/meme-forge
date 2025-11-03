import React from 'react';
import { FaFileContract, FaExclamationTriangle, FaUserCheck, FaShieldAlt, FaGavel, FaHandshake } from 'react-icons/fa';
import './LegalPages.css';

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <FaFileContract className="legal-icon" />
          <h1>Kullanım Şartları</h1>
          <p className="legal-subtitle">Son Güncelleme: 20 Ekim 2024</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <div className="section-header">
              <FaHandshake className="section-icon" />
              <h2>1. Şartların Kabulü</h2>
            </div>
            <p>
              Meme Token Platform'u ("Platform") kullanarak, bu kullanım şartlarını ("Şartlar") 
              kabul etmiş olursunuz. Bu şartları kabul etmiyorsanız, platformu kullanmamalısınız.
            </p>
            <div className="warning-box">
              <FaExclamationTriangle />
              <p>
                Platformu kullanmaya devam ederek, bu şartlara ve tüm geçerli yasalara 
                uymayı kabul etmiş olursunuz.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaUserCheck className="section-icon" />
              <h2>2. Kullanıcı Yükümlülükleri</h2>
            </div>
            
            <h3>2.1 Yaş Sınırı</h3>
            <p>
              Platformu kullanmak için en az 18 yaşında olmanız gerekmektedir. 
              Platformu kullanarak yasal yaşta olduğunuzu beyan etmektesiniz.
            </p>

            <h3>2.2 Hesap Güvenliği</h3>
            <ul>
              <li>Cüzdan özel anahtarlarınızı güvenli tutmak sizin sorumluluğunuzdadır</li>
              <li>Hesap aktivitelerinizden siz sorumlusunuz</li>
              <li>Yetkisiz erişimi derhal bildirmeniz gerekmektedir</li>
              <li>Sahte veya yanıltıcı bilgi sağlamamalısınız</li>
            </ul>

            <h3>2.3 Yasaklı Kullanımlar</h3>
            <p>Aşağıdaki faaliyetler kesinlikle yasaktır:</p>
            <ul>
              <li>Yasa dışı faaliyetler veya dolandırıcılık</li>
              <li>Başkalarının haklarını ihlal etmek</li>
              <li>Platform güvenliğine zarar vermek</li>
              <li>Spam, phishing veya kötü amaçlı yazılım yaymak</li>
              <li>Piyasa manipülasyonu veya pump & dump şemaları</li>
              <li>Fikri mülkiyet haklarını ihlal etmek</li>
              <li>Platformu ters mühendislik veya kopyalamak</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2>3. Token Oluşturma ve Yönetim</h2>
            </div>
            
            <h3>3.1 Token Sorumluluğu</h3>
            <p>
              Oluşturduğunuz tokenlardan tamamen siz sorumlusunuz. Platform, 
              tokenlarınızın değeri, kullanımı veya yasal uygunluğu konusunda 
              hiçbir garanti vermez.
            </p>

            <h3>3.2 İçerik Standartları</h3>
            <ul>
              <li>Token adları ve sembolleri yanıltıcı olmamalıdır</li>
              <li>Telif hakkı veya ticari marka ihlali yapmamalısınız</li>
              <li>Uygunsuz, saldırgan veya yasa dışı içerik kullanmamalısınız</li>
              <li>Başka projeleri taklit etmemelisiniz</li>
            </ul>

            <h3>3.3 Akıllı Kontratlar</h3>
            <p>
              Platform tarafından sağlanan akıllı kontratlar "OLDUĞU GİBİ" sunulmaktadır. 
              Kontrat kodunu dağıtmadan önce gözden geçirmek ve anlamak sizin sorumluluğunuzdadır.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaExclamationTriangle className="section-icon" />
              <h2>4. Riskler ve Feragatnameler</h2>
            </div>
            
            <h3>4.1 Kripto Para Riskleri</h3>
            <div className="warning-box">
              <FaExclamationTriangle />
              <div>
                <p><strong>Önemli Uyarı:</strong></p>
                <ul>
                  <li>Kripto paralar son derece değişkendir ve değer kaybedebilir</li>
                  <li>Blockchain işlemleri geri alınamaz</li>
                  <li>Akıllı kontratlarda hatalar olabilir</li>
                  <li>Düzenleyici belirsizlikler mevcuttur</li>
                  <li>Kaybetmeyi göze alamayacağınız parayı yatırmayın</li>
                </ul>
              </div>
            </div>

            <h3>4.2 Teknik Riskler</h3>
            <ul>
              <li>Network kesintileri veya gecikmeler olabilir</li>
              <li>Akıllı kontrat hataları veya güvenlik açıkları mümkündür</li>
              <li>Üçüncü taraf hizmetler kesintiye uğrayabilir</li>
              <li>Cüzdan veya özel anahtar kaybı telafisi mümkün değildir</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaGavel className="section-icon" />
              <h2>5. Fikri Mülkiyet</h2>
            </div>
            <p>
              Platform ve tüm içeriği (tasarım, logo, kod, metin) fikri mülkiyet 
              hakları ile korunmaktadır. İzinsiz kullanım, kopyalama veya dağıtım yasaktır.
            </p>
            <p>
              Kullanıcılar, platforma yükledikleri içerik için gerekli hakları 
              elinde bulundurduklarını garanti ederler ve bu içeriğin platformda 
              görüntülenmesi için gerekli lisansı verirler.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2>6. Sorumluluk Sınırlaması</h2>
            </div>
            <p>
              Yasal olarak izin verilen azami ölçüde, Platform ve operatörleri 
              aşağıdakilerden sorumlu değildir:
            </p>
            <ul>
              <li>Token değerindeki kayıplar veya finansal zararlar</li>
              <li>Doğrudan, dolaylı, özel veya arızi zararlar</li>
              <li>Veri kaybı veya iş kesintisi</li>
              <li>Üçüncü taraf eylemleri veya hizmetleri</li>
              <li>Kullanıcı hataları veya ihmal</li>
              <li>Hack, saldırı veya güvenlik ihlalleri</li>
            </ul>
            <div className="info-box">
              <p>
                <strong>Maksimum Sorumluluk:</strong> Herhangi bir durumda, toplam 
                sorumluluğumuz son 12 ayda platforma ödediğiniz ücretlerle sınırlıdır.
              </p>
            </div>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaUserCheck className="section-icon" />
              <h2>7. Tazminat</h2>
            </div>
            <p>
              Platformu kullanarak, Platform, işletmecileri, çalışanları ve ortaklarını 
              aşağıdakilerden kaynaklanan tüm iddia, zarar ve masraflara karşı tazmin 
              etmeyi kabul edersiniz:
            </p>
            <ul>
              <li>Bu şartları ihlal etmeniz</li>
              <li>Yasa veya düzenlemeleri ihlal etmeniz</li>
              <li>Başkalarının haklarını ihlal etmeniz</li>
              <li>Platformu kullanımınız veya kötüye kullanımınız</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaGavel className="section-icon" />
              <h2>8. Hesap Askıya Alma ve Sonlandırma</h2>
            </div>
            <p>
              Bu şartları ihlal etmeniz durumunda, önceden bildirimde bulunmaksızın 
              hesabınızı askıya alabilir veya sonlandırabiliriz. Hesap sonlandırma 
              durumunda:
            </p>
            <ul>
              <li>Platform erişiminiz derhal sona erer</li>
              <li>Ödenen ücretler iade edilmez</li>
              <li>Blockchain'deki tokenlar etkilenmez (değiştirilemez)</li>
              <li>Platform verilerinizdeki erişiminizi kaybedebilirsiniz</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaHandshake className="section-icon" />
              <h2>9. Değişiklikler ve Güncellemeler</h2>
            </div>
            <p>
              Bu şartları istediğimiz zaman değiştirme hakkımızı saklı tutarız. 
              Önemli değişiklikler platform üzerinden duyurulacaktır. Değişiklikler 
              yayınlandıktan sonra platformu kullanmaya devam ederseniz, yeni şartları 
              kabul etmiş sayılırsınız.
            </p>
            <p>
              Şartlardaki değişiklikleri kabul etmiyorsanız, platformu kullanmayı 
              bırakmalısınız.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaGavel className="section-icon" />
              <h2>10. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h2>
            </div>
            <p>
              Bu şartlar Türkiye Cumhuriyeti yasalarına tabidir ve bu yasalara göre 
              yorumlanır. Platform kullanımından kaynaklanan tüm uyuşmazlıklar, 
              İstanbul mahkemelerinin münhasır yetkisine tabidir.
            </p>
            
            <h3>10.1 Tahkim</h3>
            <p>
              Taraflar, öncelikle iyi niyetle müzakere yoluyla uyuşmazlıkları çözmeyi 
              kabul ederler. Çözülemeyen uyuşmazlıklar için tahkim yoluna başvurulabilir.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaHandshake className="section-icon" />
              <h2>11. Genel Hükümler</h2>
            </div>
            
            <h3>11.1 Bütünlük</h3>
            <p>
              Bu şartlar, Platform kullanımı konusunda taraflar arasındaki tüm 
              anlaşmayı oluşturur ve önceki tüm anlaşmaların yerini alır.
            </p>

            <h3>11.2 Feragat</h3>
            <p>
              Herhangi bir hakkımızı kullanmamamız, o haktan feragat ettiğimiz 
              anlamına gelmez.
            </p>

            <h3>11.3 Bölünebilirlik</h3>
            <p>
              Bu şartların herhangi bir hükmü geçersiz sayılırsa, diğer hükümler 
              geçerliliğini korur.
            </p>

            <h3>11.4 Devir</h3>
            <p>
              Bu şartlardan doğan haklarınızı veya yükümlülüklerinizi önceden 
              yazılı izin almadan devredemezsiniz.
            </p>
          </section>

          <section className="legal-section">
            <div className="section-header">
              <FaUserCheck className="section-icon" />
              <h2>12. İletişim</h2>
            </div>
            <p>
              Kullanım şartları hakkında sorularınız için:
            </p>
            <div className="contact-info">
              <p><strong>E-posta:</strong> legal@memetoken.com</p>
              <p><strong>Destek:</strong> support@memetoken.com</p>
              <p><strong>Adres:</strong> [Şirket Adresi]</p>
            </div>
          </section>

          <div className="legal-footer">
            <p>
              Bu şartları dikkatlice okuyup anladığınızdan emin olun. 
              Platformu kullanarak, bu şartlara bağlı kalmayı kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;

