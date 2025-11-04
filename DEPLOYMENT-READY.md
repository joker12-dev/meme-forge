# 📋 DEPLOYMENT READY - SUNUCUYA GÖNDERILMEK İÇİN HAZIR

## ✅ TAMAMLANAN İŞLER

### 1. **Prisma Database Schema** ✅
- `backend/prisma/schema.prisma` oluşturuldu
- Tüm modeller tanımlandı: User, Token, Trade, Post, Vote, Campaign, Admin, etc.
- PostgreSQL veritabanı bağlantısı yapılandırıldı
- Otomatik migrasyon hazırlandı

### 2. **Backend Paketleri** ✅
- `@prisma/client` ve `prisma` CLI eklendi
- `package.json` güncelleştirildi
- Npm scripts eklendi: `prisma:migrate`, `prisma:push`, `prisma:generate`, `prisma:studio`

### 3. **Environment Variables** ✅
- `backend/.env`: DATABASE_URL güncellendi (memeforgedb kullanıcısı)
- `frontend/.env`: HTTPS bağlantılarına göre güncellendi

### 4. **Git Commit & Push** ✅
- Tüm değişiklikler GitHub'a (main branch) pushlandi
- Commit: "Add Prisma schema and update production environment setup"

### 5. **Setup Dokümantasyonu** ✅
- `UBUNTU-SETUP-STEPS.md` oluşturuldu
- 10 adımlı deployment rehberi oluşturuldu
- Quick setup komutu hazırlandı
- Troubleshooting guide eklendi

---

## 🚀 SUNUCUDA ÇALIŞTIRILACAK KOMUTLAR (Sırasıyla)

### **QUICK START (TÜM ADIMLAR ARADA)**
```bash
cd ~/meme-token && \
git pull origin main && \
cd backend && \
npm install --legacy-peer-deps && \
npx prisma generate && \
npx prisma db push && \
cd ../frontend && \
npm install && \
npm run build && \
pm2 restart memeForgeBackend meme-frontend && \
pm2 status
```

### **VEYA ADIM ADIM (Detaylı)**

#### 1️⃣ SSH ile Sunucuya Bağlan
```bash
ssh root@92.249.61.60
```

#### 2️⃣ Proje Dizinine Git
```bash
cd ~/meme-token
```

#### 3️⃣ Git Pull (Son Değişiklikleri Al)
```bash
git pull origin main
```

#### 4️⃣ Backend - NPM Paketleri
```bash
cd backend
npm install --legacy-peer-deps
```

#### 5️⃣ Prisma Setup
```bash
# 1. Prisma client generate et
npx prisma generate

# 2. Database'e şemayı uygula
npx prisma db push
```

#### 6️⃣ Frontend - Build
```bash
cd ../frontend
npm install
npm run build
```

#### 7️⃣ PM2 Servisleri Restart Et
```bash
pm2 restart memeForgeBackend meme-frontend
pm2 status
```

#### 8️⃣ Test Et
```bash
# Backend health check
curl -X GET https://api.richrevo.com/api/health

# Log kontrol
pm2 logs memeForgeBackend --lines 50
```

---

## 📊 DEPLOYMENT ÖZETİ

| Konu | Değer |
|------|-------|
| **Sunucu** | 92.249.61.60 (Ubuntu 22.04) |
| **Domain** | richrevo.com, api.richrevo.com |
| **Frontend** | https://richrevo.com (port 3000 → NGINX 443) |
| **Backend API** | https://api.richrevo.com (port 3001 → NGINX 443) |
| **Database** | PostgreSQL: memeforgedb (user: memeforge) |
| **ORM** | Prisma 5.8.0 (yeni) |
| **Process Manager** | PM2 |
| **Web Server** | NGINX (reverse proxy + SSL) |
| **SSL** | Let's Encrypt (otomatik yenileme) |

---

## 🔐 PRODUCTION AYARLARI

### Database
```properties
DATABASE_URL=postgresql://memeforge:memeforge123@localhost:5432/memeforgedb
```

### Blockchain
```properties
FACTORY_ADDRESS=0x63a8630b51c13513629b13801A55B748f9Ab13b2
LIQUIDITY_ADDER_ADDRESS=0xAAA098C78157b242E5f9E3F63aAD778c376E29eb
PANCAKE_ROUTER_ADDRESS=0xD99D1c33F9fC3444f8101754aBC46c52416550D1
LIQUIDITY_LOCK_MANAGER_ADDRESS=0x8ddd7F12e0F9F0E80a37C9dfE9649DdCfCC49d18
```

---

## 📝 ÖNEMLI NOTLAR

✅ **Prisma schema tüm tabloları kapsıyor**
- User, Token, Trade, PriceHistory, TokenHype, Campaign
- Vote, Post, Comment, PostLike, CommentLike
- Admin, SiteSettings, ActivityLog, ContactMessage

✅ **PostgreSQL ile uyumlu**
- UUID primary keys
- JSONB fields for complex data
- Automatic timestamps
- Proper foreign key relations

✅ **Otomatik Migrasyon**
- `npx prisma db push` komutu ile veritabanı otomatik güncellenir

✅ **Git ve GitHub Entegrasyonu**
- Tüm değişiklikler GitHub'da (main branch)
- Sunucudan `git pull` ile çekeceği

---

## ⚠️ EĞER HATA ALIRSAN

### Database Bağlantı Hatası
```bash
psql -U memeforge -d memeforgedb -h localhost
```

### Process Crash
```bash
pm2 restart all
pm2 logs
```

### Port Meşgul
```bash
lsof -i :3001
lsof -i :3000
```

### NGINX Sorunları
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✨ NEXT STEPS

1. Ubuntu sunucusunda QUICK START komutunu çalıştır
2. Tüm adımların başarıyla tamamlanıp tamamlanmadığını kontrol et
3. `pm2 status` ile her iki servisin de `online` olduğunu kontrol et
4. Browser'da https://richrevo.com ve https://api.richrevo.com test et
5. Hata alırsan `pm2 logs` komutu ile kontrol et

---

**Status**: 🟢 SUNUCUYA GÖNDERMEYE HAZIR
**Tarih**: 4 Kasım 2025
**Version**: 1.0.0 Production Ready

