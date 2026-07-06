# Bio-Chain: Decentralized Organ Donation Ledger 🧬♤️

Bio-Chain is a highly secure, Web3-powered healthcare logistics application. It replaces traditional, centralized organ donation databases with an immutable Ethereum blockchain to prevent data tampering, VIP favoritism, and corruption.

## 🌟 Key Features
- **Autonomous Smart Contract Matching:** Automatically pairs donors to patients based on biological compatibility and a mathematical "Medical Urgency Score."
- **Cryptographic Duplicate Prevention:** Rejects duplicate National IDs at the protocol level.
- **Role-Based Privacy Engine:** Actively masks patient names and IDs in Public View to ensure medical data privacy.
- **Web3 Relayer Backend:** Express.js securely handles all crypto wallet signatures, allowing hospital staff to use the system seamlessly without Web3 knowledge.

## 🛦 Technology Stack
- **Frontend:** React.js, Vite, Vanilla CSS (Glassmorphism UI)
- **Backend/Relayer:** Node.js, Express.js, Ethers.js
- **Blockchain:** Solidity, Hardhat Local Node

## 🎈 How to Run the Project Locally

**1. Clone the repository:**
`git clone https://github.com/YourUsername/bio-chain.git`
cd biomchain`

**2. Install all dependencies:**
`npm install`
`cd frontend && npm install`
`cd ../backend && npm install`
`cd ../smart-contracts && npm install`

**3. Start the entire system (Blockchain, Backend, Frontend):**
Return to the main `bio-chain` folder and run the orchestrator script:
`npm start`

The React website will automatically launch in your browser, securely connected to the local Hardhat blockchain!