// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract MockPancakeFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    uint256 private pairCounter;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'PAIR_EXISTS');
        
        // Create a mock pair address (simple counter-based)
        pairCounter++;
        pair = address(uint160(uint256(keccak256(abi.encodePacked("PAIR", pairCounter)))));
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        
        emit PairCreated(token0, token1, pair, allPairs.length);
        return pair;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }
}

contract MockPancakeRouter {
    address public immutable factory;
    address public immutable WETH;

    constructor() {
        factory = address(new MockPancakeFactory());
        WETH = address(this); // Mock WETH as router itself for simplicity
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        // Mock implementation - just return some values
        return (amountTokenDesired, msg.value, 1000);
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        // Mock implementation - do nothing
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable {
        // Mock implementation - do nothing
    }

    // Helper function to get factory address
    function getFactory() external view returns (address) {
        return factory;
    }
}
