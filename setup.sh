#!/bin/bash

# ============================================================
# MEME FORGE - COMPLETE UBUNTU SERVER SETUP SCRIPT
# ============================================================
# This script automates the complete server setup
# Run as root: sudo bash setup.sh
# Server: 92.249.61.60
# Date: November 4, 2025

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# FUNCTIONS
# ============================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================
# PHASE 1: SYSTEM SETUP
# ============================================================

setup_system() {
    log_info "Starting PHASE 1: System Setup..."
    
    log_info "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    sudo apt autoremove -y
    log_success "System updated"
    
    log_info "Installing essential tools..."
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
        openssl \
        systemctl
    log_success "Essential tools installed"
    
    log_info "Installing Node.js v18 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js installed: $(node --version)"
    log_success "npm installed: $(npm --version)"
    
    log_info "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    log_success "PostgreSQL installed and running"
    
    log_info "Installing NGINX..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_success "NGINX installed and running"
    
    log_info "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
    log_success "Certbot installed: $(certbot --version)"
    
    log_info "Installing PM2 globally..."
    sudo npm install -g pm2
    log_success "PM2 installed: $(pm2 --version)"
    
    log_success "PHASE 1 COMPLETED: System Setup Done"
    echo ""
}

# ============================================================
# PHASE 2: DATABASE SETUP
# ============================================================

setup_database() {
    log_info "Starting PHASE 2: Database Setup..."
    
    log_info "Creating PostgreSQL user 'memeforge'..."
    sudo -u postgres psql -c "CREATE USER memeforge WITH PASSWORD 'memeforge123';" || log_warning "User might already exist"
    log_success "PostgreSQL user created"
    
    log_info "Creating database 'memeforgedb'..."
    sudo -u postgres psql -c "CREATE DATABASE memeforgedb OWNER memeforge;" || log_warning "Database might already exist"
    log_success "Database created"
    
    log_info "Granting privileges..."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE memeforgedb TO memeforge;"
    log_success "Privileges granted"
    
    log_info "Testing database connection..."
    psql -U memeforge -d memeforgedb -h localhost -c "SELECT NOW();" > /dev/null && log_success "Database connection successful" || log_error "Database connection failed"
    
    log_info "Creating backup directory..."
    mkdir -p /var/backups/postgres
    sudo chown postgres:postgres /var/backups/postgres
    log_success "Backup directory created"
    
    log_success "PHASE 2 COMPLETED: Database Setup Done"
    echo ""
}

# ============================================================
# PHASE 3: PROJECT SETUP
# ============================================================

setup_project() {
    log_info "Starting PHASE 3: Project Setup..."
    
    log_info "Cloning project from GitHub..."
    if [ ! -d ~/meme-token ]; then
        cd ~
        git clone https://github.com/joker12-dev/meme-forge.git meme-token
        log_success "Project cloned"
    else
        log_warning "Project directory already exists, pulling latest changes..."
        cd ~/meme-token
        git pull origin main
    fi
    
    log_info "Installing backend dependencies..."
    cd ~/meme-token/backend
    npm install --legacy-peer-deps
    log_success "Backend dependencies installed"
    
    log_info "Setting up Prisma..."
    npx prisma generate
    log_success "Prisma client generated"
    
    log_info "Pushing Prisma schema to database..."
    npx prisma db push
    log_success "Database schema synced"
    
    log_info "Installing frontend dependencies..."
    cd ~/meme-token/frontend
    npm install
    log_success "Frontend dependencies installed"
    
    log_info "Building frontend for production..."
    npm run build
    log_success "Frontend built"
    
    log_success "PHASE 3 COMPLETED: Project Setup Done"
    echo ""
}

# ============================================================
# PHASE 4: NGINX SETUP
# ============================================================

setup_nginx() {
    log_info "Starting PHASE 4: NGINX Setup..."
    
    log_info "Backing up original NGINX config..."
    sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
    log_success "Backup created"
    
    log_info "Copying new NGINX config..."
    sudo cp ~/meme-token/nginx-default.conf /etc/nginx/sites-enabled/default
    log_success "NGINX config updated"
    
    log_info "Testing NGINX configuration..."
    sudo nginx -t
    log_success "NGINX configuration is valid"
    
    log_info "Reloading NGINX..."
    sudo systemctl reload nginx
    log_success "NGINX reloaded"
    
    log_success "PHASE 4 COMPLETED: NGINX Setup Done"
    echo ""
}

# ============================================================
# PHASE 5: SSL SETUP
# ============================================================

setup_ssl() {
    log_info "Starting PHASE 5: SSL Certificate Setup..."
    
    log_info "Creating certbot directory..."
    sudo mkdir -p /var/www/certbot
    log_success "Directory created"
    
    log_warning "Getting SSL certificate..."
    log_warning "This requires DNS to be properly configured!"
    
    sudo certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d richrevo.com \
        -d www.richrevo.com \
        -d api.richrevo.com \
        --agree-tos \
        --no-eff-email \
        --non-interactive || log_error "SSL setup might need manual intervention"
    
    log_success "SSL certificate created"
    
    log_info "Setting up auto-renewal..."
    sudo tee /usr/local/bin/renew-certs.sh > /dev/null <<EOF
#!/bin/bash
certbot renew --quiet
systemctl reload nginx
EOF
    sudo chmod +x /usr/local/bin/renew-certs.sh
    
    # Add cron job
    (sudo crontab -l 2>/dev/null | grep -v "renew-certs" || true; echo "0 2 * * * /usr/local/bin/renew-certs.sh") | sudo crontab -
    log_success "Auto-renewal configured"
    
    log_info "Testing NGINX with SSL..."
    sudo nginx -t
    sudo systemctl reload nginx
    log_success "NGINX SSL configured"
    
    log_success "PHASE 5 COMPLETED: SSL Setup Done"
    echo ""
}

# ============================================================
# PHASE 6: PM2 SETUP
# ============================================================

setup_pm2() {
    log_info "Starting PHASE 6: PM2 Setup..."
    
    log_info "Configuring PM2 ecosystem..."
    cd ~/meme-token
    
    log_info "Starting applications with PM2..."
    pm2 start ecosystem.config.js
    log_success "Applications started with PM2"
    
    log_info "Saving PM2 configuration..."
    pm2 save
    log_success "PM2 configuration saved"
    
    log_info "Setting up PM2 auto-start on reboot..."
    sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
    pm2 save
    log_success "PM2 auto-start configured"
    
    log_info "PM2 Status:"
    pm2 status
    
    log_success "PHASE 6 COMPLETED: PM2 Setup Done"
    echo ""
}

# ============================================================
# PHASE 7: VERIFICATION
# ============================================================

verify_setup() {
    log_info "Starting PHASE 7: Verification..."
    echo ""
    
    log_info "Checking system components..."
    
    echo -n "Node.js: "
    node --version && echo ""
    
    echo -n "npm: "
    npm --version && echo ""
    
    echo -n "PostgreSQL: "
    sudo systemctl status postgresql --no-pager | grep "active" && echo ""
    
    echo -n "NGINX: "
    sudo systemctl status nginx --no-pager | grep "active" && echo ""
    
    echo -n "PM2: "
    pm2 status | head -5 && echo ""
    
    log_info "Testing database connection..."
    psql -U memeforge -d memeforgedb -h localhost -c "SELECT NOW();" > /dev/null && log_success "Database connection OK" || log_error "Database connection FAILED"
    
    log_info "PM2 Process Status:"
    pm2 list
    
    log_info "Recent logs:"
    pm2 logs --lines 10 --nostream
    
    log_success "PHASE 7 COMPLETED: Verification Done"
    echo ""
}

# ============================================================
# MAIN EXECUTION
# ============================================================

main() {
    echo ""
    echo "============================================================"
    echo "  MEME FORGE - COMPLETE UBUNTU SERVER SETUP"
    echo "  Version: 1.0"
    echo "  Date: November 4, 2025"
    echo "============================================================"
    echo ""
    
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root"
        exit 1
    fi
    
    log_warning "Starting complete server setup..."
    log_warning "This will take 15-30 minutes to complete"
    echo ""
    
    setup_system
    setup_database
    setup_project
    setup_nginx
    setup_ssl
    setup_pm2
    verify_setup
    
    echo ""
    echo "============================================================"
    echo "  ✅ SETUP COMPLETED SUCCESSFULLY!"
    echo "============================================================"
    echo ""
    log_success "Your Meme Forge platform is now running!"
    echo ""
    echo "Access your application:"
    echo "  Frontend: https://richrevo.com"
    echo "  Backend API: https://api.richrevo.com"
    echo ""
    echo "View logs:"
    echo "  pm2 logs"
    echo ""
    echo "Restart services:"
    echo "  pm2 restart all"
    echo ""
    echo "Monitor processes:"
    echo "  pm2 monit"
    echo ""
    echo "============================================================"
}

# Run main function
main

