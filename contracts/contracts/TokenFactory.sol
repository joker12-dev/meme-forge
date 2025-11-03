// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IMemeToken.sol";
import "./LiquidityLockManager.sol";

contract TokenFactory {
    LiquidityLockManager public liquidityLockManager;
    address public owner;
    address public memeTokenTemplate;
    address public pancakeRouter;
    address public liquidityAdder; // LiquidityAdder contract address for token approval
    
    struct FeeConfig {
        uint256 basicFee;
        uint256 standardFee;
        uint256 premiumFee;
        address platformWallet;
        address developmentWallet;
        address marketingWallet;
        address platformCommissionWallet;
    }

    struct TierConfig {
        uint256 fee;
        uint256 defaultMarketingTax;
        uint256 defaultLiquidityTax;
        bool defaultAutoBurn;
        uint256 maxTotalTax;
    }

    struct FeeDistribution {
        uint256 platformShare;    // Default: 70
        uint256 developmentShare; // Default: 20
        uint256 marketingShare;   // Default: 10
    }
    
    FeeConfig public fees;
    FeeDistribution public feeDistribution;
    mapping(string => TierConfig) public tierConfigs;
    
    address[] public allTokens;
    mapping(address => address[]) public userTokens;
    mapping(address => string) public tokenTiers;

    // Constants
    uint256 private constant PERCENTAGE_DENOMINATOR = 100;
    uint256 public constant MAX_TOTAL_TAX = 15;

    // State variables for pausing
    bool public paused;

    event TokenCreated(
        address indexed tokenAddress, 
        address indexed creator, 
        string tier,
        uint256 initialSupply,
        uint256 marketingTax,
        uint256 liquidityTax,
        bool autoBurn
    );
    event FeesDistributed(uint256 platform, uint256 development, uint256 marketing);
    event TierConfigUpdated(string tier, uint256 fee, uint256 marketingTax, uint256 liquidityTax);
    event FeeDistributionUpdated(uint256 platformShare, uint256 developmentShare, uint256 marketingShare);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(
        address _platformWallet,
        address _developmentWallet,
        address _marketingWallet, 
        address _platformCommissionWallet,
        address _pancakeRouter
    ) {
        require(_pancakeRouter != address(0), "Invalid router");
        owner = msg.sender;
        pancakeRouter = _pancakeRouter;
        liquidityLockManager = new LiquidityLockManager();
        fees = FeeConfig({
            basicFee: 0.0001 ether,     // TESTNET - çok düşük fee
            standardFee: 0.0001 ether,  // TESTNET - çok düşük fee
            premiumFee: 0.0001 ether,   // TESTNET - çok düşük fee
            platformWallet: _platformWallet,
            developmentWallet: _developmentWallet,
            marketingWallet: _marketingWallet,
            platformCommissionWallet: _platformCommissionWallet
        });

        // Default fee distribution
        feeDistribution = FeeDistribution({
            platformShare: 70,
            developmentShare: 20,
            marketingShare: 10
        });

        // Initialize tier configs - DÜŞÜK GAS ÜCRETLERİ
        tierConfigs["basic"] = TierConfig({
            fee: 0.0001 ether,          // TESTNET - çok düşük fee
            defaultMarketingTax: 0,
            defaultLiquidityTax: 0,
            defaultAutoBurn: false,
            maxTotalTax: 10
        });

        tierConfigs["standard"] = TierConfig({
            fee: 0.0001 ether,          // TESTNET - çok düşük fee
            defaultMarketingTax: 2,     // Tax'ları da düşürdük
            defaultLiquidityTax: 1,
            defaultAutoBurn: false,
            maxTotalTax: 12
        });

        tierConfigs["premium"] = TierConfig({
            fee: 0.0001 ether,          // TESTNET - çok düşük fee
            defaultMarketingTax: 3,     // Tax'ları da düşürdük
            defaultLiquidityTax: 2,
            defaultAutoBurn: false,     // AutoBurn false yapıldı (gas tasarrufu)
            maxTotalTax: 15
        });
    }

    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals,
        string memory metadataURI,
        string memory tier,
        uint256 customMarketingTax,
        uint256 customLiquidityTax,
        bool customAutoBurn
    ) external payable whenNotPaused returns (address) {
        // Validate inputs
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Invalid name length");
        require(bytes(symbol).length >= 3 && bytes(symbol).length <= 10, "Invalid symbol length");
        require(initialSupply > 0 && initialSupply <= type(uint256).max / (10**decimals), "Invalid supply");
        require(decimals <= 18, "Max 18 decimals");
        
        // Get tier config and validate fee
        TierConfig memory tierConfig = tierConfigs[tier];
        require(tierConfig.fee > 0, "Invalid tier");
        require(msg.value >= tierConfig.fee, "Insufficient fee");
        
        // Validate taxes
        uint256 marketingTax = customMarketingTax > 0 ? customMarketingTax : tierConfig.defaultMarketingTax;
        uint256 liquidityTax = customLiquidityTax > 0 ? customLiquidityTax : tierConfig.defaultLiquidityTax;
        require(marketingTax + liquidityTax <= tierConfig.maxTotalTax, "Tax too high");

        require(memeTokenTemplate != address(0), "Template not set");

        bool autoBurn = customAutoBurn || tierConfig.defaultAutoBurn;
        
        address tokenAddress = createClone(memeTokenTemplate);
        IMemeToken token = IMemeToken(tokenAddress);
        
        token.initialize(
            name,
            symbol,
            initialSupply,
            decimals,
            msg.sender,
            metadataURI,
            fees.marketingWallet,
            address(0), // Liquidity wallet
            fees.platformCommissionWallet,
            marketingTax,
            liquidityTax,
            autoBurn,
            pancakeRouter
        );
        
        // Approve LiquidityAdder after token creation
        if (liquidityAdder != address(0)) {
            token.approveLiquidityAdder(liquidityAdder);
        }

        allTokens.push(tokenAddress);
        userTokens[msg.sender].push(tokenAddress);
        tokenTiers[tokenAddress] = tier;

        distributeFees(tierConfig.fee);
        
        if (msg.value > tierConfig.fee) {
            payable(msg.sender).transfer(msg.value - tierConfig.fee);
        }

        emit TokenCreated(
            tokenAddress, 
            msg.sender, 
            tier,
            initialSupply,
            marketingTax,
            liquidityTax,
            autoBurn
        );
        
        return tokenAddress;
    }

    function getTierFee(string memory tier) public view returns (uint256) {
        if (compareStrings(tier, "basic")) return fees.basicFee;
        if (compareStrings(tier, "standard")) return fees.standardFee;
        if (compareStrings(tier, "premium")) return fees.premiumFee;
        revert("Invalid tier");
    }

    function getTierSettings(
        string memory tier, 
        uint256 customMarketingTax, 
        uint256 customLiquidityTax,
        bool customAutoBurn
    ) public pure returns (uint256 marketingTax, uint256 liquidityTax, bool autoBurn) {
        if (compareStrings(tier, "basic")) return (customMarketingTax, customLiquidityTax, customAutoBurn);
        if (compareStrings(tier, "standard")) return (customMarketingTax > 0 ? customMarketingTax : 3, customLiquidityTax > 0 ? customLiquidityTax : 2, customAutoBurn);
        if (compareStrings(tier, "premium")) return (customMarketingTax > 0 ? customMarketingTax : 5, customLiquidityTax > 0 ? customLiquidityTax : 3, customAutoBurn || true);
        revert("Invalid tier");
    }

    function distributeFees(uint256 amount) internal {
        require(
            feeDistribution.platformShare + feeDistribution.developmentShare + feeDistribution.marketingShare == PERCENTAGE_DENOMINATOR,
            "Invalid fee distribution"
        );
        
        uint256 platform = (amount * feeDistribution.platformShare) / PERCENTAGE_DENOMINATOR;
        uint256 development = (amount * feeDistribution.developmentShare) / PERCENTAGE_DENOMINATOR;
        uint256 marketing = amount - platform - development;
        
        payable(fees.platformWallet).transfer(platform);
        payable(fees.developmentWallet).transfer(development);
        payable(fees.marketingWallet).transfer(marketing);
        
        emit FeesDistributed(platform, development, marketing);
    }

    function createClone(address target) internal returns (address result) {
        bytes20 targetBytes = bytes20(target);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
        }
    }

    // Admin functions
    function setMemeTokenTemplate(address _template) external onlyOwner {
        require(_template != address(0), "Invalid template address");
        memeTokenTemplate = _template;
    }

    function setLiquidityAdder(address _liquidityAdder) external onlyOwner {
        require(_liquidityAdder != address(0), "Invalid liquidity adder address");
        liquidityAdder = _liquidityAdder;
    }

    function updateTierConfig(
        string memory tier,
        uint256 fee,
        uint256 marketingTax,
        uint256 liquidityTax,
        bool autoBurn,
        uint256 maxTotalTax
    ) external onlyOwner {
        require(maxTotalTax <= MAX_TOTAL_TAX, "Max tax too high");
        require(marketingTax + liquidityTax <= maxTotalTax, "Default taxes too high");
        
        tierConfigs[tier] = TierConfig({
            fee: fee,
            defaultMarketingTax: marketingTax,
            defaultLiquidityTax: liquidityTax,
            defaultAutoBurn: autoBurn,
            maxTotalTax: maxTotalTax
        });

        emit TierConfigUpdated(tier, fee, marketingTax, liquidityTax);
    }

    function updateFeeDistribution(
        uint256 _platformShare,
        uint256 _developmentShare,
        uint256 _marketingShare
    ) external onlyOwner {
        require(
            _platformShare + _developmentShare + _marketingShare == PERCENTAGE_DENOMINATOR,
            "Must total 100%"
        );

        feeDistribution = FeeDistribution({
            platformShare: _platformShare,
            developmentShare: _developmentShare,
            marketingShare: _marketingShare
        });

        emit FeeDistributionUpdated(_platformShare, _developmentShare, _marketingShare);
    }

    function updateFeeWallets(
        address _platformWallet,
        address _developmentWallet,
        address _marketingWallet,
        address _platformCommissionWallet
    ) external onlyOwner {
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_developmentWallet != address(0), "Invalid development wallet");
        require(_marketingWallet != address(0), "Invalid marketing wallet");
        require(_platformCommissionWallet != address(0), "Invalid commission wallet");

        fees.platformWallet = _platformWallet;
        fees.developmentWallet = _developmentWallet;
        fees.marketingWallet = _marketingWallet;
        fees.platformCommissionWallet = _platformCommissionWallet;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    // String helper functions
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
    }

    // View functions
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }

    function getTierConfig(string memory tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }

    function getTokenTier(address token) external view returns (string memory tier, TierConfig memory config) {
        tier = tokenTiers[token];
        config = tierConfigs[tier];
    }

    // Emergency functions
    function getLiquidityLockManager() external view returns (address) {
        return address(liquidityLockManager);
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        if (balance > 0) {
            tokenContract.transfer(owner, balance);
        }
    }

    receive() external payable {
        // Accept BNB transfers
    }
}