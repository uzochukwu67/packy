import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Get RPC URL from environment variable or use default

const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

// Debug: Log the RPC URL being used
console.log('Wagmi RPC URL:', rpcUrl);

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl, {
      batch: {
        wait: 50,
      },
      retryCount: 3,
      timeout: 10_000,
    }),
  },
  connectors: [injected()],
});
