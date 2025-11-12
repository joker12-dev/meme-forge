const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔍 Testing createTokenWithLP with NEW deployment...\n");

    const FACTORY_ADDRESS = "0xeE7CeBd30f7EaB663Bf2b48B22f7926456c642ff";
    
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", await signer.getAddress());
    
    const provider = ethers.provider;
    
    // Create interface
    const FACTORY_ABI = [
        "function createTokenWithLP(string name, string symbol, uint256 initialSupply, uint8 decimals, string metadataURI, string tier, uint256 lpTokenAmount, uint256 lpBnbAmount, uint256 customMarketingTax, uint256 customLiquidityTax, bool customAutoBurn) external payable returns (address)"
    ];
    
    const iface = new ethers.Interface(FACTORY_ABI);

    // Test parameters
    const params = {
        name: "TestToken",
        symbol: "TEST",
        initialSupply: 100000,
        decimals: 18,
        metadataURI: "",
        tier: "standard",
        lpTokenAmount: 50000,
        lpBnbAmount: ethers.parseEther("0.001"),
        customMarketingTax: 0,
        customLiquidityTax: 0,
        customAutoBurn: false
    };

    const totalValue = ethers.parseEther("0.0021");

    console.log("📝 Parameters:");
    console.log("  name:", params.name);
    console.log("  initialSupply:", params.initialSupply);
    console.log("  Total Value:", ethers.formatEther(totalValue), "BNB\n");

    try {
        // Encode
        const encodedData = iface.encodeFunctionData('createTokenWithLP', [
            params.name,
            params.symbol,
            params.initialSupply,
            params.decimals,
            params.metadataURI,
            params.tier,
            params.lpTokenAmount,
            params.lpBnbAmount,
            params.customMarketingTax,
            params.customLiquidityTax,
            params.customAutoBurn
        ]);
        
        console.log("🔧 Encoded successfully!");
        console.log("  Data length:", encodedData.length);
        console.log("  Data (first 100 chars):", encodedData.substring(0, 100));
        
        // Send tx
        const tx = {
            to: FACTORY_ADDRESS,
            from: await signer.getAddress(),
            data: encodedData,
            value: totalValue,
            gasLimit: 5000000
        };
        
        console.log("🚀 Sending transaction...");
        console.log("  To:", tx.to);
        console.log("  Value:", ethers.formatEther(tx.value), "BNB");
        console.log("  Data attached:", tx.data ? "Yes" : "No");
        console.log();
        const sentTx = await signer.sendTransaction(tx);
        console.log("✅ Transaction sent!");
        console.log("  Hash:", sentTx.hash);
        
        const receipt = await sentTx.wait();
        
        if (receipt && receipt.status === 1) {
            console.log("\n✅✅✅ TRANSACTION SUCCEEDED! ✅✅✅");
            console.log("  Block:", receipt.blockNumber);
            console.log("  Gas used:", receipt.gasUsed.toString());
            console.log("  Events:", receipt.logs.length);
        } else {
            console.log("\n❌ Transaction failed!");
            console.log("  Gas used:", receipt ? receipt.gasUsed.toString() : "unknown");
        }
        
    } catch (err) {
        console.log("❌ ERROR!");
        console.log("  Message:", err.message);
        
        // Extract error code
        if (err.message.includes("E12")) console.log("  → E12: Platform wallet not set");
        if (err.message.includes("E11")) console.log("  → E11: LiquidityAdder not set");
        if (err.message.includes("E10")) console.log("  → E10: Template not set");
        if (err.message.includes("E15")) console.log("  → E15: Transfer to platform failed");
        if (err.message.includes("E14")) console.log("  → E14: Initialize succeeded (shouldn't fail)");
        if (err.message.includes("E13")) console.log("  → E13: Token creation failed");
        if (err.message.includes("E8")) console.log("  → E8: Insufficient payment");
        
        console.log("\nFull error:");
        console.log(err.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
