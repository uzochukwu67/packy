import { Switch, Route } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { config } from "./lib/wagmi";
import { Toaster } from "@/components/ui/toaster";
import { BetSlipProvider } from "@/context/BetSlipContext";

import Dashboard from "@/pages/Dashboard";
import Liquidity from "@/pages/Liquidity";
import MyBets from "@/pages/MyBets";
import Season from "@/pages/Season";
import History from "@/pages/History";
import RoundResults from "@/pages/RoundResults";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/MainLayout";

// Create a client
const queryClient = new QueryClient();

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/liquidity" component={Liquidity} />
        <Route path="/my-bets" component={MyBets} />
        <Route path="/season" component={Season} />
        <Route path="/history" component={History} />
        <Route path="/rounds/:roundId" component={RoundResults} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
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
