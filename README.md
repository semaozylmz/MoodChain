# 🌙 Stellar Mood Tracker

**Stellar Mood Tracker** is a decentralized application (DApp) built on **Stellar Soroban** that lets users log and optionally fund their emotional state (e.g., happy, sad, motivated) on the blockchain.

## 🚀 Features

- 💫 Built on the Stellar Soroban smart contract platform
- 🌐 Modern frontend with **Next.js** and **Tailwind CSS**
- 🔐 Integrated with **Freighter Wallet** for secure transactions
- 📝 Log your mood entries and optionally attach a micro-funding
- 📜 Blockchain-based mood history (transparent and tamper-proof)
- 🕶️ Optional anonymous mode or private archive

## 📁 Project Structure

/project-root
├── /frontend           # Next.js frontend
│   └── /app
│       ├── layout.tsx
│       ├── page.tsx
│       └── globals.css (optional if using Tailwind CDN)
├── /contract           # Rust/Soroban smart contract
│   ├── src/lib.rs
│   └── Cargo.toml
└── README.md           # This file

## 🛠️ Installation

1. Clone the repository
git clone git clone https://github.com/semaozylmz/MoodChain.git
cd MoodChain

2. Install frontend dependencies
cd frontend
npm install

3. Start the development server
npm run dev

4. Build the smart contract
cd contract
cargo build --target wasm32-unknown-unknown --release

## 🔧 Usage

Connect your Freighter Wallet.
Select your current mood (e.g., happy, sad, etc.).
Optionally fund your mood log (acts as a personal token of expression).
Your mood entry is recorded on the Stellar blockchain.

## 📜 License

This project is licensed under the MIT License

## 🔗 Useful Links

🌐 Stellar Developer Docs
📘 Soroban Documentation
💼 Freighter Wallet
