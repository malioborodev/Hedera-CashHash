# Hedera CashHash

A decentralized receivable financing platform built on Hedera Hashgraph.

## Setup

### Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables:
   - **WalletConnect Project ID**: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - **Hedera Credentials**: Get testnet account from [Hedera Portal](https://portal.hedera.com/register)

3. Update `.env` with your actual values:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id
   HEDERA_OPERATOR_ID=your_hedera_account_id
   HEDERA_OPERATOR_KEY=your_hedera_private_key
   ```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Hedera account

### Installation

```bash
npm install
```

### Development

Run both backend and frontend concurrently:

```bash
npm run dev
```

Or run separately:

```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

### Build

```bash
npm run build
```

### Start Production

```bash
npm run start
```

## 📁 Project Structure

```
Hedera-CashHash/
├── app/                    # Next.js app directory
├── components/            # React components
├── lib/                   # Utility functions
├── routes/               # Express.js API routes
├── types/                # TypeScript type definitions
├── config/               # Configuration files
├── wallet/               # Wallet integration
├── events/               # Event handling
├── invoices/             # Invoice management
├── server.ts            # Express server entry
├── globals.css          # Global styles
├── layout.tsx           # Next.js layout
├── page.tsx             # Next.js homepage
└── package.json         # Dependencies and scripts
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Backend
PORT=3001
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Hedera
HEDERA_OPERATOR_ID=your_operator_id
HEDERA_OPERATOR_KEY=your_operator_key
HEDERA_NETWORK=testnet
```

## 🛠️ Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Blockchain**: Hedera Hashgraph SDK
- **Wallet**: HashConnect, Hedera Wallet Connect
- **Storage**: File upload with Multer

## 📖 Features

- Invoice creation and management
- Decentralized financing
- Hedera wallet integration
- Real-time event tracking
- Secure file uploads
- Responsive design

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.