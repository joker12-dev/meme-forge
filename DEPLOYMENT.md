# 🚀 Meme Token Platform - Production Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software
- Node.js v18+ 
- PostgreSQL 14+
- MetaMask or similar Web3 wallet
- Git

### Required Accounts
- BSC Wallet with BNB (for deployment)
- BSCScan API Key (for contract verification)
- PostgreSQL database

---

## Environment Setup

### 1. Clone and Install

```bash
cd meme-token
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd contracts && npm install && cd ..
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# ⚠️ CRITICAL: Your deployment wallet private key
PRIVATE_KEY=your_metamask_private_key_here

# ⚠️ CRITICAL: Your fee collection wallets
PLATFORM_WALLET=0xYourPlatformWalletAddress
DEVELOPMENT_WALLET=0xYourDevelopmentWalletAddress
MARKETING_WALLET=0xYourMarketingWalletAddress
PLATFORM_COMMISSION_WALLET=0xYourCommissionWalletAddress
LIQUIDITY_FEE_WALLET=0xYourLiquidityFeeWalletAddress

# BSCScan API for contract verification
BSCSCAN_API_KEY=your_bscscan_api_key

# Database credentials
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=meme_token_db

# JWT Secret (generate random 32+ characters)
JWT_SECRET=generate_a_very_long_random_string_here_min_32_chars
```

### 3. Database Setup

Create PostgreSQL database:
```sql
CREATE DATABASE meme_token_db;
CREATE USER meme_token_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE meme_token_db TO meme_token_user;
```

Initialize database schema:
```bash
cd backend
node scripts/syncDatabase.js
```

---

## Smart Contract Deployment

### Option 1: Local Testing (Hardhat Network)

1. **Start Hardhat Node:**
```bash
cd contracts
npx hardhat node
```

2. **Deploy Contracts (in new terminal):**
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

3. **Save Contract Addresses:**
After deployment, copy the addresses to `.env`:
```env
FACTORY_ADDRESS=0x...
MEME_TOKEN_TEMPLATE=0x...
LIQUIDITY_ADDER_ADDRESS=0x...
```

### Option 2: BSC Testnet Deployment

1. **Get Testnet BNB:**
   - Visit https://testnet.binance.org/faucet-smart
   - Enter your wallet address
   - Request BNB

2. **Deploy to Testnet:**
```bash
cd contracts
npx hardhat run scripts/deploy.js --network bscTestnet
```

3. **Verify Contracts (automatic in script):**
Contracts will be auto-verified on BSCScan after deployment.

### Option 3: BSC Mainnet Deployment ⚠️

**WARNING: This costs real BNB. Test everything on testnet first!**

```bash
cd contracts
npx hardhat run scripts/deploy.js --network bsc
```

---

## Backend Setup

### 1. Update Backend Config

Edit `backend/server.js` and update contract addresses:

```javascript
const FACTORY_ADDRESS = 'your_deployed_factory_address';
const MEME_TOKEN_TEMPLATE = 'your_template_address';
```

### 2. Sync Database

```bash
cd backend
node scripts/syncDatabase.js
```

### 3. Create Test Data (Optional)

```bash
cd backend
node scripts/createTestCampaigns.js
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on http://localhost:3001

---

## Frontend Setup

### 1. Update Frontend Config

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_FACTORY_ADDRESS=your_deployed_factory_address
REACT_APP_NETWORK=testnet
```

### 2. Update Contract ABIs

Copy contract ABIs to frontend:
```bash
# Automatically done if using the same monorepo
# ABIs are in: contracts/artifacts/contracts/
```

### 3. Start Frontend

```bash
cd frontend
npm start
```

Frontend will run on http://localhost:3000

---

## Testing

### 1. Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

### 2. Test Token Creation Flow

1. **Connect MetaMask** to localhost:8545 or BSC Testnet
2. **Add test network** in MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. **Import test account** (Hardhat #0):
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

4. **Create a test token:**
   - Visit http://localhost:3000
   - Click "Create Token"
   - Fill form
   - Confirm transactions in MetaMask

### 3. Test Campaign System

```bash
cd backend
node scripts/createTestCampaigns.js
```

Visit http://localhost:3000/campaigns to see campaigns.

---

## Production Deployment

### Frontend (Vercel/Netlify)

1. **Build frontend:**
```bash
cd frontend
npm run build
```

2. **Deploy build folder** to hosting service.

3. **Set environment variables:**
```
REACT_APP_API_URL=https://your-backend-api.com
REACT_APP_FACTORY_ADDRESS=your_mainnet_factory_address
REACT_APP_NETWORK=mainnet
```

### Backend (VPS/Cloud)

1. **Use PM2 for process management:**
```bash
cd backend
npm install -g pm2
pm2 start server.js --name meme-token-backend
pm2 startup
pm2 save
```

2. **Setup Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Database (Production)

1. **Use managed PostgreSQL:**
   - AWS RDS
   - Digital Ocean Managed Database
   - Supabase

2. **Run migrations:**
```bash
cd backend
NODE_ENV=production node scripts/syncDatabase.js
```

---

## Fee Structure

### Token Creation Fees (Collected by Factory)

- **Basic Tier:** 0.01 BNB
  - No default taxes
  - Max 10% total tax

- **Standard Tier:** 0.012 BNB  
  - 3% marketing tax (default)
  - 2% liquidity tax (default)
  - Max 12% total tax

- **Premium Tier:** 0.015 BNB
  - 5% marketing tax (default)
  - 3% liquidity tax (default)
  - Auto-burn enabled
  - Max 15% total tax

### Fee Distribution (Default)

- Platform: 70%
- Development: 20%
- Marketing: 10%

### Transaction Taxes (Configurable per Token)

- Marketing Tax: 0-15%
- Liquidity Tax: 0-15%
- Platform Commission: 10% (from collected taxes)

---

## Contract Addresses

### BSC Testnet
```
Factory: 0x... (after deployment)
Template: 0x... (after deployment)
PancakeSwap Router: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
```

### BSC Mainnet
```
Factory: 0x... (after deployment)
Template: 0x... (after deployment)
PancakeSwap Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
```

---

## Security Checklist

- [ ] All private keys secured and not committed to git
- [ ] `.env` file is in `.gitignore`
- [ ] Fee wallets are multi-sig or hardware wallets
- [ ] Contracts audited before mainnet deployment
- [ ] Database has SSL enabled
- [ ] Backend API has rate limiting
- [ ] CORS properly configured
- [ ] SQL injection prevention enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

---

## Monitoring

### Smart Contract Events

Monitor these events:
- `TokenCreated` - New token launches
- `LiquidityLocked` - LP locks
- `FeesDistributed` - Fee collection

### Backend Metrics

- API response times
- Database connection pool
- Error rates
- Token creation rate
- User activity

---

## Troubleshooting

### "Insufficient funds" error
- Ensure your wallet has enough BNB
- Check gas price settings
- Verify you're on correct network

### Contract deployment fails
- Check `PRIVATE_KEY` is correct
- Verify wallet has BNB
- Ensure network RPC is accessible
- Try increasing gas limit

### Frontend can't connect to wallet
- Check MetaMask is installed
- Verify network matches contract deployment
- Clear browser cache
- Check console for errors

### Database connection errors
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists
- Check firewall rules

---

## Support

- Documentation: `/docs`
- Contract Source: `/contracts/contracts`
- Issues: GitHub Issues
- Community: Telegram/Discord

---

## License

MIT License - See LICENSE file for details

---

**Last Updated:** October 2025
**Version:** 1.0.0
