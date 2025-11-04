#!/bin/bash

# ============================================================
# MEME FORGE - INITIAL SERVER PACKAGES
# ============================================================
# Ubuntu 22.04 LTS - Fresh Server Setup
# Run these commands in order on your Ubuntu server
# Date: November 4, 2025

echo "🚀 Starting Initial Package Installation..."
echo ""

# ============================================================
# STEP 1: UPDATE SYSTEM
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Update System Packages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

echo "✅ System updated successfully"
echo ""

# ============================================================
# STEP 2: INSTALL BUILD TOOLS
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Install Build Tools & Development Libraries"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt install -y \
  build-essential \
  gcc \
  g++ \
  make \
  python3-dev \
  python3-pip \
  libssl-dev

echo "✅ Build tools installed"
echo ""

# ============================================================
# STEP 3: INSTALL GIT & VERSION CONTROL
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Install Git & Version Control"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt install -y \
  git \
  curl \
  wget

git --version
echo "✅ Git installed"
echo ""

# ============================================================
# STEP 4: INSTALL TEXT EDITORS & UTILITIES
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Install Text Editors & System Utilities"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt install -y \
  vim \
  nano \
  htop \
  net-tools \
  zip \
  unzip \
  openssl

echo "✅ Utilities installed"
echo ""

# ============================================================
# STEP 5: INSTALL NODE.JS 18 LTS
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Install Node.js 18 LTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

node --version
npm --version
echo "✅ Node.js 18 LTS installed"
echo ""

# ============================================================
# STEP 6: INSTALL POSTGRESQL
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: Install PostgreSQL 14"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt install -y postgresql postgresql-contrib

sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo systemctl status postgresql --no-pager | head -5
echo "✅ PostgreSQL installed and running"
echo ""

# ============================================================
# STEP 7: INSTALL NGINX
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 7: Install NGINX"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt install -y nginx

sudo systemctl start nginx
sudo systemctl enable nginx

nginx -v
echo "✅ NGINX installed and running"
echo ""

# ============================================================
# STEP 8: INSTALL CERTBOT (SSL)
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 8: Install Certbot (Let's Encrypt SSL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt install -y certbot python3-certbot-nginx

certbot --version
echo "✅ Certbot installed"
echo ""

# ============================================================
# STEP 9: INSTALL PM2 (PROCESS MANAGER)
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 9: Install PM2 (Node Process Manager)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo npm install -g pm2

pm2 --version
echo "✅ PM2 installed"
echo ""

# ============================================================
# STEP 10: INSTALL ADDITIONAL UTILITIES
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 10: Install Additional Utilities"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo apt install -y \
  fail2ban \
  ufw \
  tmux \
  screen

echo "✅ Additional utilities installed"
echo ""

# ============================================================
# FINAL VERIFICATION
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICATION: Checking Installed Packages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Git version:"
git --version
echo ""

echo "Node.js version:"
node --version
echo ""

echo "npm version:"
npm --version
echo ""

echo "PostgreSQL version:"
sudo -u postgres psql --version
echo ""

echo "NGINX version:"
nginx -v
echo ""

echo "PM2 version:"
pm2 --version
echo ""

echo "Certbot version:"
certbot --version
echo ""

# ============================================================
# SUMMARY
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL PACKAGES INSTALLED SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Installed packages summary:"
echo "  ✅ Git & Version Control"
echo "  ✅ Build Tools (gcc, g++, make)"
echo "  ✅ Node.js 18 LTS"
echo "  ✅ npm (Node Package Manager)"
echo "  ✅ PostgreSQL 14"
echo "  ✅ NGINX Web Server"
echo "  ✅ Certbot (SSL/HTTPS)"
echo "  ✅ PM2 (Process Manager)"
echo "  ✅ System Utilities (htop, nano, vim, etc.)"
echo "  ✅ Security Tools (fail2ban, ufw)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Setup PostgreSQL user:"
echo "   sudo -u postgres psql -c \"CREATE USER memeforge WITH PASSWORD 'memeforge123';\""
echo ""
echo "2. Create PostgreSQL database:"
echo "   sudo -u postgres psql -c \"CREATE DATABASE memeforgedb OWNER memeforge;\""
echo ""
echo "3. Clone project:"
echo "   cd ~"
echo "   git clone https://github.com/joker12-dev/meme-forge.git meme-token"
echo ""
echo "4. Run setup script:"
echo "   sudo bash ~/meme-token/setup.sh"
echo ""
echo "Or continue with manual setup following COMPLETE-SERVER-SETUP.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

