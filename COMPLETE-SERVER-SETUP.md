# 🚀 COMPLETE UBUNTU SERVER SETUP - FROM SCRATCH
# Full Production Deployment Guide
# Server: 92.249.61.60 (Ubuntu 22.04)
# Date: November 4, 2025

---

## 🔥 PHASE 1: SYSTEM PACKAGES & DEPENDENCIES
## ========================================

### Step 1.1: Update System
```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### Step 1.2: Install Essential Tools
```bash
sudo apt install -y \
  build-essential \
  curl \
  wget \
  git \
  vim \
  nano \
  htop \
  net-tools \
  zip \
  unzip \
  systemctl \
  openssl
```

### Step 1.3: Install Node.js (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x
```

### Step 1.4: Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### Step 1.5: Install NGINX
```bash
sudo apt install -y nginx

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### Step 1.6: Install Certbot (SSL/HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 1.7: Install PM2 (Global)
```bash
sudo npm install -g pm2

# Setup PM2 auto-start
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Verify
pm2 status
```

---

## 🗄️ PHASE 2: DATABASE SETUP (PostgreSQL)
## ========================================

### Step 2.1: Connect to PostgreSQL
```bash
sudo -u postgres psql
```

### Step 2.2: Create Database & User (Inside psql)
```sql
-- Create user 'memeforge' with password
CREATE USER memeforge WITH PASSWORD 'memeforge123';

-- Create database
CREATE DATABASE memeforgedb OWNER memeforge;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE memeforgedb TO memeforge;

-- Exit psql
\q
```

### Step 2.3: Verify Connection
```bash
# Test connection
psql -U memeforge -d memeforgedb -h localhost -c "SELECT NOW();"

# Should output current timestamp if connection is successful
```

### Step 2.4: Create Backup Directory (Optional)
```bash
mkdir -p /var/backups/postgres
sudo chown postgres:postgres /var/backups/postgres
```

---

## 📂 PHASE 3: PROJECT SETUP
## ========================================

### Step 3.1: Clone Project from GitHub
```bash
cd ~
git clone https://github.com/joker12-dev/meme-forge.git
cd ~/meme-token
```

### Step 3.2: Navigate to Backend
```bash
cd ~/meme-token/backend
```

### Step 3.3: Install Backend Dependencies
```bash
npm install --legacy-peer-deps

# This will install:
# - @prisma/client
# - prisma
# - express
# - cors
# - ethers
# - etc.
```

### Step 3.4: Setup Prisma
```bash
# Generate Prisma client
npx prisma generate

# Create/update database schema
npx prisma db push

# If you need to run migrations
npx prisma migrate deploy
```

### Step 3.5: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 3.6: Build Frontend for Production
```bash
npm run build

# This creates optimized build in ./build directory
```

---

## 🌐 PHASE 4: NGINX CONFIGURATION
## ========================================

### Step 4.1: Backup Original NGINX Config
```bash
sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
```

### Step 4.2: Create NGINX Configuration

Create/edit: `/etc/nginx/sites-enabled/default`

```bash
sudo nano /etc/nginx/sites-enabled/default
```

Copy and paste the following content:

```nginx
# HTTP to HTTPS redirect for richrevo.com
server {
    listen 80;
    listen [::]:80;
    server_name richrevo.com www.richrevo.com;
    
    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTP to HTTPS redirect for api.richrevo.com
server {
    listen 80;
    listen [::]:80;
    server_name api.richrevo.com;
    
    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Frontend (richrevo.com)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name richrevo.com www.richrevo.com;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/richrevo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/richrevo.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # Frontend Proxy (React on port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:3000;
    }
}

# HTTPS Backend (api.richrevo.com)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.richrevo.com;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/richrevo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/richrevo.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # CORS Headers
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, wallet-address" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
    
    # Handle OPTIONS requests (CORS preflight)
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    # Backend Proxy (Node.js on port 3001)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header Origin $http_origin;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
        
        # Timeouts for long-running operations (blockchain)
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # API rate limiting (optional)
    location ~* ^/api/ {
        limit_req zone=api burst=100 nodelay;
        proxy_pass http://127.0.0.1:3001;
    }
    
    # Health check endpoint (no rate limiting)
    location = /api/health {
        proxy_pass http://127.0.0.1:3001;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=50r/s;
```

### Step 4.3: Test NGINX Configuration
```bash
sudo nginx -t

# Should output: "syntax is ok" and "test is successful"
```

### Step 4.4: Reload NGINX
```bash
sudo systemctl reload nginx
```

---

## 🔐 PHASE 5: SSL CERTIFICATE SETUP (Let's Encrypt)
## ========================================

### Step 5.1: Create Certbot Directory
```bash
sudo mkdir -p /var/www/certbot
```

### Step 5.2: Get SSL Certificate for richrevo.com
```bash
sudo certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d richrevo.com \
  -d www.richrevo.com \
  -d api.richrevo.com \
  --agree-tos \
  --no-eff-email
```

### Step 5.3: Verify Certificate
```bash
ls -la /etc/letsencrypt/live/richrevo.com/

# Should show: cert.pem, chain.pem, fullchain.pem, privkey.pem
```

### Step 5.4: Test NGINX Again with SSL
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5.5: Setup Auto-Renewal (Cron)
```bash
# Create renewal script
sudo nano /usr/local/bin/renew-certs.sh
```

Paste this content:
```bash
#!/bin/bash
certbot renew --quiet
systemctl reload nginx
```

Make it executable and add to crontab:
```bash
sudo chmod +x /usr/local/bin/renew-certs.sh

# Add to crontab (runs daily at 2 AM)
sudo crontab -e

# Add this line:
# 0 2 * * * /usr/local/bin/renew-certs.sh
```

---

## 🚀 PHASE 6: PM2 PROCESS SETUP
## ========================================

### Step 6.1: Create PM2 Config File
```bash
nano ~/meme-token/ecosystem.config.js
```

Paste this content:
```javascript
module.exports = {
  apps: [
    {
      name: 'memeForgeBackend',
      script: './backend/server.js',
      cwd: '/root/meme-token',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      max_memory_restart: '1G',
      error_file: '/root/.pm2/logs/backend-error.log',
      out_file: '/root/.pm2/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'build', '.git']
    },
    {
      name: 'meme-frontend',
      script: './frontend/server.js',
      cwd: '/root/meme-token',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '512M',
      error_file: '/root/.pm2/logs/frontend-error.log',
      out_file: '/root/.pm2/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'build', '.git']
    }
  ]
};
```

### Step 6.2: Start Applications with PM2
```bash
cd ~/meme-token
pm2 start ecosystem.config.js

# Verify
pm2 status
pm2 list
```

### Step 6.3: Save PM2 Configuration
```bash
pm2 save
```

### Step 6.4: Setup PM2 Auto-Start on Reboot
```bash
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
pm2 save
```

---

## 🔧 PHASE 7: APPLICATION DEPLOYMENT
## ========================================

### Step 7.1: Navigate to Project
```bash
cd ~/meme-token
```

### Step 7.2: Install Backend Dependencies
```bash
cd backend
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
```

### Step 7.3: Build Frontend
```bash
cd ../frontend
npm install
npm run build
```

### Step 7.4: Start Applications
```bash
cd ~/meme-token
pm2 start ecosystem.config.js
pm2 status
```

---

## ✅ PHASE 8: VERIFICATION & TESTING
## ========================================

### Step 8.1: Check PM2 Status
```bash
pm2 status
pm2 list
pm2 logs
```

### Step 8.2: Test Backend Health
```bash
curl -X GET https://api.richrevo.com/api/health
```

### Step 8.3: Test Frontend Loading
```bash
curl -X GET https://richrevo.com/
```

### Step 8.4: Check NGINX Status
```bash
sudo systemctl status nginx
```

### Step 8.5: Check Database Connection
```bash
psql -U memeforge -d memeforgedb -h localhost -c "SELECT NOW();"
```

### Step 8.6: View Logs
```bash
# Backend logs
pm2 logs memeForgeBackend

# Frontend logs
pm2 logs meme-frontend

# All logs
pm2 logs

# NGINX error logs
sudo tail -f /var/log/nginx/error.log

# NGINX access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 📋 COMPLETE DEPLOYMENT CHECKLIST
## ========================================

### System Setup
- [ ] System updated and upgraded
- [ ] Essential tools installed (git, curl, wget, etc.)
- [ ] Node.js v18 LTS installed
- [ ] npm working correctly
- [ ] PostgreSQL installed and running
- [ ] NGINX installed and running
- [ ] Certbot installed
- [ ] PM2 installed globally

### Database Setup
- [ ] PostgreSQL user 'memeforge' created
- [ ] Database 'memeforgedb' created
- [ ] Database connection working
- [ ] Backup directory created (optional)

### Project Setup
- [ ] Project cloned from GitHub
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Prisma schema synced with database
- [ ] Frontend built for production

### NGINX Configuration
- [ ] NGINX config updated with correct domains
- [ ] SSL certificates obtained from Let's Encrypt
- [ ] NGINX test passed (nginx -t)
- [ ] NGINX reloaded
- [ ] HTTP to HTTPS redirect working

### PM2 Setup
- [ ] PM2 ecosystem config created
- [ ] Applications started with PM2
- [ ] PM2 auto-start configured
- [ ] PM2 saved and persistent

### Final Verification
- [ ] Backend responding on https://api.richrevo.com
- [ ] Frontend accessible on https://richrevo.com
- [ ] Database connection working
- [ ] SSL certificates valid
- [ ] No errors in logs
- [ ] PM2 processes online

---

## 🚨 TROUBLESHOOTING GUIDE
## ========================================

### npm install fails
```bash
npm install --legacy-peer-deps --verbose
# Check for peer dependency errors with ethers v5/v6
```

### Prisma db push fails
```bash
# Check database connection
psql -U memeforge -d memeforgedb -h localhost

# Generate Prisma client
npx prisma generate

# Try again
npx prisma db push
```

### Port already in use
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Or restart PM2
pm2 restart all
```

### NGINX not routing correctly
```bash
# Test config
sudo nginx -t

# Check config syntax
sudo cat /etc/nginx/sites-enabled/default | grep -n "error"

# Reload NGINX
sudo systemctl reload nginx

# Check NGINX logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# View certificate details
openssl x509 -in /etc/letsencrypt/live/richrevo.com/cert.pem -text -noout

# Renew certificate manually
sudo certbot renew --dry-run

# List all certificates
sudo certbot certificates
```

### Database connection refused
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening
sudo netstat -tlnp | grep postgres

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check .env DATABASE_URL
cat ~/meme-token/backend/.env | grep DATABASE_URL
```

### PM2 processes crashing
```bash
# Check logs
pm2 logs

# Monit specific app
pm2 monit

# Delete ecosystem and restart
pm2 delete all
pm2 start ecosystem.config.js

# Save again
pm2 save
```

---

## 🔒 SECURITY HARDENING
## ========================================

### Firewall Configuration
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

### Fail2Ban Setup (Brute Force Protection)
```bash
sudo apt install -y fail2ban

# Start service
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo systemctl status fail2ban
```

### SSH Key Only (Disable Password)
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Find and change:
# PasswordAuthentication no
# PermitRootLogin prohibit-password

# Restart SSH
sudo systemctl restart ssh
```

---

## 📊 MONITORING & MAINTENANCE
## ========================================

### System Resources
```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory
free -h

# Check running processes
ps aux | grep node
```

### Log Rotation
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/meme-forge
```

Add:
```
/root/.pm2/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 flush
    endscript
}
```

### Database Backup
```bash
# Create backup
pg_dump -U memeforge memeforgedb > /var/backups/memeforgedb_$(date +%Y%m%d_%H%M%S).sql

# List backups
ls -lah /var/backups/

# Restore from backup
psql -U memeforge memeforgedb < /var/backups/memeforgedb_backup.sql
```

---

## 🎯 FINAL CHECKLIST
## ========================================

✅ All system packages installed
✅ Node.js and npm working
✅ PostgreSQL set up with user and database
✅ NGINX configured with SSL
✅ PM2 managing both applications
✅ SSL certificates from Let's Encrypt
✅ Auto-renewal for SSL certificates
✅ Both applications running and responding
✅ Database connection tested
✅ Firewalls configured
✅ Log rotation set up
✅ Backup strategy in place

---

**Status:** ✅ COMPLETE SERVER SETUP READY
**Last Updated:** November 4, 2025
**Environment:** Ubuntu 22.04 LTS
**Domain:** richrevo.com & api.richrevo.com

