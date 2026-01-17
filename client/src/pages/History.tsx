import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, AlertCircle, Trophy, Calendar, ChevronRight, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RoundData } from "@/hooks/useRounds";

export default function History() {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  // Fetch all rounds
  const { data: rounds, isLoading, isError } = useQuery<RoundData[]>({
    queryKey: ['allRounds', selectedSeason],
    queryFn: async () => {
      const url = selectedSeason
        ? `/api/game/rounds?seasonId=${selectedSeason}`
        : `/api/game/rounds?limit=100`;

      const response = await fetch(url);
      const data = await response.json();
      console.log(data, response);
      return data.map((round: any) => ({
        ...round,
        startTime: new Date(round.startTime),
        endTime: new Date(round.endTime),
        vrfFulfilledAt: round.vrfFulfilledAt ? new Date(round.vrfFulfilledAt) : undefined,
        settledAt: round.settledAt ? new Date(round.settledAt) : undefined,
      }));
    },
  });

  // Group rounds by season
  const roundsBySeason = rounds?.reduce((acc, round) => {
    const seasonId = round.seasonId;
    if (!acc[seasonId]) {
      acc[seasonId] = [];
    }
    acc[seasonId].push(round);
    return acc;
  }, {} as Record<string, RoundData[]>);

  const seasons = roundsBySeason ? Object.keys(roundsBySeason).sort((a, b) => parseInt(b) - parseInt(a)) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading round history...</p>
        </div>
      </div>
    );
  }

  if (isError || !rounds) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load History</h3>
          <p className="text-gray-600">Could not fetch round history data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Round History</h1>
        <p className="text-muted-foreground">
          Browse past seasons and rounds to view results and statistics
        </p>
      </div>

      {/* Season Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSeason(null)}
          className={`px-4 py-2 rounded-xl border font-medium transition-colors ${
            selectedSeason === null
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
          }`}
        >
          All Seasons
        </button>
        {seasons.map((seasonId) => (
          <button
            key={seasonId}
            onClick={() => setSelectedSeason(seasonId)}
            className={`px-4 py-2 rounded-xl border font-medium transition-colors ${
              selectedSeason === seasonId
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
            }`}
          >
            Season {seasonId}
          </button>
        ))}
      </div>

      {/* Seasons List */}
      {!selectedSeason && roundsBySeason && (
        <div className="space-y-8">
          {seasons.map((seasonId) => {
            const seasonRounds = roundsBySeason[seasonId];
            const settledRounds = seasonRounds.filter(r => r.settled).length;
            const totalRounds = seasonRounds.length;

            return (
              <div key={seasonId} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-gray-900">Season {seasonId}</h2>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {settledRounds} / {totalRounds} Rounds Completed
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {seasonRounds.map((round) => (
                    <Link key={round.roundId} href={`/rounds/${round.roundId}`}>
                      <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center min-w-[60px]">
                                <div className="text-sm text-gray-500">Round</div>
                                <div className="text-2xl font-bold text-primary">{round.roundId}</div>
                              </div>

                              <div className="border-l border-gray-200 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {round.startTime.toLocaleDateString()} at {round.startTime.toLocaleTimeString()}
                                  </span>
                                </div>
                                {round.settled && round.settledAt && (
                                  <div className="text-xs text-gray-500">
                                    Settled {round.settledAt.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {round.settled ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Settled
                                </Badge>
                              ) : round.isActive ? (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </Badge>
                              )}
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Season View */}
      {selectedSeason && roundsBySeason && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Season {selectedSeason}</h2>
          </div>

          <div className="grid gap-3">
            {roundsBySeason[selectedSeason]?.map((round) => (
              <Link key={round.roundId} href={`/rounds/${round.roundId}`}>
                <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-sm text-gray-500">Round</div>
                          <div className="text-2xl font-bold text-primary">{round.roundId}</div>
                        </div>

                        <div className="border-l border-gray-200 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {round.startTime.toLocaleDateString()} at {round.startTime.toLocaleTimeString()}
                            </span>
                          </div>
                          {round.settled && round.settledAt && (
                            <div className="text-xs text-gray-500">
                              Settled {round.settledAt.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {round.settled ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Settled
                          </Badge>
                        ) : round.isActive ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {rounds.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-border">
          <p className="text-gray-500">No rounds found. Wait for the season to start!</p>
        </div>
      )}
    </div>
  );
}
