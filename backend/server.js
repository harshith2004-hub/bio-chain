import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

let contract = null;
let contractABI = [];
let contractAddress = null;

// Function to initialize the contract, with retries in case the artifact isn't generated yet
function initContract() {
    try {
        const artifactPath = path.join(__dirname, '../smart-contracts/artifacts/contracts/OrganDonation.sol/OrganDonation.json');
        if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            contractABI = artifact.abi;

            // Re-read environment variable in case it was injected after node boot
            dotenv.config({ override: true });
            contractAddress = process.env.CONTRACT_ADDRESS ? process.env.CONTRACT_ADDRESS.trim() : null;

            if (contractAddress && contractABI.length > 0) {
                const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
                const wallet = new ethers.Wallet(privateKey, provider);
                contract = new ethers.Contract(contractAddress, contractABI, wallet);
                console.log("✅ Successfully connected to Smart Contract at:", contractAddress);
                return true;
            }
        }
    } catch (e) {
        console.warn("Retrying contract connection...", e.message);
    }
    return false;
}

// Attempt immediate connection, or retry every 2 seconds if booting concurrently with Hardhat
if (!initContract()) {
    console.log("⏳ Waiting for Smart Contract to be deployed...");
    const retryInterval = setInterval(() => {
        if (initContract()) clearInterval(retryInterval);
    }, 2000);
}

app.post('/api/patients', async (req, res) => {
    try {
        if (!contract) return res.status(500).json({ error: "Contract not configured" });
        const { nationalId, name, neededOrgan, bloodType, urgencyScore } = req.body;
        const tx = await contract.addPatient(nationalId, name, neededOrgan, bloodType, urgencyScore || 0);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error(error);
        if (error.message && error.message.includes("Patient ID already registered")) {
             return res.status(400).json({ error: "A patient with this National ID is already registered on the blockchain." });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/donors', async (req, res) => {
    try {
        if (!contract) return res.status(500).json({ error: "Contract not configured" });
        const { name, donatedOrgan, bloodType } = req.body;
        const tx = await contract.registerDonor(name, donatedOrgan, bloodType);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/registry', async (req, res) => {
    try {
        if (!contract) return res.status(500).json({ error: "Contract not configured" });
        const patients = await contract.getPatients();
        const donors = await contract.getDonors();

        const serialize = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json({ patients: serialize(patients), donors: serialize(donors) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/contract-status', (req, res) => {
    res.json({
        configured: !!contract,
        address: contractAddress
    });
});

app.listen(PORT, () => {
    console.log(`Bio-Chain backend running on http://localhost:${PORT}`);
});
