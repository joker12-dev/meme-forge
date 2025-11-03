# Multi-Wallet Integration Guide

This project supports multiple cryptocurrency wallets including MetaMask, Trust Wallet, Binance Wallet, OKX Wallet, SafePal, and TokenPocket.

## 🔌 Supported Wallets

- **MetaMask** - Browser extension and mobile
- **Trust Wallet** - Mobile wallet
- **Binance Wallet** - Binance Chain Wallet
- **OKX Wallet** - OKX Web3 Wallet
- **SafePal** - Hardware and software wallet
- **TokenPocket** - Multi-chain wallet
- **WalletConnect** - Protocol for mobile wallets (coming soon)

## 📦 Installation

All wallet integration utilities are already included in the project:

```bash
cd frontend
npm install
```

## 🚀 Usage

### 1. Using the Wallet Context (Recommended)

The easiest way to interact with wallets throughout your app:

```jsx
import { useWallet } from '../contexts/WalletContext';

function MyComponent() {
  const { 
    account, 
    balance, 
    network, 
    isConnected, 
    connect, 
    disconnect 
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connect('metamask'); // or 'trustwallet', 'binance', etc.
      console.log('Connected:', account);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {account}</p>
          <p>Balance: {balance} BNB</p>
          <p>Network: {network?.name}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### 2. Using the useWalletOperations Hook

For advanced wallet operations like token approvals, contract calls, etc:

```jsx
import { useWalletOperations } from '../hooks/useWalletOperations';

function TokenSwap() {
  const {
    account,
    balance,
    callContract,
    approveToken,
    getTokenBalance,
    isLoading,
    error
  } = useWalletOperations();

  const handleApprove = async () => {
    try {
      const receipt = await approveToken(
        '0xTokenAddress',
        '0xSpenderAddress',
        '1000' // amount
      );
      console.log('Approved:', receipt);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleSwap = async () => {
    try {
      const receipt = await callContract(
        '0xRouterAddress',
        routerABI,
        'swapExactTokensForTokens',
        [amountIn, amountOutMin, path, to, deadline],
        null // no BNB value
      );
      console.log('Swap successful:', receipt);
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleApprove} disabled={isLoading}>
        Approve Token
      </button>
      <button onClick={handleSwap} disabled={isLoading}>
        Swap Tokens
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### 3. Direct Provider Access

For low-level operations:

```jsx
import { 
  getProviderByWallet, 
  getSigner, 
  callContractFunction 
} from '../utils/walletProviders';

async function createToken() {
  // Get the active wallet provider
  const walletType = localStorage.getItem('walletType') || 'metamask';
  const provider = getProviderByWallet(walletType);
  
  // Get signer for transactions
  const signer = await getSigner(provider);
  
  // Send transaction
  const tx = await signer.sendTransaction({
    to: '0xRecipient',
    value: ethers.parseEther('0.01')
  });
  
  const receipt = await tx.wait();
  console.log('Transaction confirmed:', receipt);
}
```

## 🎯 Token Creation Example

```jsx
import { useWalletOperations } from '../hooks/useWalletOperations';

function CreateToken() {
  const { callContract, isLoading } = useWalletOperations();

  const handleCreateToken = async () => {
    try {
      const factoryAddress = process.env.REACT_APP_FACTORY_ADDRESS;
      const factoryABI = [...]; // Your factory ABI
      
      const receipt = await callContract(
        factoryAddress,
        factoryABI,
        'createToken',
        [
          'MyToken',      // name
          'MTK',          // symbol
          18,             // decimals
          1000000         // initial supply
        ],
        '0.01' // Creation fee in BNB
      );
      
      console.log('Token created:', receipt);
    } catch (error) {
      console.error('Token creation failed:', error);
    }
  };

  return (
    <button onClick={handleCreateToken} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Token'}
    </button>
  );
}
```

## 🔄 Swap/Trading Example

```jsx
import { useWalletOperations } from '../hooks/useWalletOperations';

function TokenSwap() {
  const {
    approveToken,
    callContract,
    getTokenBalance,
    checkAllowance
  } = useWalletOperations();

  const handleSwap = async (tokenIn, tokenOut, amountIn) => {
    const routerAddress = process.env.REACT_APP_PANCAKE_ROUTER_ADDRESS;
    
    // 1. Check if approval is needed
    const allowance = await checkAllowance(
      tokenIn,
      account,
      routerAddress
    );
    
    if (parseFloat(allowance) < parseFloat(amountIn)) {
      // 2. Approve token
      await approveToken(tokenIn, routerAddress, amountIn);
    }
    
    // 3. Execute swap
    const path = [tokenIn, tokenOut];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    const receipt = await callContract(
      routerAddress,
      routerABI,
      'swapExactTokensForTokens',
      [
        ethers.parseEther(amountIn),
        0, // amountOutMin (set slippage)
        path,
        account,
        deadline
      ]
    );
    
    console.log('Swap completed:', receipt);
  };

  return (
    <button onClick={() => handleSwap(tokenA, tokenB, '10')}>
      Swap 10 Tokens
    </button>
  );
}
```

## 🔐 Network Management

```jsx
import { switchOrAddBSCTestnet } from '../utils/walletProviders';

async function ensureCorrectNetwork() {
  const walletType = localStorage.getItem('walletType');
  const provider = getProviderByWallet(walletType);
  
  await switchOrAddBSCTestnet(provider);
}
```

## 📱 Wallet Detection

```jsx
import { isWalletInstalled, WALLET_METADATA } from '../utils/walletProviders';

function WalletSelector() {
  const wallets = ['metamask', 'trustwallet', 'binance', 'okx'];
  
  return (
    <div>
      {wallets.map(walletId => {
        const isInstalled = isWalletInstalled(walletId);
        const metadata = WALLET_METADATA[walletId];
        
        return (
          <div key={walletId}>
            <img src={metadata.icon} alt={metadata.name} />
            <p>{metadata.name}</p>
            {!isInstalled && (
              <a href={metadata.downloadUrl}>Install</a>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

## 🎨 Wallet Connect Modal

The project includes a pre-built wallet connection modal:

```jsx
import WalletConnect from './components/WalletConnect';

function App() {
  const [showModal, setShowModal] = useState(false);
  
  const handleConnect = async (address, walletType, provider) => {
    console.log('Connected:', address, walletType);
    // Store connection info
    setShowModal(false);
  };
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Connect Wallet
      </button>
      
      {showModal && (
        <WalletConnect
          onConnect={handleConnect}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

## ⚡ Best Practices

1. **Always check wallet installation** before connecting
2. **Store wallet type** in localStorage for reconnection
3. **Handle errors gracefully** with user-friendly messages
4. **Check network** before transactions (BSC Testnet = chainId 97)
5. **Request approval** before token swaps
6. **Set proper gas limits** for complex transactions
7. **Show loading states** during transactions
8. **Confirm transactions** with receipt

## 🐛 Common Issues

### Wallet Not Detected
```jsx
if (!isWalletInstalled('metamask')) {
  alert('Please install MetaMask');
  window.open('https://metamask.io/download/', '_blank');
}
```

### Wrong Network
```jsx
const network = await getCurrentNetwork(provider);
if (!network.isBSC) {
  await switchOrAddBSCTestnet(provider);
}
```

### Transaction Failed
```jsx
try {
  const receipt = await callContract(...);
} catch (error) {
  if (error.code === 4001) {
    console.log('User rejected transaction');
  } else {
    console.error('Transaction failed:', error.message);
  }
}
```

## 📚 API Reference

### walletProviders.js
- `detectWalletProvider()` - Detect all available wallet providers
- `getProviderByWallet(walletId)` - Get provider for specific wallet
- `isWalletInstalled(walletId)` - Check if wallet is installed
- `connectToWallet(walletId)` - Connect to specific wallet
- `switchOrAddBSCTestnet(provider)` - Switch to BSC Testnet
- `getWalletBalance(provider, address)` - Get BNB balance
- `getTokenBalance(provider, tokenAddress, walletAddress)` - Get token balance
- `callContractFunction(provider, address, abi, function, params, value)` - Call contract

### WalletContext
- `account` - Connected wallet address
- `balance` - BNB balance
- `network` - Current network info
- `isConnected` - Connection status
- `connect(walletId)` - Connect wallet
- `disconnect()` - Disconnect wallet
- `refreshBalance()` - Update balance

### useWalletOperations Hook
- `getSigner()` - Get ethers signer
- `sendTransaction(tx)` - Send transaction
- `callContract(address, abi, func, params, value)` - Call contract method
- `readContract(address, abi, func, params)` - Read contract data
- `approveToken(token, spender, amount)` - Approve token spending
- `checkAllowance(token, owner, spender)` - Check token allowance
- `getTokenBalance(tokenAddress)` - Get token balance

## 🔗 Resources

- [MetaMask Docs](https://docs.metamask.io/)
- [Trust Wallet](https://trustwallet.com/)
- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- [Ethers.js Docs](https://docs.ethers.org/)

## 💡 Tips

- Test on BSC Testnet first before mainnet
- Get test BNB from faucet for testing
- Use proper error handling
- Show transaction status to users
- Implement transaction history
- Add gas estimation before transactions

---

Built with ❤️ for seamless multi-wallet support
