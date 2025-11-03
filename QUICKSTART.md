# 🚀 Meme Token Platform - Quick Start Guide

## ⚡ 5-Minute Local Setup

### 1️⃣ Prerequisites
```bash
# Check installations
node --version    # Should be v18+
postgres --version # Should be v14+
npm --version
```

### 2️⃣ Install Dependencies
```bash
# Root
npm install

# Backend
cd backend && npm install && cd ..

# Frontend  
cd frontend && npm install && cd ..

# Contracts
cd contracts && npm install && cd ..
```

### 3️⃣ Setup Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values (or use defaults for local testing)
# Minimum required:
# - PRIVATE_KEY (get from MetaMask)
# - DB_PASSWORD (your PostgreSQL password)
# - Fee wallet addresses (can use your address for all 5 wallets for testing)
```

### 4️⃣ Setup Database
```bash
# Create database
createdb meme_token_db

# Or in psql:
psql -U postgres
CREATE DATABASE meme_token_db;
\q

# Sync schema
cd backend
node scripts/syncDatabase.js
```

### 5️⃣ Deploy Contracts (Local)
```bash
# Terminal 1: Start local blockchain
cd contracts
npx hardhat node
# Keep this running!

# Terminal 2: Deploy contracts
cd contracts
npx hardhat run scripts/deploy.js --network localhost

# Copy the contract addresses shown in output
# Add them to your .env file
```

### 6️⃣ Start Backend
```bash
# Terminal 3
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

### 7️⃣ Start Frontend
```bash
# Terminal 4
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

### 8️⃣ Setup MetaMask

1. **Add Hardhat Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. **Import Test Account:**
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
   This account has 10,000 ETH on Hardhat network

3. **Connect to Site:**
   - Visit http://localhost:3000
   - Click "Connect Wallet"
   - Approve connection

---

## 🎯 Create Your First Token

1. Visit http://localhost:3000
2. Click **"Create Token"**
3. Fill in:
   - Name: `Test Doge`
   - Symbol: `TDOGE`
   - Supply: `1000000`
   - Decimals: `18`
4. Choose **Standard** tier
5. Click **Next** through steps
6. **Confirm transaction** in MetaMask
7. Wait for confirmation ✅

Your token is now live!

---

## 📊 View Your Token

- Token will appear on homepage: http://localhost:3000
- Click on your token to see details
- View on "My Tokens" section

---

## 🧪 Test Campaigns

```bash
cd backend
node scripts/createTestCampaigns.js
```

Visit http://localhost:3000/campaigns

---

## 🔧 Common Issues

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_ctl status

# Start if needed
brew services start postgresql  # Mac
sudo service postgresql start    # Linux
```

### "Contract deployment failed"
```bash
# Make sure Hardhat node is running
cd contracts
npx hardhat node
```

### "MetaMask wrong network"
- Click network dropdown
- Select "Hardhat Local"
- Or add network manually (see step 8)

### "Transaction failed"
- Check you have ETH in wallet
- Verify contract address in frontend
- Check console for errors

---

## 📁 Project Structure

```
meme-token/
├── backend/           # Node.js API server
│   ├── server.js     # Main server
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── scripts/      # Utility scripts
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   └── utils/      # Utilities
│   └── public/
├── contracts/         # Smart contracts
│   ├── contracts/    # Solidity files
│   ├── scripts/      # Deploy scripts
│   └── test/         # Contract tests
└── docs/             # Documentation
```

---

## 🎓 Next Steps

1. **Read full deployment guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Explore components:**
   - Token Factory: `contracts/contracts/TokenFactory.sol`
   - Token Template: `contracts/contracts/MemeToken.sol`
   - Create Token UI: `frontend/src/components/CreateToken.js`

3. **Customize:**
   - Modify fee structure in `TokenFactory.sol`
   - Update UI styling in component CSS files
   - Add new features to backend API

4. **Deploy to Testnet:**
   - Get testnet BNB from faucet
   - Update `.env` with testnet config
   - Run: `npx hardhat run scripts/deploy.js --network bscTestnet`

5. **Test Everything:**
   - Create tokens
   - Add liquidity
   - Test trading
   - Verify campaigns work
   - Check fees distribution

---

## 🎨 Key Features

### ✅ Smart Contracts
- [x] ERC20 token creation
- [x] 3 tier pricing (Basic, Standard, Premium)
- [x] Customizable taxes (marketing, liquidity)
- [x] Auto-burn functionality
- [x] LP lock mechanism
- [x] Fee distribution system

### ✅ Backend
- [x] RESTful API
- [x] PostgreSQL database
- [x] Token CRUD operations
- [x] Campaign management
- [x] Hype system
- [x] Auto-refresh (10s interval)

### ✅ Frontend
- [x] Modern React UI
- [x] MetaMask integration
- [x] Multi-step token creation
- [x] Token list with filters
- [x] Campaign slider
- [x] Hype slider
- [x] Real-time updates
- [x] Responsive design

---

## 💰 Fee Structure

| Tier | Creation Fee | Default Taxes | Max Tax | Auto-Burn |
|------|-------------|---------------|---------|-----------|
| Basic | 0.01 BNB | 0% / 0% | 10% | ❌ |
| Standard | 0.012 BNB | 3% / 2% | 12% | ❌ |
| Premium | 0.015 BNB | 5% / 3% | 15% | ✅ |

**Fee Distribution:**
- Platform: 70%
- Development: 20%
- Marketing: 10%

---

## 🛠️ Development Commands

```bash
# Contracts
cd contracts
npx hardhat compile        # Compile contracts
npx hardhat test          # Run tests
npx hardhat node          # Start local blockchain
npx hardhat clean         # Clean artifacts

# Backend
cd backend
npm run dev               # Start with nodemon
npm start                 # Start normally
node scripts/syncDatabase.js  # Sync DB

# Frontend
cd frontend
npm start                 # Development server
npm build                 # Production build
npm test                  # Run tests
```

---

## 📝 Environment Variables

### Required
```env
PRIVATE_KEY=your_private_key
DB_PASSWORD=your_db_password
PLATFORM_WALLET=0x...
DEVELOPMENT_WALLET=0x...
MARKETING_WALLET=0x...
```

### Optional
```env
BSCSCAN_API_KEY=for_contract_verification
JWT_SECRET=for_authentication
COINMARKETCAP_API_KEY=for_gas_reporting
```

See `.env.example` for full list

---

## 🔗 Useful Links

- **PancakeSwap Testnet:** https://pancake.kiemtienonline360.com/
- **BSC Testnet Faucet:** https://testnet.binance.org/faucet-smart
- **BSCScan Testnet:** https://testnet.bscscan.com/
- **Hardhat Docs:** https://hardhat.org/docs
- **OpenZeppelin:** https://docs.openzeppelin.com/

---

## 📞 Support

- **Issues:** Open GitHub issue
- **Questions:** Check `/docs` folder
- **Contracts:** Fully commented Solidity code
- **API:** RESTful endpoints documented in code

---

## ⚠️ Security Warnings

- **NEVER** commit `.env` file
- **NEVER** share your `PRIVATE_KEY`
- **ALWAYS** test on testnet first
- **USE** hardware wallet for mainnet
- **AUDIT** contracts before mainnet deployment

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) file

---

**Made with ❤️ for the meme token community**

🚀 **Ready to launch your meme empire!**
