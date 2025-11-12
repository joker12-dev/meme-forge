// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MemeToken
 * @dev Clone-pattern compatible meme token template
 */

contract MemeToken is ERC20, ERC20Burnable, Ownable {
    uint8 public _decimals_value;
    address public factory;
    string public metadataURI;
    address public marketingWallet;
    address public liquidityWallet;
    address public platformWallet;
    uint256 public marketingTax;
    uint256 public liquidityTax;
    bool public autoBurnEnabled;
    address public pancakeRouter;
    bool private initialized;

    // Internal storage for name/symbol (since ERC20 doesn't allow us to change them)
    string private _name_storage;
    string private _symbol_storage;

    constructor() ERC20("MemeToken", "MEME") {
        factory = msg.sender;
    }

    /**
     * @dev Initialize token clone (called by TokenFactory after clone)
     */
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
        // For cloned contracts, factory will be the old template's owner initially
        // So we just check that this is being called to initialize (can be called by owner or contract deployer)
        
        initialized = true;
        
        // Set the factory to the caller (TokenFactory)
        factory = msg.sender;
        require(owner_ != address(0), "Invalid owner");
        
        // Store name/symbol for view functions
        _name_storage = name_;
        _symbol_storage = symbol_;
        _decimals_value = decimals_;
        metadataURI = metadataURI_;
        marketingWallet = _marketingWallet;
        liquidityWallet = _liquidityWallet;
        platformWallet = _platformWallet;
        marketingTax = _marketingTax;
        liquidityTax = _liquidityTax;
        autoBurnEnabled = _autoBurnEnabled;
        pancakeRouter = _pancakeRouter;
        
        // Transfer ownership to factory at first (factory will transfer to user)
        _transferOwnership(factory);
        
        // Mint tokens to factory (will distribute to LP + user)
        // Scale by decimals: 100000 tokens with 18 decimals = 100000 * 10^18
        _mint(factory, initialSupply * (10 ** decimals_));
        
        // Auto-approve factory to spend tokens from this contract
        _approve(address(this), factory, type(uint256).max);
    }

    /**
     * @dev Override name to return custom value
     */
    function name() public view override returns (string memory) {
        if (initialized) {
            return _name_storage;
        }
        return super.name();
    }

    /**
     * @dev Override symbol to return custom value
     */
    function symbol() public view override returns (string memory) {
        if (initialized) {
            return _symbol_storage;
        }
        return super.symbol();
    }

    /**
     * @dev Returns the number of decimals used
     */
    function decimals() public view override returns (uint8) {
        if (initialized) {
            return _decimals_value;
        }
        return 18;
    }

    /**
     * @dev Allow factory to approve liquidity operations for platform wallet
     * Platform wallet owns the LP tokens and needs to approve LiquidityAdder to spend them
     */
    function approveLiquidityAdder(address platformWallet, address liquidityAdder) external {
        require(msg.sender == factory, "Only factory");
        require(platformWallet != address(0), "Invalid platform wallet");
        require(liquidityAdder != address(0), "Invalid liquidityAdder");
        // Approve platform wallet's tokens to be spent by LiquidityAdder
        _approve(platformWallet, liquidityAdder, type(uint256).max);
    }
}