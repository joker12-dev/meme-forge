// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IPancakeRouter {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
}

contract LiquidityAdder is Ownable, ReentrancyGuard {
    IPancakeRouter public immutable router;
    address public feeCollector;
    uint256 public platformFee;
    uint256 public minTokenAmount;
    uint256 public minEthAmount;
    bool public paused;
    
    event LiquidityAdded(
        address indexed token, 
        address indexed sender,
        uint256 tokenAmount, 
        uint256 ethAmount, 
        uint256 liquidity
    );
    event LiquidityAddedFrom(
        address indexed token,
        address indexed from,
        address indexed recipient,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 liquidity
    );
    event MinTokenAmountUpdated(uint256 amount);
    event MinEthAmountUpdated(uint256 amount);
    event PlatformFeeUpdated(uint256 fee);
    event FeeCollectorUpdated(address indexed newCollector);
    event PausedStateUpdated(bool paused);
    event EmergencyWithdraw(address token, uint256 amount);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(
        address _router,
        uint256 _minTokenAmount,
        uint256 _minEthAmount,
        uint256 _platformFee,
        address _feeCollector
    ) {
        require(_router != address(0), "Invalid router");
        require(_feeCollector != address(0), "Invalid fee collector");
        require(_platformFee <= 200, "Fee too high"); // Max %2 (gas tasarrufu)
        
        router = IPancakeRouter(_router);
        minTokenAmount = _minTokenAmount;
        minEthAmount = _minEthAmount;
        platformFee = _platformFee;
        feeCollector = _feeCollector;
    }
    
    function addLiquidity(
        address token, 
        uint256 tokenAmount
    ) external payable nonReentrant whenNotPaused returns (uint256 liquidity) {
        require(token != address(0), "Invalid token");
        require(tokenAmount >= minTokenAmount, "Token amount too low");
        require(msg.value >= minEthAmount, "ETH amount too low");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.allowance(msg.sender, address(this)) >= tokenAmount, "Insufficient allowance");
        
        // Calculate and transfer platform fee
        uint256 feeAmount = (msg.value * platformFee) / 10000;
        if (feeAmount > 0) {
            payable(feeCollector).transfer(feeAmount);
        }
        
        // Transfer tokens to this contract
        require(tokenContract.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        // Approve router to spend tokens
        require(tokenContract.approve(address(router), tokenAmount), "Token approve failed");
        
        // Add liquidity
        (uint256 tokenUsed, uint256 ethUsed, uint256 liquidityAmount) = router.addLiquidityETH{value: msg.value - feeAmount}(
            token,
            tokenAmount,
            0, // Accept any amount of tokens
            0, // Accept any amount of ETH
            msg.sender,
            block.timestamp
        );
        liquidity = liquidityAmount;
        
        // Refund unused tokens
        uint256 remainingTokens = tokenAmount - tokenUsed;
        if (remainingTokens > 0) {
            require(tokenContract.transfer(msg.sender, remainingTokens), "Token refund failed");
        }
        
        // Refund unused ETH
        uint256 remainingEth = msg.value - feeAmount - ethUsed;
        if (remainingEth > 0) {
            payable(msg.sender).transfer(remainingEth);
        }
        
        emit LiquidityAdded(token, msg.sender, tokenUsed, ethUsed, liquidity);
        return liquidity;
    }

    /**
     * @dev Add liquidity by pulling tokens from an approved source address.
     * This allows users to add liquidity using tokens held in a platform wallet
     * (after the token contract minted the initial supply to the platform wallet).
     * The `from` address must have previously approved this contract to spend `tokenAmount`.
     * `recipient` will receive the resulting LP tokens.
     * 
     * Key use case: User creates token -> tokens minted to platform wallet -> user calls this function
     * with from=platformWallet to add liquidity using those tokens, with recipient=user to receive LP tokens.
     */
    function addLiquidityFrom(
        address token,
        address from,
        uint256 tokenAmount,
        address recipient
    ) external payable nonReentrant whenNotPaused returns (uint256 liquidity) {
        require(token != address(0), "Invalid token");
        require(from != address(0), "Invalid source");
        require(recipient != address(0), "Invalid recipient");
        require(tokenAmount >= minTokenAmount, "Token amount too low");
        require(msg.value >= minEthAmount, "ETH amount too low");

        IERC20 tokenContract = IERC20(token);
        require(tokenContract.allowance(from, address(this)) >= tokenAmount, "Insufficient allowance from source");

        // Calculate and transfer platform fee (from ETH sent)
        uint256 feeAmount = (msg.value * platformFee) / 10000;
        if (feeAmount > 0) {
            payable(feeCollector).transfer(feeAmount);
        }

        // Pull tokens from source (platform wallet)
        require(tokenContract.transferFrom(from, address(this), tokenAmount), "Token transfer failed");

        // Approve router to spend tokens
        require(tokenContract.approve(address(router), tokenAmount), "Token approve failed");

        // Add liquidity using pulled tokens and provided ETH (minus fee)
        (uint256 tokenUsed, uint256 ethUsed, uint256 liquidityAmount) = router.addLiquidityETH{value: msg.value - feeAmount}(
            token,
            tokenAmount,
            0,
            0,
            recipient,
            block.timestamp
        );
        liquidity = liquidityAmount;

        // Refund unused tokens to the source
        uint256 remainingTokens = tokenAmount - tokenUsed;
        if (remainingTokens > 0) {
            require(tokenContract.transfer(from, remainingTokens), "Token refund failed");
        }

        // Refund unused ETH to the caller (owner)
        uint256 remainingEth = msg.value - feeAmount - ethUsed;
        if (remainingEth > 0) {
            payable(msg.sender).transfer(remainingEth);
        }

        emit LiquidityAddedFrom(token, from, recipient, tokenUsed, ethUsed, liquidity);
        return liquidity;
    }
    
    // Admin functions
    function setMinTokenAmount(uint256 amount) external onlyOwner {
        minTokenAmount = amount;
        emit MinTokenAmountUpdated(amount);
    }
    
    function setMinEthAmount(uint256 amount) external onlyOwner {
        minEthAmount = amount;
        emit MinEthAmountUpdated(amount);
    }
    
    function setPlatformFee(uint256 fee) external onlyOwner {
        require(fee <= 200, "Fee too high"); // Max %2 (gas tasarrufu)
        platformFee = fee;
        emit PlatformFeeUpdated(fee);
    }
    
    function setFeeCollector(address collector) external onlyOwner {
        require(collector != address(0), "Invalid collector");
        feeCollector = collector;
        emit FeeCollectorUpdated(collector);
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateUpdated(_paused);
    }
    
    // Emergency functions
    function withdrawToken(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        if (balance > 0) {
            tokenContract.transfer(owner(), balance);
            emit EmergencyWithdraw(token, balance);
        }
    }
    
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
            emit EmergencyWithdraw(address(0), balance);
        }
    }
    
    receive() external payable {
        // Accept ETH transfers
    }
}