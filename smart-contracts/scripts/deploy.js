import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Compiling and deploying Smart Contract...");

    const OrganDonation = await hre.ethers.getContractFactory("OrganDonation");
    const organDonation = await OrganDonation.deploy();

    await organDonation.waitForDeployment();
    const address = organDonation.target;

    console.log(`OrganDonation deployed to: ${address}`);

    // Automatically write the contract address to the backend's .env file
    const backendEnvPath = path.join(__dirname, "../../backend/.env");
    fs.writeFileSync(backendEnvPath, `CONTRACT_ADDRESS=${address}\n`);
    console.log("Successfully updated backend/.env with the new contract address.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
