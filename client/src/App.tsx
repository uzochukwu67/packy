import { Switch, Route } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { config } from "./lib/wagmi";
import { Toaster } from "@/components/ui/toaster";
import { BetSlipProvider } from "@/context/BetSlipContext";

import Home from "@/pages/Home";
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
    <Switch>
      {/* Landing page without MainLayout */}
      <Route path="/" component={Home} />

      {/* App pages with MainLayout */}
      <Route path="/dashboard">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/liquidity">
        <MainLayout>
          <Liquidity />
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
