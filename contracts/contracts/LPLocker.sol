// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LPLocker
 * @dev LP tokenlarının kilitlenmesi ve satışı için kontrat
 */
contract LPLocker is ReentrancyGuard {
    struct LockInfo {
        uint256 amount;
        uint256 unlockTime;
        bool exists;
    }

    // Events
    event LPLocked(address indexed token, address indexed owner, uint256 amount, uint256 unlockTime);
    event LPUnlocked(address indexed token, address indexed owner, uint256 amount);
    event LPSold(address indexed token, address indexed owner, uint256 amount, uint256 ethReceived);

    // State variables
    mapping(address => mapping(address => LockInfo)) public locks; // token => owner => LockInfo
    
    /**
     * @dev LP tokenlarını kilitler
     * @param lpToken LP token adresi
     * @param amount Kilitlenecek miktar
     * @param lockTime Kilit süresi (saniye)
     */
    function lockLP(
        address lpToken,
        uint256 amount,
        uint256 lockTime
    ) external nonReentrant {
        require(lpToken != address(0), "Invalid LP token");
        require(amount > 0, "Amount must be > 0");
        require(lockTime > 0, "Lock time must be > 0");
        require(!locks[lpToken][msg.sender].exists, "LP already locked");

        IERC20 token = IERC20(lpToken);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 unlockTime = block.timestamp + lockTime;
        locks[lpToken][msg.sender] = LockInfo({
            amount: amount,
            unlockTime: unlockTime,
            exists: true
        });

        emit LPLocked(lpToken, msg.sender, amount, unlockTime);
    }

    /**
     * @dev Kilidi açılan LP tokenlarını satar
     * @param lpToken LP token adresi
     * @param amount Satılacak miktar
     * @param router Router kontrat adresi
     * @param minEthAmount Minimum alınacak ETH miktarı
     */
    function sellLP(
        address lpToken,
        uint256 amount,
        address router,
        uint256 minEthAmount
    ) external nonReentrant {
        LockInfo storage lockInfo = locks[lpToken][msg.sender];
        require(lockInfo.exists, "No locked LP");
        require(block.timestamp >= lockInfo.unlockTime, "LP is locked");
        require(amount <= lockInfo.amount, "Insufficient locked amount");

        lockInfo.amount -= amount;
        if (lockInfo.amount == 0) {
            delete locks[lpToken][msg.sender];
        }

        IERC20(lpToken).transfer(router, amount);
        
        emit LPSold(lpToken, msg.sender, amount, minEthAmount);
    }

    /**
     * @dev Kilidi açılan LP tokenlarını geri çeker
     * @param lpToken LP token adresi
     */
    function unlock(address lpToken) external nonReentrant {
        LockInfo storage lockInfo = locks[lpToken][msg.sender];
        require(lockInfo.exists, "No locked LP");
        require(block.timestamp >= lockInfo.unlockTime, "LP is locked");

        uint256 amount = lockInfo.amount;
        delete locks[lpToken][msg.sender];

        IERC20(lpToken).transfer(msg.sender, amount);
        
        emit LPUnlocked(lpToken, msg.sender, amount);
    }

    /**
     * @dev LP kilit bilgilerini döndürür
     * @param lpToken LP token adresi
     * @param owner Token sahibi
     */
    function getLockInfo(address lpToken, address owner)
        external
        view
        returns (
            uint256 amount,
            uint256 unlockTime,
            bool exists
        )
    {
        LockInfo memory lockInfo = locks[lpToken][owner];
        return (lockInfo.amount, lockInfo.unlockTime, lockInfo.exists);
    }
}