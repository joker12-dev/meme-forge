// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title MemeToken
 * @dev Basit bir meme token implementasyonu.
 * - LP kilitleme özelliği
 * - Owner sadece LP satabilir
 * - Sabit supply
 * - Burnable token
 */

interface IPancakeRouter {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
}

interface IPancakeFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

contract MemeToken is ERC20, ERC20Burnable {
    // Events
    event LPLocked(uint256 until);
    event LPSold(uint256 amount, uint256 ethReceived);
    event TokensBurned(address indexed from, uint256 amount);
    event AutoBurnToggled(bool enabled);
    event TransferOwnership(address indexed previousOwner, address indexed newOwner);

    address public owner;
    uint256 public immutable launchTime;
    
    bool public lpLocked;
    uint256 public lpLockTime;
    struct TokenConfig {
        uint8 decimals;
        string metadataURI;
        address marketingWallet;
        address liquidityWallet;
        address platformWallet;
        uint256 marketingTax;
        uint256 liquidityTax;
        uint256 platformCommission;
        bool autoBurnEnabled;
        uint256 autoBurnThreshold;
        uint256 minTokensBeforeSwap;
    }
    
    TokenConfig public config;
    address public factory;
    uint256 public totalBurned;
    address public pairAddress;
    bool private initialized;
    bool public swapAndLiquifyEnabled = true;
    bool private swapping;
    
    IPancakeRouter public pancakeRouter;
    address public pancakePair;
    
    mapping(address => bool) public isExcludedFromTax;
    
    uint256 private constant MAX_TAX = 15;
    uint256 private constant PLATFORM_COMMISSION_DENOMINATOR = 10000;
    
    event TokenCreated(string name, string symbol, address creator);
    event TaxesUpdated(uint256 marketingTax, uint256 liquidityTax);
    event AutoBurnExecuted(uint256 amount);
    event MetadataUpdated(string newURI);
    event MarketingWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event LiquidityWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event SwapAndLiquifyEnabledUpdated(bool enabled);
    event TokensSwappedAndLiquified(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiquidity
    );
    
    modifier lockTheSwap {
        swapping = true;
        _;
        swapping = false;
    }
    
    modifier validTaxRate(uint256 tax) {
        require(tax <= MAX_TAX, "Tax rate cannot exceed maximum");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address _pancakeSwapRouter
    ) ERC20(name_, symbol_) {
        require(_pancakeSwapRouter != address(0), "Invalid PancakeSwap router");
        
        owner = msg.sender;
        factory = msg.sender; // Set factory to deployer (will be the TokenFactory contract)
        pancakeRouter = IPancakeRouter(_pancakeSwapRouter);
        launchTime = block.timestamp;
        
        _mint(msg.sender, totalSupply_);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @dev LP'yi belirtilen süre boyunca kilitler
     * @param _lockTime Kilit süresi (saniye)
     */
    function lockLP(uint256 _lockTime) external onlyOwner {
        require(!lpLocked, "LP already locked");
        require(_lockTime > 0, "Lock time must be > 0");
        
        lpLocked = true;
        lpLockTime = block.timestamp + _lockTime;
        
        emit LPLocked(lpLockTime);
    }

    /**
     * @dev LP token satışı yapar (sadece owner)
     * @param lpToken LP token kontrat adresi
     * @param amount Satılacak LP miktarı
     * @param minEthAmount Minimum alınacak ETH miktarı
     */
    function sellLP(
        address lpToken,
        uint256 amount,
        uint256 minEthAmount
    ) external onlyOwner {
        require(lpToken == pancakePair, "Invalid LP token");
        require(!lpLocked || block.timestamp >= lpLockTime, "LP is locked");
        
        IERC20(lpToken).transfer(pancakePair, amount);
        
        // ETH transferi başarılı olduysa event yayınla
        emit LPSold(amount, minEthAmount);
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        uint8 decimals_,
        address owner_,
        string memory metadataURI_,
        address _marketingWallet,
        address _liquidityWallet,
        address _platformWallet,
        uint256 _marketingTax,
        uint256 _liquidityTax,
        bool _autoBurnEnabled,
        address _pancakeRouter
    ) external {
        require(!initialized, "Already initialized");
        require(_marketingTax + _liquidityTax <= MAX_TAX, "Tax too high");
        require(_pancakeRouter != address(0), "Invalid router");
        
        // Set factory on first initialization
        if (factory == address(0)) {
            factory = msg.sender;
        }
        
        require(msg.sender == factory, "Only factory");
        initialized = true;

        // Set router for this clone
        pancakeRouter = IPancakeRouter(_pancakeRouter);

        owner = owner_;
        emit TransferOwnership(address(0), owner_);

        config = TokenConfig({
            decimals: decimals_,
            metadataURI: metadataURI_,
            marketingWallet: _marketingWallet,
            liquidityWallet: _liquidityWallet,
            platformWallet: _platformWallet,
            marketingTax: _marketingTax,
            liquidityTax: _liquidityTax,
            platformCommission: 200, // %2'ye düşürüldü (gas tasarrufu)
            autoBurnEnabled: _autoBurnEnabled,
            autoBurnThreshold: 5000 * 10**decimals_, // Threshold yükseltildi
            minTokensBeforeSwap: 500 * 10**decimals_ // Swap threshold yükseltildi
        });

        // Create PancakeSwap pair
        pancakePair = IPancakeFactory(pancakeRouter.factory())
            .createPair(address(this), pancakeRouter.WETH());
        pairAddress = pancakePair;

        // Exclude addresses from fee
        isExcludedFromTax[factory] = true;
        isExcludedFromTax[owner_] = true;
        isExcludedFromTax[address(this)] = true;
        isExcludedFromTax[_platformWallet] = true;
        isExcludedFromTax[_marketingWallet] = true;
        isExcludedFromTax[pancakePair] = true;
        isExcludedFromTax[address(pancakeRouter)] = true;
        if (_liquidityWallet != address(0)) {
            isExcludedFromTax[_liquidityWallet] = true;
        }

    // Mint tokens AFTER everything is configured
    // By default mint to the platform wallet so the platform holds initial supply.
    // If platform wallet is not set, fallback to the owner (creator).
    address mintRecipient = config.platformWallet != address(0) ? config.platformWallet : owner_;
    _mint(mintRecipient, initialSupply * 10**decimals_);
    
    // IMPORTANT: Grant approval to factory for platform wallet tokens
    // This allows the platform wallet to add liquidity via LiquidityAdder contract
    if (config.platformWallet != address(0)) {
        approve(factory, type(uint256).max);
    }
        
        emit TokenCreated(name_, symbol_, owner_);
    }
    
    /**
     * @dev Approve liquidity adder to transfer tokens from platform wallet
     * This is called by TokenFactory after token creation
     */
    function approveLiquidityAdder(address liquidityAdder) external {
        require(msg.sender == factory, "Only factory");
        require(liquidityAdder != address(0), "Invalid liquidityAdder");
        if (config.platformWallet != address(0)) {
            _approve(config.platformWallet, liquidityAdder, type(uint256).max);
        }
    }

    function decimals() public view override returns (uint8) {
        return config.decimals;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "Transfer from zero");
        require(to != address(0), "Transfer to zero");
        require(amount > 0, "Transfer amount zero");
        
        uint256 contractTokenBalance = balanceOf(address(this));
        bool overMinTokenBalance = contractTokenBalance >= config.minTokensBeforeSwap;
        
        if (
            overMinTokenBalance &&
            !swapping &&
            swapAndLiquifyEnabled &&
            from != pancakePair &&
            config.liquidityTax > 0
        ) {
            swapAndLiquify(contractTokenBalance);
        }
        
        bool takeTax = !swapping;
        
        if (isExcludedFromTax[from] || isExcludedFromTax[to]) {
            takeTax = false;
        }
        
        if (takeTax) {
            uint256 totalTax = config.marketingTax + config.liquidityTax;
            uint256 taxAmount = (amount * totalTax) / 100;
            uint256 netAmount = amount - taxAmount;
            
            super._transfer(from, address(this), taxAmount);
            super._transfer(from, to, netAmount);
            
            if (config.autoBurnEnabled) {
                tryAutoBurn();
            }
        } else {
            super._transfer(from, to, amount);
        }
    }

    function swapAndLiquify(uint256 contractTokenBalance) private lockTheSwap {
        uint256 totalTax = config.marketingTax + config.liquidityTax;
        if (totalTax == 0) return;
        
        // Calculate platform fee
        uint256 platformFee = (contractTokenBalance * config.platformCommission) / PLATFORM_COMMISSION_DENOMINATOR;
        uint256 remainingBalance = contractTokenBalance - platformFee;
        
        // Send platform fee
        if (platformFee > 0 && config.platformWallet != address(0)) {
            super._transfer(address(this), config.platformWallet, platformFee);
        }
        
        // Calculate distribution
        uint256 marketingShare = (remainingBalance * config.marketingTax) / totalTax;
        uint256 liquidityShare = remainingBalance - marketingShare;
        
        // Handle marketing tokens
        if (marketingShare > 0 && config.marketingWallet != address(0)) {
            swapTokensForEth(marketingShare);
            (bool success, ) = payable(config.marketingWallet).call{value: address(this).balance}("");
            require(success, "Marketing transfer failed");
        }
        
        // Handle liquidity tokens
        if (liquidityShare > 0) {
            // Split liquidity tokens
            uint256 half = liquidityShare / 2;
            uint256 otherHalf = liquidityShare - half;
            
            // Swap half for ETH
            uint256 initialBalance = address(this).balance;
            swapTokensForEth(half);
            uint256 ethBalance = address(this).balance - initialBalance;
            
            // Add liquidity
            if (otherHalf > 0 && ethBalance > 0) {
                addLiquidity(otherHalf, ethBalance);
            }
        }
        
        emit TokensSwappedAndLiquified(
            contractTokenBalance,
            address(this).balance,
            liquidityShare
        );
    }

    function swapTokensForEth(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = pancakeRouter.WETH();
        
        _approve(address(this), address(pancakeRouter), tokenAmount);
        
        try pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        ) {} catch {
            // Handle failed swap
            revert("Swap failed");
        }
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        _approve(address(this), address(pancakeRouter), tokenAmount);
        
        try pancakeRouter.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0,
            0,
            config.liquidityWallet == address(0) ? owner : config.liquidityWallet,
            block.timestamp
        ) {} catch {
            // Handle failed liquidity addition
            revert("Add liquidity failed");
        }
    }

    function tryAutoBurn() internal {
        if (balanceOf(address(this)) >= config.autoBurnThreshold) {
            uint256 burnAmount = balanceOf(address(this));
            _burn(address(this), burnAmount);
            totalBurned += burnAmount;
            emit AutoBurnExecuted(burnAmount);
            emit TokensBurned(address(this), burnAmount);
        }
    }

    function setTaxes(uint256 _marketingTax, uint256 _liquidityTax) 
        external 
        onlyOwner 
        validTaxRate(_marketingTax + _liquidityTax) 
    {
        config.marketingTax = _marketingTax;
        config.liquidityTax = _liquidityTax;
        emit TaxesUpdated(_marketingTax, _liquidityTax);
    }

    function updateMetadata(string memory newURI) external onlyOwner {
        config.metadataURI = newURI;
        emit MetadataUpdated(newURI);
    }

    function setMarketingWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet");
        address oldWallet = config.marketingWallet;
        config.marketingWallet = newWallet;
        isExcludedFromTax[oldWallet] = false;
        isExcludedFromTax[newWallet] = true;
        emit MarketingWalletUpdated(oldWallet, newWallet);
    }

    function setLiquidityWallet(address newWallet) external onlyOwner {
        address oldWallet = config.liquidityWallet;
        config.liquidityWallet = newWallet;
        if (oldWallet != address(0)) {
            isExcludedFromTax[oldWallet] = false;
        }
        if (newWallet != address(0)) {
            isExcludedFromTax[newWallet] = true;
        }
        emit LiquidityWalletUpdated(oldWallet, newWallet);
    }

    function setSwapAndLiquifyEnabled(bool enabled) external onlyOwner {
        swapAndLiquifyEnabled = enabled;
        emit SwapAndLiquifyEnabledUpdated(enabled);
    }

    function setAutoBurnEnabled(bool enabled) external onlyOwner {
        config.autoBurnEnabled = enabled;
        emit AutoBurnToggled(enabled);
    }

    function setAutoBurnThreshold(uint256 threshold) external onlyOwner {
        config.autoBurnThreshold = threshold;
    }

    function setMinTokensBeforeSwap(uint256 amount) external onlyOwner {
        config.minTokensBeforeSwap = amount;
    }

    function excludeFromTax(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
    }

    function burn(uint256 amount) public virtual override {
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit TokensBurned(msg.sender, amount);
    }

    // View functions from interface
    function metadataURI() external view returns (string memory) {
        return config.metadataURI;
    }

    function marketingWallet() external view returns (address) {
        return config.marketingWallet;
    }

    function liquidityWallet() external view returns (address) {
        return config.liquidityWallet;
    }

    function platformWallet() external view returns (address) {
        return config.platformWallet;
    }

    function marketingTax() external view returns (uint256) {
        return config.marketingTax;
    }

    function liquidityTax() external view returns (uint256) {
        return config.liquidityTax;
    }

    function autoBurnEnabled() external view returns (bool) {
        return config.autoBurnEnabled;
    }

    function isExcludedFromFees(address account) external view returns (bool) {
        return isExcludedFromTax[account];
    }

    // Emergency functions
    function withdrawStuckTokens(address token) external onlyOwner {
        require(token != address(this), "Cannot withdraw native token");
        if (token == address(0)) {
            payable(owner).transfer(address(this).balance);
        } else {
            IERC20 tokenContract = IERC20(token);
            uint256 balance = tokenContract.balanceOf(address(this));
            if (balance > 0) {
                tokenContract.transfer(owner, balance);
            }
        }
    }

    receive() external payable {}
}