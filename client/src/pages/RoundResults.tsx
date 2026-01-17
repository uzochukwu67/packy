import { useParams } from "wouter";
import { useRoundResults, useUserRoundBets } from "@/hooks/useRounds";
import { useAccount } from "wagmi";
import { useClaimWinnings } from "@/hooks/contracts/useBettingPool";
import { Loader2, AlertCircle, Trophy, TrendingUp, Users, Coins, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEther } from "viem";

export default function RoundResults() {
  const { roundId } = useParams<{ roundId: string }>();
  const { address } = useAccount();
  const { toast } = useToast();

  const { data: results, isLoading, isError, refetch } = useRoundResults(roundId);
  const { data: userBets, refetch: refetchUserBets } = useUserRoundBets(address, roundId);
  const { claimWinnings, isConfirming, isSuccess, hash } = useClaimWinnings();

  // Show success toast when claim is confirmed
  if (isSuccess && hash) {
    toast({
      title: "Winnings Claimed!",
      description: `Transaction confirmed: ${hash.slice(0, 10)}...`,
    });
    // Refetch data after successful claim
    setTimeout(() => {
      refetch();
      refetchUserBets();
    }, 2000);
  }

  const handleClaimWinnings = (betId: string) => {
    try {
      claimWinnings(BigInt(betId));
      toast({
        title: "Claiming Winnings",
        description: "Please confirm the transaction in your wallet...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim winnings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading round results...</p>
        </div>
      </div>
    );
  }

  if (isError || !results) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Results</h3>
          <p className="text-gray-600">Round {roundId} not found or data unavailable.</p>
        </div>
      </div>
    );
  }

  const { round, matches, statistics } = results;

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'HOME_WIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'AWAY_WIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'DRAW': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'HOME_WIN': return 'Home Win';
      case 'AWAY_WIN': return 'Away Win';
      case 'DRAW': return 'Draw';
      default: return 'Pending';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Round {round.roundId} Results
            </h1>
            <p className="text-gray-600">
              Season {round.seasonId} • {new Date(round.startTime).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {round.settled ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1.5 px-4 py-2">
                <CheckCircle className="w-4 h-4" />
                Settled
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1.5 px-4 py-2">
                <Clock className="w-4 h-4" />
                Pending
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(formatEther(BigInt(statistics.totalVolume || '0'))).toFixed(2)} LEAGUE
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winning Bets</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.wonBets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.totalBets > 0
                ? `${((statistics.wonBets / statistics.totalBets) * 100).toFixed(1)}% win rate`
                : 'No bets'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost Bets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.lostBets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.pendingBets} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Match Results */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Match Results</h2>
        <div className="grid gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">Match {match.matchIndex + 1}</div>
                      <Badge className={getOutcomeColor(match.outcome)}>
                        {getOutcomeLabel(match.outcome)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{match.homeTeamName || `Team ${match.homeTeamId}`}</p>
                        <p className="text-sm text-gray-500">Home</p>
                      </div>

                      {match.settled ? (
                        <div className="px-8 text-center">
                          <div className="text-3xl font-bold text-gray-900">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        </div>
                      ) : (
                        <div className="px-8 text-center">
                          <div className="text-lg font-medium text-gray-400">vs</div>
                        </div>
                      )}

                      <div className="flex-1 text-right">
                        <p className="font-semibold text-lg">{match.awayTeamName || `Team ${match.awayTeamId}`}</p>
                        <p className="text-sm text-gray-500">Away</p>
                      </div>
                    </div>

                    {match.settled && (
                      <div className="mt-4 pt-4 border-t flex gap-6 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Home Odds:</span> {(parseFloat(match.homeOdds) / 100).toFixed(2)}x
                        </div>
                        <div>
                          <span className="font-medium">Away Odds:</span> {(parseFloat(match.awayOdds) / 100).toFixed(2)}x
                        </div>
                        <div>
                          <span className="font-medium">Draw Odds:</span> {(parseFloat(match.drawOdds) / 100).toFixed(2)}x
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* User's Bets */}
      {address && userBets && userBets.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Bets</h2>
          <div className="grid gap-4">
            {userBets.map((bet) => {
              const isWon = bet.status === 'won' || bet.status === 'claimed';
              const isLost = bet.status === 'lost';
              const isPending = bet.status === 'pending';

              return (
                <Card key={bet.id} className={`
                  ${isWon ? 'border-green-200 bg-green-50/50' : ''}
                  ${isLost ? 'border-red-200 bg-red-50/50' : ''}
                  ${isPending ? 'border-yellow-200 bg-yellow-50/50' : ''}
                `}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline">{bet.matchIndices.length} Match Parlay</Badge>
                          {isWon && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {isLost && <XCircle className="w-5 h-5 text-red-600" />}
                          {isPending && <Clock className="w-5 h-5 text-yellow-600" />}
                          <span className={`font-semibold ${
                            isWon ? 'text-green-600' : isLost ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {bet.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Bet Amount</p>
                            <p className="font-semibold">{parseFloat(formatEther(BigInt(bet.amount))).toFixed(2)} LEAGUE</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Potential Winnings</p>
                            <p className="font-semibold">{parseFloat(formatEther(BigInt(bet.potentialWinnings))).toFixed(2)} LEAGUE</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Parlay Multiplier</p>
                            <p className="font-semibold">{(parseFloat(bet.parlayMultiplier) / 1e18).toFixed(2)}x</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Placed At</p>
                            <p className="font-semibold">{new Date(bet.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Predictions:</p>
                          <div className="flex flex-wrap gap-2">
                            {bet.matchIndices.map((matchIndex: number, i: number) => {
                              const outcome = bet.outcomes[i];
                              const outcomeText = outcome === 1 ? 'Home' : outcome === 2 ? 'Away' : 'Draw';
                              return (
                                <Badge key={i} variant="secondary">
                                  Match {matchIndex + 1}: {outcomeText}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {isWon && bet.status === 'won' && (
                        <Button
                          className="ml-4"
                          onClick={() => handleClaimWinnings(bet.betId)}
                          disabled={isConfirming}
                        >
                          {isConfirming ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            'Claim Winnings'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
