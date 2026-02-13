import { defaultWagmiConfig } from '@web3modal/wagmi';
import { bscTestnet } from 'wagmi/chains';

// Get environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Get one at https://cloud.walletconnect.com');
}

// Metadata for your app
const metadata = {
  name: 'Phantasma',
  description: 'Phantasma Betting Platform - Bet on fantasy sports with crypto',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://phantasma.bet',
  icons: ['https://phantasma.bet/icon.png']
};

// Supported chains
const chains = [bscTestnet] as const;

// Create wagmi config with Web3Modal
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});
