import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const SMART_CONTRACTS_DIR = path.join(ROOT_DIR, 'smart-contracts');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

const childProcesses = [];

console.log("🚀 Starting Bio-Chain Services...\n");

console.log("🧹 Cleaning up old processes (this may take a few seconds)...");
try {
    // Aggressive port killer bypassing npm abstractions
    for (const port of [8545, 3001, 5173, 5174]) {
        try {
            const output = execSync(`netstat -ano | findstr :${port}`).toString();
            const lines = output.split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5 && parts[1].includes(`:${port}`) && parts[3] === 'LISTENING') {
                    const pid = parts[4];
                    if (pid !== "0") {
                        console.log(`Killing Ghost Process PID ${pid} on port ${port}...`);
                        execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
                    }
                }
            }
        } catch (e) { /* Ignore if port is free */ }
    }
} catch (e) { }

// Helper to run a command and prefix its output
function runService(name, command, args, cwd) {
    const p = spawn(command, args, { cwd, shell: true });
    childProcesses.push(p);

    p.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => console.log(`[${name}] ${line}`));
    });

    p.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => console.error(`[${name} ERROR] ${line}`));
    });

    return p;
}

// 1. Start Hardhat Node
console.log("1️⃣ Starting Local Blockchain...");
const nodeProcess = runService('BLOCKCHAIN', 'npx', ['hardhat', 'node'], SMART_CONTRACTS_DIR);

// Wait for the node to be ready before deploying
setTimeout(() => {
    // 2. Deploy Contract
    console.log("\n2️⃣ Deploying Smart Contract...");
    const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
        cwd: SMART_CONTRACTS_DIR, shell: true
    });

    deployProcess.stdout.on('data', (data) => {
        console.log(`[DEPLOY] ${data.toString().trim()}`);
    });

    deployProcess.on('close', (code) => {
        if (code === 0) {
            console.log("✅ Contract Deployed Successfully!");

            // 3. Start Backend
            console.log("\n3️⃣ Starting Backend API...");
            runService('BACKEND', 'node', ['server.js'], BACKEND_DIR);

            // 4. Start Frontend
            console.log("\n4️⃣ Starting React Frontend...");
            runService('FRONTEND', 'npm', ['run', 'dev', '--', '--port', '5173', '--strictPort'], FRONTEND_DIR);

            console.log("\n🌟 All services initiated! Press Ctrl+C to stop everything.\n");
        } else {
            console.error("❌ Failed to deploy contract. Stopping boot sequence.");
            cleanup();
        }
    });

}, 5000); // 5 second buffer for Hardhat node to initialize

function cleanup() {
    console.log('\n🛑 Shutting down all services safely...');
    for (const p of childProcesses) {
        if (p && !p.killed && p.pid) {
            try {
                // Force kill the process tree on Windows
                execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: 'ignore' });
            } catch (e) { }
        }
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
