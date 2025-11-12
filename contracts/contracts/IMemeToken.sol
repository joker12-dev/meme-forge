// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMemeToken is IERC20 {
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
    ) external;
    
    function approveLiquidityAdder(address platformWallet, address liquidityAdder) external;

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function owner() external view returns (address);
    function metadataURI() external view returns (string memory);

    function marketingWallet() external view returns (address);
    function liquidityWallet() external view returns (address);
    function platformWallet() external view returns (address);
    
    function marketingTax() external view returns (uint256);
    function liquidityTax() external view returns (uint256);
    function autoBurnEnabled() external view returns (bool);
    
    function totalBurned() external view returns (uint256);
    function excludeFromFees(address account, bool excluded) external;
    function isExcludedFromFees(address account) external view returns (bool);
    
    function swapAndLiquifyEnabled() external view returns (bool);
    function setSwapAndLiquifyEnabled(bool enabled) external;
    function withdrawStuckTokens(address token) external;
    
    event MarketingWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event LiquidityWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TaxesUpdated(uint256 marketingTax, uint256 liquidityTax);
    event AutoBurnToggled(bool enabled);
    event SwapAndLiquifyEnabledUpdated(bool enabled);
    event TokensSwappedAndLiquified(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiquidity
    );
    event TokensBurned(address indexed from, uint256 amount);
}
