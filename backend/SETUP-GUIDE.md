# Database Setup Guide

## Quick Start

```bash
cd backend/scripts
node init-db.js
```

Bu komut:
- ✅ Tüm tabloları otomatik olarak oluşturur
- ✅ Yeni sütunları varolan tablolara ekler (`alter: true`)
- ✅ Verileri korur
- ✅ Super admin hesabı oluşturur: `MemeForgeDeveloper / Admin123!`
- ✅ Site konfigürasyonunu yükler

## Features

### 1. Otomatik Tablo Yönetimi
- **Durum**: Tablolar yoksa oluşturur
- **Güncelleme**: Yeni sütunlar otomatik olarak eklenir
- **Veri Koruma**: Varolan veriler asla silinmez

### 2. Email Reply Sistemi
Modeller:
- `ContactMessage`: `reply` (TEXT) ve `repliedAt` (DATE) sütunları içerir

Endpoints:
- `GET /api/admin/contact-messages` - Tüm mesajları listele
- `POST /api/contact/:id/reply` - Mesaja cevap ver
- `PATCH /api/admin/contact-messages/:id` - Mesaj durumunu güncelle

### 3. Admin Yönetimi
Varsayılan admin hesabı:
- **Username**: MemeForgeDeveloper
- **Password**: Admin123!
- **Role**: super_admin
- **Permissions**: Tüm yetkilere sahip

## Database Models

Otomatik olarak oluşturulan tablolar:

1. **Users** - Kullanıcı hesapları
2. **Tokens** - Token bilgileri
3. **Trades** - İşlem kaydı
4. **Posts** - Sosyal medya gönderileri
5. **Comments** - Gönderilerin yorumları
6. **TokenHype** - Token promosyonları
7. **Campaigns** - Marketing kampanyaları
8. **ContactMessages** - İletişim formu mesajları
9. **Admin** - Admin hesapları
10. **ActivityLog** - Admin işlem kaydı
11. **SiteSettings** - Site ayarları
12. **Vote** - Oylama sistemi
13. **PriceHistory** - Token fiyat geçmişi
14. **PostLike, CommentLike** - Beğeni kaydı

## Troubleshooting

### Eğer hata alırsan?

```bash
# 1. Tüm tabloları sil (VERİ KAYBI!)
cd backend/scripts
node delete-db-tables.js

# 2. Yeniden başlat
node init-db.js

# 3. Sunucuyu başlat
cd ../
npm start
```

## Production Notes

- `.env` dosyasında email ayarlarını konfigüre et:
  ```
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password
  ```

- Gmail kullanıyorsan "App Password" oluştur:
  1. Google Account Security'e git
  2. App Passwords'a tıkla
  3. Mail + Windows seç
  4. Şifreyi kopyala

## Next Steps

1. ✅ Database kuruldu
2. ⏭️ Frontend admin paneline "Cevap Ver" butonu ekle
3. ⏭️ Email gönderim testi yap
4. ⏭️ Production ayarları yapılandır
