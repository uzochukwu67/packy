import { Switch, Route } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { config } from "./lib/wagmi";
import { Toaster } from "@/components/ui/toaster";
import { BetSlipProvider } from "@/context/BetSlipContext";
import { bscTestnet } from 'wagmi/chains';

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import MyBets from "@/pages/MyBets";
import Season from "@/pages/Season";
import History from "@/pages/History";
import Leaderboard from "@/pages/Leaderboard";
import RoundResults from "@/pages/RoundResults";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/MainLayout";

// Create a client
const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Landing page without MainLayout */}
      <Route path="/" component={Home} />

      {/* App pages with MainLayout */}
      <Route path="/dashboard">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/my-bets">
        <MainLayout>
          <MyBets />
        </MainLayout>
      </Route>
      <Route path="/season">
        <MainLayout>
          <Season />
        </MainLayout>
      </Route>
      <Route path="/history">
        <MainLayout>
          <History />
        </MainLayout>
      </Route>
      <Route path="/leaderboard">
        <MainLayout>
          <Leaderboard />
        </MainLayout>
      </Route>
      <Route path="/rounds/:roundId">
        <MainLayout>
          <RoundResults />
        </MainLayout>
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || 'clzk8aaaa00kql50fd6wqaaaa'}
      config={{
        loginMethods: ['email', 'google', 'twitter', 'discord', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#06b6d4', // cyan-500
          logo: 'https://phantasma.bet/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: bscTestnet,
        supportedChains: [bscTestnet],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <BetSlipProvider>
            <Toaster />
            <Router />
          </BetSlipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}

export default App;
