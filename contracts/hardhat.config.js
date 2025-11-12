require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config({ path: __dirname + "/.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC;
const BSC_MAINNET_RPC = process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org/";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// Private key kontrolü
if (!PRIVATE_KEY) {
  console.warn("⚠️  PRIVATE_KEY environment variable not set");
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: true,
      evmVersion: "paris"
    }
  },
  
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false,
      gas: 30000000,
      blockGasLimit: 30000000,
      mining: {
        auto: true,
        interval: 0
      }
    },
    
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      allowUnlimitedContractSize: false,
      gas: 30000000,
      timeout: 120000
    },
    
    // Test Networks
    bscTestnet: {
      url: "https://bsc-testnet.publicnode.com",
      chainId: 97,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 6000000,      // Optimize edilmiş gas limit
      gasPrice: 1000000000, // 1 gwei - EN DÜŞÜK
      gasMultiplier: 1.1,
      timeout: 180000,
      allowUnlimitedContractSize: true,
      verify: {
        etherscan: {
          apiKey: BSCSCAN_API_KEY
        }
      },
      confirmations: 2,
      timeoutBlocks: 200
    },
    
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 2000000000, // 2 Gwei
      timeout: 120000
    },
    
    // Main Networks
    bsc: {
      url: BSC_MAINNET_RPC,
      chainId: 56,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 5000000000, // 5 Gwei
      timeout: 120000
    },
    
    ethereum: {
      url: process.env.ETH_MAINNET_RPC || "https://mainnet.infura.io/v3/your-infura-key",
      chainId: 1,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 20000000000, // 20 Gwei
      timeout: 120000
    }
  },
  
  // Etherscan ve block explorer ayarları
  etherscan: {
    apiKey: BSCSCAN_API_KEY,
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com"
        }
      }
    ]
  },
  
  // Gas reporter ayarları
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "BNB",
    gasPrice: 5,
    excludeContracts: [
      "mocks/",
      "test/",
      "ERC721A/",
      "lib/"
    ]
  },
  
  // Contract verification ayarları
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.dev/server",
    browserUrl: "https://repo.sourcify.dev"
  },
  
  // Path configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  // Mocha test ayarları
  mocha: {
    timeout: 40000
  },
  
  // TypeChain ayarları
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  }
};