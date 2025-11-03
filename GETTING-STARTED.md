# 🚀 GETTING STARTED - Visual Guide

**Status:** ✅ Ready to Use  
**Date:** November 2, 2025

---

## 📖 Real Example - User Ali Creates LUCKY Token

**Want to see a real example?** → Read **[USER-JOURNEY-EXAMPLE.md](./USER-JOURNEY-EXAMPLE.md)**
- Complete step-by-step story of token creation
- What Ali sees at each step
- Backend operations explained
- Smart contract execution detailed
- Final result and earnings

**Want to see it as timeline?** → Read **[VISUAL-USER-JOURNEY.md](./VISUAL-USER-JOURNEY.md)**
- Visual flowchart with all steps
- Time-based progression
- What happens at each stage
- Trading starts and LP unlock
- 30-day complete lifecycle

---

## 🎬 5-Minute Quick Start

### Option 1: Run Everything Locally

```bash
# Terminal 1: Start Backend
cd backend
npm start
# You'll see: "Server running on port 3001"

# Terminal 2: Start Frontend (serve production build)
cd frontend
serve -s build -l 3000
# You'll see: "Accepting connections at http://localhost:3000"

# Open Browser
http://localhost:3000
```

### Option 2: Access Production (External IP)

```
Frontend:  http://78.184.163.223:3000
Backend:   http://78.184.163.223:3001
```

---

## 📋 First Token Creation Walkthrough

### Step 1: Create Token
1. Go to frontend (`http://localhost:3000`)
2. Click "Create Token"
3. Fill in:
   - Name: "Test Token"
   - Symbol: "TEST"
   - Supply: "1000000"
   - Description: "Test description"
4. Click "Create"
5. Wait for success ✅

### Step 2: Verify Token Created
1. Copy token address from success message
2. Go to BSCScan: `https://testnet.bscscan.com/token/{address}`
3. Check: Supply should show in platform wallet (0x4169...)

### Step 3: Approve LiquidityAdder
```bash
cd contracts

# Set the token address
$env:TOKEN_ADDRESS = "0x..." # Paste token address here

# Run approval script
npx hardhat run scripts/approve-liquidity-adder.js --network bscTestnet
```

Expected output:
```
✅ Approval successful!
✅ Verified Allowance: 999999999000000000000000000
```

### Step 4: Add Liquidity (Manual - via Metamask)
1. Go to BSCScan: `https://testnet.bscscan.com/address/0xE647B02b4456bB26B55F87F001b9a96D4d48eBf1`
2. Click "Write as Proxy"
3. Find `addLiquidityFrom` function
4. Fill in:
   - `token`: (token address from step 1)
   - `from`: `0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C`
   - `tokenAmount`: `500000000000000000000000` (500k tokens)
   - `recipient`: (creator address)
5. Send 1 BNB in value field
6. Click "Write" and sign

### Step 5: Verify Trading Works
1. Go to: https://testnet.pancakeswap.finance/swap
2. Paste token address
3. Try small swap (e.g., 0.01 BNB for tokens)
4. ✅ Should work!

---

## 📂 Project Structure

```
meme-token/
│
├─ 📁 backend/
│  ├─ server.js              (Main API server)
│  ├─ app.js                 (Express app)
│  ├─ package.json
│  └─ ... (routes, models, middleware)
│
├─ 📁 frontend/
│  ├─ src/
│  │  ├─ App.js              (Main app)
│  │  ├─ utils/api.js        (API client with getBackendURL)
│  │  └─ ... (components, pages, contexts)
│  ├─ build/                 (Production build - ready to serve)
│  └─ package.json
│
├─ 📁 contracts/
│  ├─ contracts/
│  │  ├─ MemeToken.sol       (Token template - NEW)
│  │  ├─ LiquidityAdder.sol  (LP manager - NEW)
│  │  └─ TokenFactory.sol    (Factory - UPDATED)
│  ├─ scripts/
│  │  ├─ deploy-updated.js        (Deploy script)
│  │  └─ approve-liquidity-adder.js (Approval script)
│  ├─ .env                   (Environment - NEW)
│  └─ hardhat.config.js
│
├─ .env                      (Root env - UPDATED)
├─ QUICK-START.md            (Start here!)
├─ DEPLOYMENT-COMPLETE.md    (What's done)
├─ LP-FLOW-DOCUMENTATION.md  (Token flow)
├─ ARCHITECTURE.md           (System design)
├─ PRODUCTION-CHECKLIST.md   (Status)
└─ DOCUMENTATION-INDEX.md    (Doc map)
```

---

## 🔑 Key Concepts

### New Token Economics

```
OLD WAY:
┌─────────────────┐
│ User Creates    │
│ Token           │
└────────┬────────┘
         │
         ▼
  ❌ Creator gets 1M tokens
  ❌ Creator adds liquidity manually
  ❌ Creator controls everything
  ❌ RISK: Rug pull possible
  
NEW WAY:
┌─────────────────┐
│ User Creates    │
│ Token           │
└────────┬────────┘
         │
         ▼
  ✅ Platform gets 1M tokens
  ✅ Platform adds liquidity via addLiquidityFrom()
  ✅ Creator receives LP tokens (locked)
  ✅ SAFE: No rug pull possible
```

### How addLiquidityFrom() Works

```
1. Platform wallet has: 1,000,000 tokens
2. Platform approves: LiquidityAdder can spend up to 999M tokens
3. Platform calls: addLiquidityFrom()
   ├─ Pulls 500k tokens from platform
   ├─ Takes 1% fee (5k tokens go to platform)
   ├─ Adds 495k tokens + 1 BNB to PancakeSwap
   ├─ Gets LP tokens
   └─ Sends LP tokens to creator
4. Creator now has: LP tokens (locked, can't rug)
5. Trading: Available on PancakeSwap
```

---

## 🎮 Common Tasks

### Task 1: Check if Services are Running

```bash
# Frontend (should respond with HTML)
curl http://localhost:3000

# Backend (check health endpoint)
curl http://localhost:3001/api/health

# Contract (check it exists on chain)
# Visit: https://testnet.bscscan.com/address/0x4aF9D19C9442bc7b9ab912C7Ec65659A0F56Cc29
```

### Task 2: View Server Logs

```bash
# Backend logs
cd backend
npm start
# You'll see real-time logs

# To see all logs from today:
# Check: backend/logs/ directory
```

### Task 3: Restart Services

```bash
# Stop backend: Ctrl+C in terminal
# Restart:
cd backend
npm start

# Stop frontend: Ctrl+C in terminal
# Restart:
cd frontend
serve -s build -l 3000
```

### Task 4: Check Database

```bash
# Connect to PostgreSQL
psql postgresql://postgres:123456@localhost:5432/postgres

# Show tables:
\dt

# Check tokens:
SELECT id, name, symbol, total_supply, created_at FROM tokens;

# Exit:
\q
```

### Task 5: Deploy New Contract (if needed)

```bash
cd contracts

# Compile
npx hardhat compile

# Deploy
npx hardhat run scripts/deploy-updated.js --network bscTestnet

# Verify
npx hardhat verify --network bscTestnet 0x... "args..."
```

---

## 🐛 Troubleshooting

### "Frontend can't reach backend"
```
Check:
1. Is backend running? (http://localhost:3001 should respond)
2. Is frontend using correct backend URL? (check .env)
3. Firewall blocking? (check port 3001)
4. CORS issue? (check backend/server.js)

Fix:
npm run build  # Rebuild frontend
# or
# Update .env with correct backend URL
```

### "Token not showing up"
```
Check:
1. Is transaction confirmed? (check BSCScan)
2. Is it in platform wallet? (check token's BSCScan page)
3. Correct token factory? (verify factory address in .env)

Fix:
# Check token address
https://testnet.bscscan.com/address/0x...
```

### "Approval script fails"
```
Check:
1. TOKEN_ADDRESS is valid? (must be deployed token)
2. Platform wallet has gas? (needs BNB for transaction)
3. Network is correct? (must be BSC Testnet)

Fix:
# Send test BNB to platform wallet
# Or use different testnet faucet
```

### "addLiquidityFrom() reverts"
```
Check:
1. Platform wallet approved LiquidityAdder?
2. Token amounts reasonable? (not 0 or too large)
3. ETH amount sufficient? (send enough for swap)
4. Contract not paused? (check contract state)

Fix:
# Run approval script again
# Check contract state on BSCScan
```

---

## 📊 System Ports & URLs

```
┌─────────────────────────────────────────┐
│         SYSTEM ADDRESSES                │
├─────────────────────────────────────────┤
│                                          │
│ Frontend:     http://localhost:3000     │
│ Backend API:  http://localhost:3001     │
│ Database:     localhost:5432            │
│                                          │
│ ───────────────────────────────────────  │
│ External Access:                         │
│                                          │
│ Frontend:     http://78.184.163.223:3000 │
│ Backend API:  http://78.184.163.223:3001 │
│                                          │
│ ───────────────────────────────────────  │
│ Blockchain:                              │
│                                          │
│ Network:      BSC Testnet (ChainID 97) │
│ RPC:          https://data-seed...     │
│ BSCScan:      https://testnet.bscscan   │
│                                          │
└─────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

After starting services:

- [ ] Frontend loads without errors
- [ ] Backend API responds to requests
- [ ] Database is connected
- [ ] Can create test token
- [ ] Token appears on BSCScan
- [ ] Can approve LiquidityAdder
- [ ] Can call addLiquidityFrom()
- [ ] LP tokens received
- [ ] Trading works on PancakeSwap

---

## 🎓 Learning Path

### Day 1: Setup & Run
1. Read: QUICK-START.md
2. Run: Backend + Frontend
3. Verify: All services running

### Day 2: Token Creation
1. Read: LP-FLOW-DOCUMENTATION.md
2. Create: Test token
3. Verify: Token in platform wallet

### Day 3: Add Liquidity
1. Run: Approval script
2. Call: addLiquidityFrom()
3. Test: Trading on PancakeSwap

### Day 4+: Production
1. Invite: Beta testers
2. Monitor: Logs for issues
3. Gather: User feedback
4. Plan: Next features

---

## 🚀 Ready to Go!

```
✅ Services are running
✅ Documentation is complete
✅ Contracts are deployed
✅ Infrastructure is ready

👉 Next: Read QUICK-START.md and run your first token!
```

---

## 📞 Quick Reference

| Need | File | Command |
|------|------|---------|
| Commands | QUICK-START.md | `npm start` |
| Architecture | ARCHITECTURE.md | - |
| Token Flow | LP-FLOW-DOCUMENTATION.md | - |
| Deployment Status | PRODUCTION-CHECKLIST.md | - |
| All Docs | DOCUMENTATION-INDEX.md | - |

---

**Happy Building! 🎉**

**Need help?** Check the troubleshooting section or read the relevant documentation file.
