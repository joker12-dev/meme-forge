# 🔴 MUTLAKA OLMASI GEREKENLER

**Sadece bu paketler kurulu olursa proje çalışır. Başka hiçbir şey yok.**

---

## 📦 SİSTEM PAKETLERİ (7 tane)

```bash
sudo apt install -y \
  nodejs \
  postgresql \
  nginx \
  git \
  build-essential \
  python3 \
  openssl
```

| Paket | Komut | Kontrol |
|-------|-------|---------|
| **Node.js 18** | `node --version` | v18.x.x olmalı |
| **npm** | `npm --version` | 9.x.x olmalı |
| **PostgreSQL 14** | `psql --version` | 14.x olmalı |
| **NGINX** | `nginx -v` | 1.18.0 |
| **Git** | `git --version` | 2.x.x |
| **Build tools** | `gcc --version` | 9.x.x+ |
| **Python 3** | `python3 --version` | 3.8+ |
| **OpenSSL** | `openssl version` | 1.1.1+ |

---

## 🚀 PM2 KURU

PM2 process manager'ı kur ve autostart ayarla:

```bash
# 1. PM2'yi global kur
sudo npm install -g pm2

# 2. Versiyonu kontrol et
pm2 --version

# 3. PM2'yi startup'a ekle (server yeniden başlansa da çalışsın)
sudo pm2 startup
sudo pm2 save
```

**Kontrol:**
```bash
pm2 status
```

---

## 🗄️ POSTGRESQLi HAZIRLA

```bash
# 1. PostgreSQL'i başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 2. User ve database oluştur
sudo -u postgres psql -c "CREATE USER memeforge WITH PASSWORD 'memeforge123';"
sudo -u postgres psql -c "CREATE DATABASE memeforgedb OWNER memeforge;"

# 3. Kontrol et
sudo -u postgres psql -c "\l"
```

---

## 📥 NPM PAKETLERİ - BACKEND

`~/meme-token/backend` klasörüne git ve kur:

```bash
cd ~/meme-token/backend
npm install --legacy-peer-deps
```

**Zorunlu paketler (otomatik kurulur):**
- express
- @prisma/client
- pg
- ethers (v5.7.2)
- jsonwebtoken
- bcryptjs
- cors
- dotenv

---

## 🎨 NPM PAKETLERİ - FRONTEND

`~/meme-token/frontend` klasörüne git ve kur:

```bash
cd ~/meme-token/frontend
npm install
```

**Zorunlu paketler (otomatik kurulur):**
- react
- react-dom
- react-router-dom
- axios
- ethers (v6.15.0)

---

## 🔧 NGINX YAPIŞTI

NGINX config dosyasını kopyala:

```bash
sudo cp ~/meme-token/nginx-default.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔐 SSL (Let's Encrypt)

```bash
# 1. Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# 2. Sertifika al
sudo certbot certonly --nginx -d richrevo.com -d api.richrevo.com

# 3. NGINX güncelle (nginx-default.conf'a SSL paths ekle)
sudo systemctl restart nginx
```

---

## 🌍 .env Dosyaları

```bash
# Backend
cp ~/meme-token/backend/.env.production ~/meme-token/backend/.env

# Frontend
cp ~/meme-token/frontend/.env.production ~/meme-token/frontend/.env
```

**Backend .env içeriği:**
```
DATABASE_URL=postgresql://memeforge:memeforge123@localhost:5432/memeforgedb
NODE_ENV=production
PORT=3001
JWT_SECRET=your_jwt_secret_here
BLOCKCHAIN_RPC=https://data-seed-prebsc-1-b.binance.org:8545
```

**Frontend .env içeriği:**
```
REACT_APP_BACKEND_URL=https://api.richrevo.com
REACT_APP_NETWORK_ID=97
REACT_APP_ENVIRONMENT=production
```

---

## ⚙️ PM2 SERVISLERI BAŞLAT

Backend:
```bash
cd ~/meme-token/backend
pm2 start "node server.js" --name "memeForgeBackend"
```

Frontend:
```bash
cd ~/meme-token/frontend
npm run build
pm2 start "npm start" --name "meme-frontend"
```

Kaydet:
```bash
pm2 save
```

---

## ✅ KONTROL KOMUTLARI

Hepsi çalışıyor mu kontrol et:

```bash
# 1. Paketler
node --version
npm --version
psql --version
nginx -v
pm2 --version

# 2. PostgreSQL çalışıyor mu
sudo systemctl status postgresql

# 3. NGINX çalışıyor mu
sudo systemctl status nginx

# 4. PM2 servisleri
pm2 status
pm2 logs

# 5. API çalışıyor mu
curl https://api.richrevo.com/api/health
```

---

## 🚀 HIZLI BAŞLANGAÇ (TEK SATIR)

```bash
sudo apt update && \
sudo apt install -y nodejs postgresql nginx git build-essential python3 openssl && \
sudo npm install -g pm2 && \
sudo -u postgres psql -c "CREATE USER memeforge WITH PASSWORD 'memeforge123';" && \
sudo -u postgres psql -c "CREATE DATABASE memeforgedb OWNER memeforge;" && \
sudo systemctl start postgresql && \
sudo systemctl enable postgresql && \
cd ~/meme-token/backend && npm install --legacy-peer-deps && \
cd ~/meme-token/frontend && npm install && \
echo "✅ Tüm paketler kuruldu!"
```

---

## 📋 ÖZET

**Mutlaka kurulması gerekenler:**
- ✅ 7 sistem paketi
- ✅ npm paketleri (backend + frontend)
- ✅ PM2
- ✅ NGINX
- ✅ PostgreSQL user + database
- ✅ .env dosyaları
- ✅ SSL sertifikaları

**Hepsi bu.**

