# 🔴 MUTLAKA GEREKLİ PAKETLER (CRITICAL DEPENDENCIES)

## Eğer bunlardan biri yok olursa, proje ÇALIŞMAZ! ⚠️

---

## 📋 SİSTEM SEVİYESİ PAKETLER (ZORUNLU)

Bu paketler **MUTLAKA** kurulu olmalı, aksi takdirde hiç başlayamaz.

### ⭐ ZORUNLU SİSTEM PAKETLERI

| Paket | Sürüm | Neden Gerekli | Alternatif | Komut |
|-------|-------|---------------|-----------|-------|
| **Node.js** | 18+ (LTS) | JavaScript runtime | ❌ Yok | `sudo apt install -y nodejs` |
| **npm** | 9+ | Paket yöneticisi | yarn, pnpm | Otomatik Node.js ile |
| **PostgreSQL** | 14+ | Veritabanı | MySQL, MongoDB | `sudo apt install -y postgresql` |
| **NGINX** | 1.18+ | Web sunucusu/Reverse proxy | Apache, Caddy | `sudo apt install -y nginx` |
| **Git** | 2+ | Kod indirmek için | ❌ Yok (zorunlu) | `sudo apt install -y git` |
| **OpenSSL** | 1.1+ | SSL/HTTPS şifreleme | ❌ Yok | `sudo apt install -y openssl` |
| **Make** | 4+ | Build araçları (ethers için) | ❌ Yok | `sudo apt install -y build-essential` |
| **Python** | 3.8+ | Build araçları (npm modülleri) | ❌ Yok | `sudo apt install -y python3` |

**Tamamını bir komutla kur:**
```bash
sudo apt install -y nodejs postgresql nginx git openssl build-essential python3
```

---

## 🔴 BACKEND ZORUNLU NPM PAKETLERİ

Bunlardan biri yoksa backend **BAŞLAMAZ**.

### Core Framework & Database

```json
{
  "express": "^4.18.2",           // Web framework (ZORUNLU)
  "@prisma/client": "^5.8.0",     // Database ORM (ZORUNLU)
  "pg": "^8.16.3",                // PostgreSQL driver (ZORUNLU)
  "dotenv": "^17.2.3"             // Environment variables (ZORUNLU)
}
```

**Bu 4'ü yoksa çalışmaz:**
- ❌ express yok → HTTP sunucusu başlamaz
- ❌ @prisma/client yok → Veritabanı bağlantısı yapamaz
- ❌ pg yok → PostgreSQL'e erişemez
- ❌ dotenv yok → Çevre değişkenleri okunamaz

### Authentication & Security

```json
{
  "jsonwebtoken": "^9.0.2",       // JWT tokens (ZORUNLU)
  "bcryptjs": "^3.0.2",           // Şifre şifreleme (ZORUNLU)
  "helmet": "^7.0.0",             // Security headers (ÖNEMLİ)
  "cors": "^2.8.5"                // CORS konfigürasyonu (ZORUNLU)
}
```

**Bunlar yoksa:**
- ❌ JWT yok → Login sistemi çalışmaz
- ❌ bcryptjs yok → Şifreler açık saklanır (güvenlik riski)
- ❌ cors yok → Frontend API'ye erişemez
- ⚠️ helmet yok → Security headers eksik (risk)

### Blockchain (Ethers)

```json
{
  "ethers": "^5.7.2"              // Blockchain interaction (ZORUNLU)
}
```

**ethers yoksa:**
- ❌ Cüzdan bağlantısı yapamaz
- ❌ Token alımı yapamaz
- ❌ Smart contract'larla iletişim kuramaz
- ❌ LP locking çalışmaz

### Database & ORM

```json
{
  "@prisma/cli": "^5.8.0",        // Prisma komutları (ZORUNLU)
  "prisma": "^5.8.0"              // Prisma core (ZORUNLU)
}
```

**Prisma olmadan:**
- ❌ Veritabanı migrations yapılamaz
- ❌ Schema güncellemeleri yapılamaz
- ❌ Database senkronize edilemez

### Logging & Monitoring

```json
{
  "morgan": "^1.10.0",            // HTTP logging (ÖNEMLİ)
  "winston": "^3.18.3"            // File logging (ÖNEMLİ)
}
```

### File Upload

```json
{
  "multer": "^2.0.2",             // File upload middleware (ÖNEMLİ)
  "cloudinary": "^2.8.0",         // Image storage (ÖNEMLİ)
  "streamifier": "^0.1.1"         // File stream işleme (ÖNEMLİ)
}
```

---

## 🎨 FRONTEND ZORUNLU NPM PAKETLERİ

Bunlardan biri yoksa frontend **ÇALIŞMAZ**.

### React Core (MUTLAKA)

```json
{
  "react": "^18.2.0",             // React framework (ZORUNLU)
  "react-dom": "^18.2.0",         // React DOM (ZORUNLU)
  "react-scripts": "5.0.1"        // Build tools (ZORUNLU)
}
```

**Bunlar yoksa:**
- ❌ React render edilemez
- ❌ Component'ler çalışmaz
- ❌ Build yapılamaz

### Routing

```json
{
  "react-router-dom": "^7.9.4"    // Page routing (ZORUNLU)
}
```

**Router yoksa:**
- ❌ Sayfa geçişleri yapılamaz
- ❌ URL değişimleri çalışmaz

### API Communication

```json
{
  "axios": "^1.5.0",              // HTTP client (ZORUNLU)
  "ethers": "^6.15.0"             // Blockchain (ZORUNLU)
}
```

**Bunlar yoksa:**
- ❌ Backend API'ye bağlanamaz
- ❌ Cüzdan bağlantısı yapılamaz
- ❌ Token işlemleri çalışmaz

### UI Components & Charts

```json
{
  "recharts": "^3.2.1",           // Charts library (ÖNEMLİ)
  "chart.js": "^4.4.0",           // Chart.js (ÖNEMLİ)
  "react-chartjs-2": "^5.2.0",    // React Chart adapter (ÖNEMLİ)
  "lucide-react": "^0.545.0",     // Icons (ÖNEMLİ)
  "react-icons": "^5.5.0"         // More icons (ÖNEMLİ)
}
```

**Bunlar yoksa:**
- ⚠️ Grafikler görüntülenmez
- ⚠️ İkonlar gösterilmez
- ⚠️ UI eksik görünür

---

## 📦 SMART CONTRACTS ZORUNLU PAKETLERİ

Blockchain deployment için:

```json
{
  "hardhat": "^2.26.3",           // Smart contract framework (ZORUNLU)
  "@openzeppelin/contracts": "^4.9.3",  // Security audited contracts (ZORUNLU)
  "dotenv": "^16.6.1"             // Env variables (ZORUNLU)
}
```

**Bunlar yoksa:**
- ❌ Kontratlar compile edilemez
- ❌ Deployment yapılamaz
- ❌ Verify edilemez

---

## 🎯 ÇÖZÜNMEZ DEĞİŞKENLER (Non-Negotiable)

Bu kombinasyonlar **KESINLIKLE** zorunludur:

### Backend için

| Bileşen | Zorunlu Paket | Alternatifleri | Gerçekçi mi? |
|---------|--------------|-----------------|------------|
| **Web Framework** | Express | Fastify, Koa | Express olmalı |
| **Database ORM** | Prisma | Sequelize, TypeORM | Prisma tercih |
| **DB Driver** | PostgreSQL (pg) | MySQL, MongoDB | PostgreSQL |
| **Authentication** | JWT + bcrypt | Sessions, OAuth | JWT + bcrypt |
| **Blockchain** | Ethers v5 | Web3.js | Ethers v5 |

### Frontend için

| Bileşen | Zorunlu Paket | Alternatifleri | Gerçekçi mi? |
|---------|--------------|-----------------|------------|
| **Framework** | React 18 | Vue, Angular, Svelte | React olmalı |
| **Routing** | React Router | Next.js | React Router |
| **HTTP Client** | Axios | Fetch, SWR | Axios |
| **Blockchain** | Ethers v6 | Web3.js | Ethers v6 |
| **Charts** | Recharts | Chart.js, D3 | Recharts tercih |

---

## ❌ OLMADAN ÇALIŞMAYAN KOMUTLAR

### Backend'te

```bash
# olmadan çalışmaz
npm install

# olmadan çalışmaz
npx prisma db push

# olmadan çalışmaz
npm start

# olmadan çalışmaz
node server.js
```

### Frontend'te

```bash
# olmadan çalışmaz
npm install

# olmadan çalışmaz
npm run build

# olmadan çalışmaz
npm start
```

---

## 📊 ZORUNLULUK SEVIYELERI

```
🔴 KIRTILMAZ (CRITICAL - Proje başlamaz)
├─ Node.js 18+
├─ npm
├─ PostgreSQL 14+
├─ Git
├─ Express
├─ Prisma (@prisma/client + @prisma/cli)
├─ pg (PostgreSQL driver)
├─ ethers (v5 backend, v6 frontend)
├─ JWT
├─ bcryptjs
├─ axios (frontend)
├─ React 18
├─ React Router
├─ Dotenv
└─ CORS

🟠 ÖNEMLİ (IMPORTANT - Önemli özellikler çalışmaz)
├─ Helmet (Security)
├─ Morgan (Logging)
├─ Multer (File upload)
├─ Cloudinary (Image storage)
├─ Recharts (Charts)
├─ Lucide-react (Icons)
└─ Winston (File logging)

🟡 OPSİYONEL (OPTIONAL - Veri işleme için)
├─ Mongoose (eğer MongoDB kullansak)
├─ Sequelize (eğer Prisma kullanmasak)
└─ Compression (gzip optimization)
```

---

## 🚀 HIZLI KONTROL KOMUTU

Sunucuda şu komutu çalıştır ve tüm zorunlu paketleri kontrol et:

```bash
#!/bin/bash
echo "=== SYSTEM PACKAGES ==="
command -v node && echo "✅ Node.js installed" || echo "❌ Node.js MISSING"
command -v npm && echo "✅ npm installed" || echo "❌ npm MISSING"
command -v psql && echo "✅ PostgreSQL installed" || echo "❌ PostgreSQL MISSING"
command -v nginx && echo "✅ NGINX installed" || echo "❌ NGINX MISSING"
command -v git && echo "✅ Git installed" || echo "❌ Git MISSING"

echo ""
echo "=== NODE PACKAGES ==="
cd ~/meme-token/backend
npm list express @prisma/client pg ethers dotenv cors 2>/dev/null || echo "Run: npm install"

echo ""
cd ~/meme-token/frontend
npm list react react-dom axios ethers 2>/dev/null || echo "Run: npm install"
```

---

## 🔧 KURULUM KOMUTU (Tüm Zorunlu Paketler)

```bash
# Sistem paketleri
sudo apt update
sudo apt install -y nodejs postgresql nginx git build-essential python3 openssl

# npm global paketleri
sudo npm install -g pm2 prisma

# Backend paketleri (~/meme-token/backend klasöründe)
npm install --legacy-peer-deps

# Frontend paketleri (~/meme-token/frontend klasöründe)
npm install
```

---

## ⚠️ UYARI: VERSYON UYUMLULUKLARI

**Backend'te dikkat et:**
- ✅ ethers: **5.7.2** (frontend 6.15.0 değil!)
- ✅ Node.js: **18+** (12 veya 14 değil!)
- ✅ Prisma: **5.8.0** (4.x değil!)

**Frontend'te dikkat et:**
- ✅ ethers: **6.15.0** (backend 5.7.2 değil!)
- ✅ React: **18.2.0** (16 veya 17 değil!)
- ✅ React Router: **7.9.4** (v6 değil!)

---

## 🎯 ÖZET: MUTLAKA OLMASI GEREKENLER

**SİSTEM:**
```
Node.js 18+ 🔴
npm 🔴
PostgreSQL 14+ 🔴
Git 🔴
Make/Build tools 🔴
OpenSSL 🔴
```

**BACKEND (npm):**
```
express 🔴
@prisma/client 🔴
pg 🔴
ethers (5.7.2) 🔴
jsonwebtoken 🔴
bcryptjs 🔴
cors 🔴
dotenv 🔴
```

**FRONTEND (npm):**
```
react 18 🔴
react-dom 🔴
react-router-dom 🔴
axios 🔴
ethers (6.15.0) 🔴
```

**DEPLOYMENT:**
```
PM2 🔴 (process manager)
NGINX 🔴 (reverse proxy)
Certbot 🔴 (SSL sertifikaları)
```

---

## 📞 HATALAR & ÇÖZÜMLER

### Hata: "Cannot find module 'express'"
```bash
# Çözüm:
cd ~/meme-token/backend
npm install
```

### Hata: "Cannot find module '@prisma/client'"
```bash
# Çözüm:
cd ~/meme-token/backend
npm install @prisma/client
npx prisma generate
```

### Hata: "ECONNREFUSED 127.0.0.1:5432"
```bash
# PostgreSQL çalışmıyor
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Hata: "Module ethers version mismatch"
```bash
# Backend: ethers 5.7.2
# Frontend: ethers 6.15.0
# AYNI OLMAMALI!
```

---

**Status:** ✅ Tamamlandı
**Date:** November 4, 2025
**Version:** 1.0

