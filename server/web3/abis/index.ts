import GameEngineJSON from "./GameEngine.json"
import BettingPoolJSON from "./BettingPoolV2_1.json"
import LiquidityPoolJSON from "./LiquidityPoolV2.json"
import LeagueTokenJSON from "./LeagueToken.json"
import SeasonPredictorJSON from "./SeasonPredictorV2.json"

export const GameEngineABI = GameEngineJSON.abi
export const BettingPoolABI = BettingPoolJSON.abi
export const LiquidityPoolABI = LiquidityPoolJSON.abi
export const LeagueTokenABI = LeagueTokenJSON
export const SeasonPredictorABI = SeasonPredictorJSON.abi

export type { Abi } from "viem"
