# 📦 INITIAL PACKAGES - UBUNTU SERVER SETUP
# Fresh Ubuntu 22.04 LTS Server
# Run these commands in terminal order

## ============================================================
## 🔄 STEP 0: CONNECT TO SERVER
## ============================================================

ssh root@92.249.61.60


## ============================================================
## 📦 STEP 1: UPDATE SYSTEM
## ============================================================

sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y


## ============================================================
## 🛠️ STEP 2: BUILD TOOLS & DEVELOPMENT LIBRARIES
## ============================================================

# Install C/C++ compilers and build essentials
sudo apt install -y \
  build-essential \
  gcc \
  g++ \
  make \
  python3-dev \
  python3-pip \
  libssl-dev


## ============================================================
## 📥 STEP 3: GIT & DOWNLOAD TOOLS
## ============================================================

# Install Git for version control
sudo apt install -y git

# Install curl and wget for downloading files
sudo apt install -y \
  curl \
  wget

# Verify Git installation
git --version


## ============================================================
## ✍️ STEP 4: TEXT EDITORS & SYSTEM UTILITIES
## ============================================================

# Install text editors
sudo apt install -y \
  vim \
  nano

# Install system monitoring tools
sudo apt install -y \
  htop \
  net-tools

# Install compression utilities
sudo apt install -y \
  zip \
  unzip

# Install OpenSSL (needed for Node.js)
sudo apt install -y openssl


## ============================================================
## 🟢 STEP 5: NODE.JS 18 LTS (MOST IMPORTANT!)
## ============================================================

# Add Node.js 18 repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Example output should be:
# v18.x.x (or higher v18)
# 9.x.x (or higher)


## ============================================================
## 🗄️ STEP 6: POSTGRESQL DATABASE
## ============================================================

# Install PostgreSQL and extensions
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Check PostgreSQL status
sudo systemctl status postgresql


## ============================================================
## 🌐 STEP 7: NGINX WEB SERVER
## ============================================================

# Install NGINX
sudo apt install -y nginx

# Start NGINX
sudo systemctl start nginx

# Enable NGINX to start on boot
sudo systemctl enable nginx

# Check NGINX status
sudo systemctl status nginx

# Verify NGINX version
nginx -v


## ============================================================
## 🔐 STEP 8: CERTBOT (SSL/HTTPS)
## ============================================================

# Install Certbot and NGINX plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify Certbot installation
certbot --version


## ============================================================
## ⚙️ STEP 9: PM2 (PROCESS MANAGER)
## ============================================================

# Install PM2 globally (using npm)
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version


## ============================================================
## 🛡️ STEP 10: SECURITY TOOLS (OPTIONAL)
## ============================================================

# Install Fail2Ban (brute force protection)
sudo apt install -y fail2ban

# Install UFW (firewall - we'll configure it later)
sudo apt install -y ufw

# Install tmux and screen (terminal multiplexers)
sudo apt install -y \
  tmux \
  screen


## ============================================================
## ✅ VERIFICATION
## ============================================================

# Verify all installations

echo "=== Checking Installed Packages ==="
echo ""

echo "Git:"
git --version

echo ""
echo "Node.js:"
node --version

echo ""
echo "npm:"
npm --version

echo ""
echo "PostgreSQL:"
sudo -u postgres psql --version

echo ""
echo "NGINX:"
nginx -v

echo ""
echo "PM2:"
pm2 --version

echo ""
echo "Certbot:"
certbot --version


## ============================================================
## 📋 QUICK REFERENCE - PACKAGE PURPOSES
## ============================================================

# Build Tools
#  build-essential  - Compiler and build tools
#  gcc, g++         - C and C++ compilers
#  make             - Build automation tool
#  python3-dev      - Python development libraries
#  libssl-dev       - SSL/TLS development library

# Version Control & Download
#  git              - Version control system
#  curl             - Download files from web
#  wget             - Command-line downloader

# System Tools
#  vim, nano        - Text editors
#  htop             - System resource monitor
#  net-tools        - Network utilities (ifconfig, netstat, etc.)
#  zip, unzip       - Compression tools
#  openssl          - SSL/TLS utilities

# Core Services
#  nodejs           - JavaScript runtime (v18 LTS)
#  npm              - Node package manager
#  postgresql       - Database server
#  postgresql-contrib - PostgreSQL extensions
#  nginx            - Web server & reverse proxy
#  certbot          - Let's Encrypt certificate tool
#  python3-certbot-nginx - Certbot NGINX plugin

# Process Management
#  pm2              - Node.js process manager

# Security
#  fail2ban         - DDoS/brute force protection
#  ufw              - Ubuntu firewall

# Terminals
#  tmux, screen     - Terminal multiplexers


## ============================================================
## 🚀 NEXT STEPS AFTER PACKAGES
## ============================================================

# 1. Setup PostgreSQL User
sudo -u postgres psql -c "CREATE USER memeforge WITH PASSWORD 'memeforge123';"

# 2. Create Database
sudo -u postgres psql -c "CREATE DATABASE memeforgedb OWNER memeforge;"

# 3. Test Connection
psql -U memeforge -d memeforgedb -h localhost -c "SELECT NOW();"

# 4. Clone Project
cd ~
git clone https://github.com/joker12-dev/meme-forge.git meme-token
cd meme-token

# 5. Run Full Setup
sudo bash setup.sh

# OR continue with manual installation following COMPLETE-SERVER-SETUP.md


## ============================================================
## 💾 SINGLE COMMAND - INSTALL ALL AT ONCE
## ============================================================

# If you want to install everything in one command (copy-paste):

sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y && \
sudo apt install -y build-essential gcc g++ make python3-dev python3-pip libssl-dev git curl wget vim nano htop net-tools zip unzip openssl postgresql postgresql-contrib nginx certbot python3-certbot-nginx fail2ban ufw tmux screen && \
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
sudo apt install -y nodejs && \
sudo npm install -g pm2 && \
sudo systemctl start postgresql nginx && \
sudo systemctl enable postgresql nginx && \
echo "✅ All packages installed successfully!"


## ============================================================
## 📊 PACKAGE INSTALLATION TIME ESTIMATE
## ============================================================

# System update:           2-3 minutes
# Build tools:             1-2 minutes
# Git & utilities:         1 minute
# Node.js 18:              2-3 minutes
# PostgreSQL:              2-3 minutes
# NGINX:                   1 minute
# Certbot:                 1 minute
# PM2:                     30 seconds
# Security tools:          1 minute
# TOTAL:                   ~12-15 minutes


## ============================================================
## ⚠️ TROUBLESHOOTING
## ============================================================

# If apt install fails:
sudo apt update
sudo apt --fix-broken install

# If Node.js repository adds fails:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# If PostgreSQL won't start:
sudo systemctl restart postgresql
sudo systemctl status postgresql

# If NGINX fails:
sudo nginx -t
sudo systemctl restart nginx

# If permission denied errors:
# Make sure you're using 'sudo' prefix for system commands

# Check available disk space:
df -h

# Check system memory:
free -h

# If running low on resources:
sudo apt autoremove -y
sudo apt autoclean -y

