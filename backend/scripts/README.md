# Backend Scripts Documentation

## Active Scripts

### `init-db.js` - **Main Database Initialization** ✅

Veritabanını tamamen başlatır.

**Kullanım:**
```bash
node init-db.js
```

**Yapar:**
- ✅ Tüm tabloları oluşturur/günceller
- ✅ Otomatik sütun ekleme (`alter: true`)
- ✅ Super admin hesabı oluşturur
- ✅ Site ayarlarını başlatır

---

### `delete-db-tables.js` - **Complete Database Reset**

⚠️ **UYARI: Tüm verileri siler!** Sadece geliştirme sırasında kullanın.

```bash
node delete-db-tables.js
```

---

### `showUsers.js` - **List All Users**

Veritabanındaki tüm kullanıcıları listeler.

```bash
node showUsers.js
```

---

## Deprecated Scripts (Artık init-db.js içinde)

Aşağıdaki scriptler `init-db.js` ile birleştirilmiştir:

### ~~`syncDatabase.js`~~ → Kullanmayın ❌
**Sebep**: `init-db.js` aynı işi yapıyor

### ~~`add-post-columns.js`~~ → Kullanmayın ❌
**Sebep**: `init-db.js` tüm sütunları otomatik ekliyor

### ~~`add-user-management-fields.js`~~ → Kullanmayın ❌
**Sebep**: `init-db.js` tüm modelleri senkronize ediyor

### ~~`migrate-to-postgres.js`~~ → Kullanmayın ❌
**Sebep**: PostgreSQL zaten kullanılıyor

### ~~`createTestCampaigns.js`~~ → Kullanmayın ❌
**Sebep**: Test verisi kaldırıldı

### ~~`addTestTrades.js`~~ → Kullanmayın ❌
**Sebep**: Test verisi kaldırıldı

---

## Workflow

### Fresh Database Setup
```bash
# 1. Tüm tabloları sıfırla (VERİ KAYBI!)
node delete-db-tables.js

# 2. Veritabanını başlat
node init-db.js

# 3. Sunucuyu başlat
cd ../
npm start
```

### Sadece Schema Güncelleme
```bash
# Yeni model sütunlarını ekle (veri kayıpsız)
node init-db.js
```

### Update Existing Database
```bash
# Varolan veritabanına sadece yeni sütunlar ekle
node init-db.js
```

---

## Model Structure

Otomatik olarak senkronize edilen 15+ model:

```
Users
├── Posts
│   ├── Comments
│   ├── PostLike
│   └── CommentLike
├── Tokens
│   ├── Trades
│   ├── PriceHistory
│   ├── TokenHype
│   └── Campaign
└── Vote

Admin & Settings
├── Admin
├── ActivityLog
├── ContactMessage
└── SiteSettings
```

---

## Environment Setup

`.env` dosyasında gerekli ayarlar:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=memeforgedb
DB_USER=postgres
DB_PASSWORD=your_password

# Email (isteğe bağlı)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## Next Steps

1. ✅ `init-db.js` ile veritabanını başlat
2. ⏭️ Admin paneli UI'ı tamamla
3. ⏭️ Email gönderimleri test et
4. ⏭️ Production ayarlarını yapılandır

---

## Support

Hata alırsan:
1. Logları kontrol et
2. PostgreSQL bağlantısını doğrula
3. `.env` dosyasını kontrol et
4. `node delete-db-tables.js` ile sıfırla
5. Yeniden `node init-db.js` çalıştır
