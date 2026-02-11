import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export type BetSelection = {
  id: string; // unique ID for the selection
  matchId: string;
  matchIndex: number; // 0-9 for contract
  matchTitle: string;
  selection: string; // e.g. "Home", "Draw", "Away"
  outcome: 1 | 2 | 3; // 1=HOME_WIN, 2=AWAY_WIN, 3=DRAW for contract
  odds: number;
};

interface BetSlipContextType {
  bets: BetSelection[];
  addBet: (bet: BetSelection) => void;
  removeBet: (id: string) => void;
  clearSlip: () => void;
  stake: number;
  setStake: (amount: number) => void;
  isOpen: boolean;
  toggleSlip: () => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<number>(10);
  const [isOpen, setIsOpen] = useState(true); // Open by default on desktop
  const { toast } = useToast();

  const addBet = (bet: BetSelection) => {
    setBets((prev) => {
      // Check if already exists to prevent duplicates or conflicting bets for same match if desired
      const exists = prev.find(b => b.matchId === bet.matchId);
      if (exists) {
        // Replace existing bet for this match
        return prev.map(b => b.matchId === bet.matchId ? bet : b);
      }
      return [...prev, bet];
    });
    setIsOpen(true);
    toast({
      title: "Selection Added",
      description: `${bet.selection} @ ${bet.odds}`,
      duration: 2000,
    });
  };

  const removeBet = (id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const clearSlip = () => {
    setBets([]);
  };

  const toggleSlip = () => setIsOpen(prev => !prev);

  // Responsive: auto-close on mobile initially? (logic can be added)

  return (
    <BetSlipContext.Provider value={{ bets, addBet, removeBet, clearSlip, stake, setStake, isOpen, toggleSlip }}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
}
