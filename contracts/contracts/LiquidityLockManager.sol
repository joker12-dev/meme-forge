// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityLockManager {
    struct LockInfo {
        uint256 amount;
        uint256 unlockTime;
        bool isUnlocked;
    }

    struct TokenLockSummary {
        uint256 totalLocked;
        uint256 nextUnlockTime;
        LockInfo[] activeLocks;
    }

    mapping(address => mapping(address => LockInfo[])) private liquidityLocks; // token => user => locks
    mapping(address => mapping(address => uint256)) public totalLockedAmount; // token => user => total amount
    mapping(address => address[]) private userLocks; // user => tokens with locks
    
    event LiquidityLocked(address indexed token, address indexed user, uint256 amount, uint256 unlockTime);
    event LiquidityUnlocked(address indexed token, address indexed user, uint256 amount);

    function lockLiquidity(address lpToken, uint256 amount, uint256 duration) external {
        require(lpToken != address(0), "Invalid LP token");
        require(amount > 0, "Amount must be greater than 0");
        require(duration >= 7 days, "Lock duration too short"); // Minimum 7 days lock

        IERC20 token = IERC20(lpToken);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 unlockTime = block.timestamp + duration;
        
        liquidityLocks[lpToken][msg.sender].push(LockInfo({
            amount: amount,
            unlockTime: unlockTime,
            isUnlocked: false
        }));

        totalLockedAmount[lpToken][msg.sender] += amount;

        // Track user's locked tokens
        if (liquidityLocks[lpToken][msg.sender].length == 1) {
            userLocks[msg.sender].push(lpToken);
        }

        emit LiquidityLocked(lpToken, msg.sender, amount, unlockTime);
    }

    function unlockLiquidity(address lpToken, uint256 lockIndex) external {
        require(lpToken != address(0), "Invalid LP token");
        require(lockIndex < liquidityLocks[lpToken][msg.sender].length, "Invalid lock index");

        LockInfo storage lockInfo = liquidityLocks[lpToken][msg.sender][lockIndex];
        require(!lockInfo.isUnlocked, "Already unlocked");
        require(block.timestamp >= lockInfo.unlockTime, "Lock not expired");

        uint256 amount = lockInfo.amount;
        lockInfo.isUnlocked = true;
        totalLockedAmount[lpToken][msg.sender] -= amount;

        IERC20(lpToken).transfer(msg.sender, amount);
        emit LiquidityUnlocked(lpToken, msg.sender, amount);
    }

    function getTokenLockSummary(address lpToken, address user) external view returns (TokenLockSummary memory) {
        LockInfo[] storage locks = liquidityLocks[lpToken][user];
        LockInfo[] memory activeLocks = new LockInfo[](locks.length);
        uint256 activeCount = 0;
        uint256 totalLocked = 0;
        uint256 nextUnlock = type(uint256).max;

        for (uint256 i = 0; i < locks.length; i++) {
            if (!locks[i].isUnlocked) {
                activeLocks[activeCount] = locks[i];
                totalLocked += locks[i].amount;
                if (locks[i].unlockTime < nextUnlock) {
                    nextUnlock = locks[i].unlockTime;
                }
                activeCount++;
            }
        }

        // Create a new array with the correct size
        LockInfo[] memory trimmedActiveLocks = new LockInfo[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            trimmedActiveLocks[i] = activeLocks[i];
        }

        return TokenLockSummary({
            totalLocked: totalLocked,
            nextUnlockTime: nextUnlock == type(uint256).max ? 0 : nextUnlock,
            activeLocks: trimmedActiveLocks
        });
    }

    function getUserLockedTokens(address user) external view returns (address[] memory) {
        return userLocks[user];
    }
}