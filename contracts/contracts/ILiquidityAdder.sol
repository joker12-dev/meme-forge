// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILiquidityAdder {
    function addLiquidityFrom(
        address tokenAddress,
        address from,
        uint256 tokenAmount,
        address recipient
    ) external payable returns (uint256 liquidity);
    
    function addLiquidity(
        address tokenAddress,
        uint256 tokenAmount
    ) external payable returns (uint256 liquidity);
}
