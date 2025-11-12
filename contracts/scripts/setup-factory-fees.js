const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("\n🔧 Setting up TokenFactory fee configuration...\n");

        const FACTORY_ADDRESS = "0xeE7CeBd30f7EaB663Bf2b48B22f7926456c642ff";
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    
    if (!PRIVATE_KEY) {
        console.error("❌ PRIVATE_KEY not set in .env");
        process.exit(1);
    }
    
    const provider = ethers.provider;
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log("Using owner:", await signer.getAddress());
    
    const factory = await ethers.getContractAt("TokenFactory", FACTORY_ADDRESS, signer);

    // Fee configuration
    const platformWallet = await signer.getAddress();  // Owner is platform wallet
    const developmentWallet = "0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C";  // Dev wallet
    const marketingWallet = "0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C";   // Marketing wallet
    const platformCommissionWallet = "0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C";  // Commission wallet

    console.log("📝 Configuration:");
    console.log("  Platform wallet:", platformWallet);
    console.log("  Development wallet:", developmentWallet);
    console.log("  Marketing wallet:", marketingWallet);
    console.log("  Platform commission wallet:", platformCommissionWallet);
    
    try {
        console.log("\n🚀 Calling updateFeeWallets...");
        const tx = await factory.updateFeeWallets(
            platformWallet,
            developmentWallet,
            marketingWallet,
            platformCommissionWallet
        );
        
        console.log("✅ Transaction sent!");
        console.log("  Hash:", tx.hash);
        console.log("  Waiting for confirmation...\n");
        
        const receipt = await tx.wait();
        
        if (receipt && receipt.status === 1) {
            console.log("✅ CONFIGURATION SET SUCCESSFULLY!");
            console.log("  Block:", receipt.blockNumber);
            console.log("  Gas used:", receipt.gasUsed.toString());
        } else {
            console.log("❌ Transaction failed!");
        }
        
    } catch (err) {
        console.log("❌ Error:", err.message);
        console.log("\nFull error:");
        console.log(err);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
