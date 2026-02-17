import { createConfig, http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Get RPC URL from environment variable or use default
const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://bsc-testnet.publicnode.com';

// Debug: Log the RPC URL being used
console.log('Wagmi RPC URL:', rpcUrl);

export const config = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(rpcUrl, {
      batch: {
        wait: 50,
      },
      retryCount: 1,
      timeout: 10_000,
    }),
  },
  connectors: [
     walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'dummy-project-id',
      metadata: {
        name: 'Phantasma',
        description: 'Phantasma Betting Platform',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://phantasma.bet',
        icons: ['https://phantasma.bet/icon.png']
      },
      showQrModal: true,
    }),
    injected(),
    coinbaseWallet({
      appName: 'Phantasma',
      appLogoUrl: 'https://phantasma.bet/icon.png',
    }),
  ],
});
