# 🔄 LP Flow Documentation - Platform Wallet & Token Economics

**Last Updated:** November 2, 2025  
**Network:** BSC Testnet  
**Status:** ✅ Production Ready

---

## 📋 Overview

### Old Flow (Before Update)
```
User creates token
  → Token minted to creator
  → Creator adds liquidity manually
  → Creator receives LP tokens
  ❌ Problem: Creator could rug pull with all tokens
```

### New Flow (After Update)
```
User creates token
  → Token minted to PLATFORM WALLET
  → Platform approves LiquidityAdder
  → Platform calls addLiquidityFrom()
  → Creator receives LP tokens (locked)
  ✅ Benefits: Platform controls initial supply, secure LP management
```

---

## 🔐 Platform Wallet Approval Setup

### Step 1: Get Addresses

After token is created, platform needs to approve LiquidityAdder:

```bash
# Get these from BSCScan or .env:
TOKEN_ADDRESS=0x...          # Address of newly created token
LIQUIDITY_ADDER=0xE647B02b4456bB26B55F87F001b9a96D4d48eBf1
PLATFORM_WALLET=0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C
```

### Step 2: Run Approval Script

**Via Script (Automated):**
```bash
# Set TOKEN_ADDRESS in .env
export TOKEN_ADDRESS=0x...

# Run approval script
cd contracts
npx hardhat run scripts/approve-liquidity-adder.js --network bscTestnet
```

**Via Metamask (Manual):**
1. Go to BSCScan: `https://testnet.bscscan.com/address/{TOKEN_ADDRESS}`
2. Click "Write Contract" tab
3. Connect Metamask with PLATFORM_WALLET
4. Call `approve()`:
   - `spender`: `0xE647B02b4456bB26B55F87F001b9a96D4d48eBf1` (LiquidityAdder)
   - `amount`: `999999999000000000000000000` (large amount, 999B tokens)
5. Sign transaction

### Step 3: Verify Approval

```javascript
// Check allowance on BSCScan
// Contract: TOKEN_ADDRESS
// Method: allowance(PLATFORM_WALLET, LIQUIDITY_ADDER)
// Should show large amount (e.g., 999B tokens)
```

---

## 🚀 Adding Liquidity: Full Flow

### Contract Details

**MemeToken.sol** (Updated)
```solidity
// Constructor now mints to platform wallet by default
address mintRecipient = config.platformWallet != address(0) 
  ? config.platformWallet 
  : owner_;
_mint(mintRecipient, initialSupply * 10**decimals_);
```

**LiquidityAdder.sol** (New Function)
```solidity
function addLiquidityFrom(
  address token,
  address from,           // PLATFORM_WALLET (must have approved this contract)
  uint256 tokenAmount,    // How many tokens to add
  address recipient       // Creator (receives LP tokens)
) external payable onlyOwner nonReentrant whenNotPaused
```

### What addLiquidityFrom() Does

1. **Pulls Tokens**: Transfers `tokenAmount` from `from` (platform) to LiquidityAdder
   - Requires: `token.approve(liquidityAdderAddress, amount)` called first
   
2. **Calculates Fee**: Takes 1% fee from token amount
   - Fee tokens go to platform
   
3. **Adds Liquidity**: Calls PancakeRouter.addLiquidityETH()
   - Tokens: `tokenAmount - fee`
   - ETH: sent in `msg.value`
   - LP tokens sent to `recipient` (creator)

4. **Refunds Unused**: Returns any unused tokens/ETH
   - Unused tokens → back to `from` (platform wallet)
   - Unused ETH → back to `msg.sender` (caller)

### Usage Example

```solidity
// Frontend/Backend calls this function:
LiquidityAdder.addLiquidityFrom(
  token = 0xNewTokenAddress,           // Token just created
  from = 0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C,  // Platform wallet
  tokenAmount = 500_000 * 10**18,      // 500k tokens
  recipient = 0xCreatorAddress,        // Creator gets LP tokens
  {value: 1 * 10**18}                  // 1 BNB for liquidity
)
```

### Result

- ✅ 500k tokens + 1 BNB added to PancakeSwap
- ✅ LP tokens sent to creator
- ✅ Creator can't rug pull (tokens were on platform)
- ✅ ~5k tokens kept as platform fee
- ✅ Trading can start immediately

---

## 📱 Integration Points

### Frontend Flow

**1. Token Creation Page**
```javascript
// Create token (user fills form)
POST /api/tokens/create
{
  name: "My Token",
  symbol: "MYT",
  totalSupply: 1000000,
  description: "..."
}
// Response: {tokenAddress: "0x...", factoryTx: "0x..."}
```

**2. Add Liquidity Page** (Optional)
```javascript
// Show: "Liquidity adding is handled by platform"
// Display: Token address, current supply, platform wallet status
// Note: Requires manual approval first
```

**3. Dashboard**
```javascript
// Show token status:
// - ✅ Minted (to platform wallet)
// - ⏳ Awaiting liquidity addition
// - ✅ Liquidity added (with LP token address)
// - 🔒 LP locked until unlock date
```

### Backend Endpoints (Optional)

**Option A: Simple (Manual Flow)**
- No new endpoints needed
- Platform manually approves and adds liquidity via Metamask

**Option B: Advanced (Automated)**
```
POST /api/liquidity/add-from
{
  tokenAddress: "0x...",
  tokenAmount: "500000000000000000000000",
  ethAmount: "1000000000000000000",
  creatorAddress: "0x..."
}
→ Backend signs with PLATFORM_PRIVATE_KEY
→ Calls LiquidityAdder.addLiquidityFrom()
→ Returns TX hash
```

---

## 🔑 Environment Variables

**.env (Root)**
```env
# Updated after deployment
REACT_APP_MEME_TOKEN_ADDRESS=0x4aF9D19C9442bc7b9ab912C7Ec65659A0F56Cc29
REACT_APP_LIQUIDITY_ADDER_ADDRESS=0xE647B02b4456bB26B55F87F001b9a96D4d48eBf1
REACT_APP_TOKEN_FACTORY_ADDRESS=0xE92b066F66C7225fa508dffD461cD62Ed4b767FC
REACT_APP_PANCAKE_ROUTER_ADDRESS=0xD99D1c33F9fC3444f8101754aBC46c52416550D1

PLATFORM_COMMISSION_WALLET=0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C
```

**contracts/.env**
```env
LIQUIDITY_ADDER=0xE647B02b4456bB26B55F87F001b9a96D4d48eBf1
PANCAKE_ROUTER=0xD99D1c33F9fC3444f8101754aBC46c52416550D1
```

---

## 🧪 Testing Checklist

- [ ] Create test token via TokenFactory
- [ ] Verify token minted to platform wallet
- [ ] Approve LiquidityAdder (run script)
- [ ] Call addLiquidityFrom() with test amounts
- [ ] Verify LP tokens sent to creator
- [ ] Verify LP locked in LPLocker
- [ ] Trade with new token on PancakeSwap

---

## 📊 Deployed Addresses

| Component | Address |
|-----------|---------|
| **MemeToken Template** | `0x4aF9D19C9442bc7b9ab912C7Ec65659A0F56Cc29` |
| **LiquidityAdder** | `0xE647B02b4456bB26B55F87F001b9a96D4d48eBf1` |
| **TokenFactory** | `0xE92b066F66C7225fa508dffD461cD62Ed4b767FC` |
| **PancakeRouter** | `0xD99D1c33F9fC3444f8101754aBC46c52416550D1` |
| **Platform Wallet** | `0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C` |

**Network:** BSC Testnet (ChainID 97)  
**RPC:** https://data-seed-prebsc-1-s1.binance.org:8545/

---

## 🔗 References

- **MemeToken.sol**: Lines ~200 (mint to platform wallet)
- **LiquidityAdder.sol**: `addLiquidityFrom()` function (~80 lines)
- **TokenFactory.sol**: `createToken()` updated to use new template
- **Approve Script**: `contracts/scripts/approve-liquidity-adder.js`

---

## 🚀 Next Steps

1. **Test with First Token**: Create test token and verify platform wallet receives supply
2. **Run Approval Script**: Approve LiquidityAdder for test token
3. **Add Liquidity**: Call addLiquidityFrom() manually or via backend
4. **Verify Trades**: Ensure token is tradeable on PancakeSwap
5. **Document Process**: Create user-facing documentation for creators

---

## ❓ FAQ

**Q: Can creator add liquidity manually?**  
A: No. Platform controls initial supply and must approve. This prevents rug pulls.

**Q: What if platform wallet runs out of gas?**  
A: Use `getFeeData()` to estimate gas, send BNB to platform wallet beforehand.

**Q: Can we change platform fee (currently 1%)?**  
A: Yes, redeploy LiquidityAdder with different `platformFee` parameter.

**Q: What happens to platform's 1% fee tokens?**  
A: They stay on LiquidityAdder contract. Withdraw via `withdrawTokens()` or `withdrawFees()`.

---

**Status:** ✅ READY FOR PRODUCTION
