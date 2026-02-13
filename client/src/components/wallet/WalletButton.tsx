import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function WalletButton({ variant = 'default', className }: WalletButtonProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  if (isConnecting) {
    return (
      <button
        disabled
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-300",
          className
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="space-y-2">
        {variant === 'default' && (
          <div className="bg-zinc-900 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Connected
              </span>
              <Wallet className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-sm font-mono text-white">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          </div>
        )}

        <button
          onClick={() => disconnect()}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 hover:border-red-500/50 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-red-400 transition-colors",
            className
          )}
        >
          <LogOut className="w-4 h-4" />
          {variant === 'compact' ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Disconnect'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black hover:bg-cyan-400 text-xs font-bold uppercase tracking-widest transition-colors",
        className
      )}
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </button>
  );
}
