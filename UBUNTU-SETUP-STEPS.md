# 🚀 MEME FORGE - UBUNTU SERVER SETUP COMMANDS
# Production Deployment to 92.249.61.60
# Date: November 4, 2025

## ADIM 1: SUNUCUYA BAĞLAN
## ========================================
ssh root@92.249.61.60


## ADIM 2: PROJE DİZİNİNE GİT
## ========================================
cd ~/meme-token


## ADIM 3: GIT PULL (son değişiklikleri al)
## ========================================
git pull origin main


## ADIM 4: BACKEND - NPM PAKETLERINI YÜKLEYİN
## ========================================
cd backend
npm install --legacy-peer-deps


## ADIM 5: PRISMA SETUP
## ========================================
# 1. .env dosyasını kontrol et (DATABASE_URL doğru mu?)
cat .env | grep DATABASE_URL

# 2. Prisma client'ı generate et
npx prisma generate

# 3. Database'e şemayı uygula (migrate et)
npx prisma db push

# 4. (Opsiyonel) Prisma Studio ile veritabanını görmek için:
# npx prisma studio


## ADIM 6: FRONTEND - PAKETLER VE BUILD
## ========================================
cd ../frontend
npm install

# .env dosyasını kontrol et
cat .env

# Build et (production için)
npm run build


## ADIM 7: PM2 SERVİSLERİNİ YENIDEN BAŞLAT
## ========================================

# Backend'i restart et
pm2 restart memeForgeBackend

# Frontend'i restart et
pm2 restart meme-frontend

# Durum kontrol et
pm2 status

# Tüm servisleri görmek için
pm2 list


## ADIM 8: LOG'LARI KONTROL ET (Hata varsa görmek için)
## ========================================

# Backend log
pm2 logs memeForgeBackend --lines 50

# Frontend log
pm2 logs meme-frontend --lines 50

# Tüm log'lar
pm2 logs


## ADIM 9: API TESTI (Sunucu üzerinden)
## ========================================

# Backend health check
curl -X GET https://api.richrevo.com/api/health

# Frontend check (NGINX reverse proxy)
curl -X GET https://richrevo.com/


## ADIM 10: BROWSER'DA TEST ET
## ========================================

# Frontend:    https://richrevo.com
# Backend API: https://api.richrevo.com


---

## ⚡ QUICK SETUP (HEPSI ARADA)
## ========================================

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


---

## 🔧 TROUBLESHOOTING
## ========================================

# Eğer Database connection hatası alırsan:
psql -U memeforge -d memeforgedb -h localhost

# Eğer PM2 process crash etmişse:
pm2 restart all

# Eğer port 3001/3000 meşgulse:
lsof -i :3001
lsof -i :3000

# NGINX kontrol et:
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx

# Log dosyaları:
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log


---

## 📋 VERIFICATION CHECKLIST
## ========================================

✅ SSH ile sunucuya bağlandın
✅ Git pull ile son değişiklikleri aldın
✅ Backend npm install tamamladı
✅ Prisma schema veritabanına uygulandı
✅ Frontend build tamamladı
✅ PM2 servisleri çalışıyor (pm2 status)
✅ Backend API yanıt veriyor (curl https://api.richrevo.com/api/health)
✅ Frontend yüklenebiliyor (https://richrevo.com)
✅ Database bağlantısı çalışıyor
✅ NGINX proxy çalışıyor


---

## 📊 EXPECTED OUTPUT
## ========================================

# pm2 status komutu sonrası:
┌─────────────┬────┬─────────┬──────┬─────────┬─────────┐
│ Name        │ id │ version │ mode │ pid     │ status  │
├─────────────┼────┼─────────┼──────┼─────────┼─────────┤
│ meme-frontend    │ 0  │ N/A     │ fork │ XXXXX   │ online  │
│ memeForgeBackend │ 1  │ N/A     │ fork │ XXXXX   │ online  │
└─────────────┴────┴─────────┴──────┴─────────┴─────────┘

# curl health check sonrası:
{
  "status": "ok",
  "message": "Backend is running",
  "timestamp": "2025-11-04T..."
}


---

## 🚀 PRODUCTION NOTES
## ========================================

1. Veritabanı kullanıcısı: memeforge
2. Veritabanı adı: memeforgedb
3. Backend portu: 3001 (NGINX 443 → 3001)
4. Frontend portu: 3000 (NGINX 443 → 3000)
5. SSL Sertifikaları: Let's Encrypt (otomatik yenileme)
6. Backend Process: memeForgeBackend (PM2)
7. Frontend Process: meme-frontend (PM2)
8. Domain: richrevo.com (HTTPS)
9. API Domain: api.richrevo.com (HTTPS)

