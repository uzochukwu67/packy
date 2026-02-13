import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { config } from "./lib/web3modal";
import { Toaster } from "@/components/ui/toaster";
import { BetSlipProvider } from "@/context/BetSlipContext";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import MyBets from "@/pages/MyBets";
import Season from "@/pages/Season";
import History from "@/pages/History";
import Leaderboard from "@/pages/Leaderboard";
import RoundResults from "@/pages/RoundResults";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/MainLayout";

import { useWeb3Modal , createWeb3Modal} from "@web3modal/wagmi/react";

// Create query client
const queryClient = new QueryClient();
// Initialize Web3Modal before React renders
createWeb3Modal({
  wagmiConfig: config,
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#06b6d4',
    '--w3m-accent': '#06b6d4',
  }
});
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BetSlipProvider>
          <Toaster />
          <Router />
        </BetSlipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
