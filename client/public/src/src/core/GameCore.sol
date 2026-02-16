// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Constants.sol";

/**
 * @title GameCore
 * @notice Core game management with Chainlink VRF v2.5 randomness
 * @dev Manages seasons, rounds, matches, teams with provably fair results
 *
 * Features:
 * - Chainlink VRF v2.5 subscription-based randomness
 * - 20 teams, 10 matches per round, 38 rounds per season
 * - Emergency settlement if VRF fails
 * - Auto-seeding integration with BettingCore
 */
contract GameCore is VRFConsumerBaseV2Plus {
    // ============ VRF Configuration ============

    LinkTokenInterface public immutable linkToken;

    /// @notice VRF subscription ID
    uint256 public s_subscriptionId;

    /// @notice VRF key hash (gas lane)
    bytes32 public keyHash;

    /// @notice VRF callback gas limit
    uint32 public callbackGasLimit;

    /// @notice VRF request confirmations
    uint16 public requestConfirmations;

    /// @notice Number of random words (1 per match)
    uint32 public numWords;

    /// @notice VRF timeout for emergency settlement
    uint256 public constant VRF_TIMEOUT = 2 hours;

    /// @notice VRF re-request cooldown (time before allowing another request)
    uint256 public constant VRF_REREQUEST_COOLDOWN = 15 minutes;

    // ============ Game Constants ============

    uint256 public constant TEAMS_COUNT = 20;
    uint256 public constant MATCHES_PER_ROUND = 10;
    uint256 public constant ROUNDS_PER_SEASON = 38;
    uint256 public constant ROUND_DURATION = 3 hours; // Default duration

    // ============ Configurable Parameters ============

    /// @notice Configurable round duration (can be changed by owner)
    uint256 public roundDuration = ROUND_DURATION; // Starts with default 3 hours

    // ============ Enums ============

    enum MatchOutcome {
        PENDING,
        HOME_WIN,
        AWAY_WIN,
        DRAW
    }

    // ============ Structs ============

    struct Team {
        string name;
        uint256 wins;
        uint256 draws;
        uint256 losses;
        uint256 points;
        uint256 goalsFor;
        uint256 goalsAgainst;
    }

    struct Match {
        uint8 homeTeamId;
        uint8 awayTeamId;
        uint8 homeScore;
        uint8 awayScore;
        MatchOutcome outcome;
        bool settled;
    }

    struct Round {
        uint256 roundId;
        uint256 seasonId;
        uint256 startTime;
        uint256 endTime;
        uint256 vrfRequestId;
        bool resultsRequested;
        bool settled;
    }

    struct Season {
        uint256 seasonId;
        uint256 startTime;
        uint256 currentRound;
        uint256 totalRounds;
        bool active;
        bool completed;
        uint256 winningTeamId;
    }

    struct VRFRequest {
        bool exists;
        bool fulfilled;
        uint256 roundId;
    }

    // ============ State ============

    /// @notice Current season
    Season public currentSeason;

    /// @notice Total seasons played
    uint256 public totalSeasons;

    /// @notice Teams array
    Team[TEAMS_COUNT] public teams;

    /// @notice Round data: roundId => Round
    mapping(uint256 => Round) public rounds;

    /// @notice Match data: roundId => matchIndex => Match
    mapping(uint256 => mapping(uint256 => Match)) public matches;

    /// @notice Season standings: seasonId => teamId => Team
    mapping(uint256 => mapping(uint256 => Team)) public seasonStandings;

    /// @notice VRF requests: requestId => VRFRequest
    mapping(uint256 => VRFRequest) public vrfRequests;

    /// @notice VRF request time for timeout: roundId => timestamp
    mapping(uint256 => uint256) public roundVRFRequestTime;

    /// @notice Authorized betting contracts
    mapping(address => bool) public authorizedBettingContracts;

    /// @notice Betting core contract for auto-seeding
    address public bettingCore;

    /// @notice Track if round has been seeded by BettingCore
    mapping(uint256 => bool) public roundSeededByBetting;

    /// @notice Cached results in uint8 format for easy access
    mapping(uint256 => uint8[10]) public roundResults;

    // ============ Events ============

    event SeasonStarted(uint256 indexed seasonId, uint256 startTime);
    event SeasonCompleted(uint256 indexed seasonId, uint256 winningTeamId);
    event RoundStarted(uint256 indexed seasonId, uint256 indexed roundId, uint256 startTime);
    event RoundSettled(uint256 indexed seasonId, uint256 indexed roundId);
    event RoundDurationUpdated(uint256 newDuration);
    event MatchSettled(
        uint256 indexed roundId,
        uint256 matchIndex,
        uint8 homeTeamId,
        uint8 awayTeamId,
        uint8 homeScore,
        uint8 awayScore,
        MatchOutcome outcome
    );
    event VRFRequested(uint256 indexed roundId, uint256 requestId);
    event VRFReRequested(uint256 indexed roundId, uint256 oldRequestId, uint256 newRequestId);
    event VRFFulfilled(uint256 indexed requestId, uint256 indexed roundId);
    event EmergencySettlement(uint256 indexed roundId);

    // ============ Errors ============

    error SeasonAlreadyActive();
    error NoActiveSeason();
    error PreviousRoundNotSettled();
    error SeasonComplete();
    error RoundAlreadySettled();
    error RoundDurationNotElapsed();
    error VRFNotRequested();
    error VRFTimeoutNotReached();
    error InvalidMatchIndex();
    error InvalidTeamId();
    error Unauthorized();

    // ============ Modifiers ============

    modifier onlyAuthorized() {
        if (!authorizedBettingContracts[msg.sender] && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }

    modifier seasonActive() {
        if (!currentSeason.active) revert NoActiveSeason();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Constructor
     * @param _linkAddress LINK token address
     * @param _vrfCoordinator VRF Coordinator address
     * @param _subscriptionId VRF subscription ID
     * @param _keyHash VRF key hash (gas lane)
     * @param _callbackGasLimit VRF callback gas limit
     * @param _requestConfirmations VRF request confirmations
     * @param _numWords Number of random words per request
     */
    constructor(
        address _linkAddress,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        uint32 _numWords
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        linkToken = LinkTokenInterface(_linkAddress);
        s_subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        numWords = _numWords;
        _initializeTeams();
    }

    // ============ Season Management ============

    /**
     * @notice Start a new season
     * @return seasonId The new season ID
     */
    function startSeason() external onlyOwner returns (uint256 seasonId) {
        if (totalSeasons > 0 && currentSeason.active) {
            revert SeasonAlreadyActive();
        }

        totalSeasons++;
        seasonId = totalSeasons;

        currentSeason = Season({
            seasonId: seasonId,
            startTime: block.timestamp,
            currentRound: 0,
            totalRounds: ROUNDS_PER_SEASON,
            active: true,
            completed: false,
            winningTeamId: 0
        });

        // Reset standings for new season
        _resetSeasonStandings(seasonId);

        emit SeasonStarted(seasonId, block.timestamp);
    }

    /**
     * @notice Complete the current season manually
     */
    function completeSeason() external onlyOwner seasonActive {
        _endSeason(currentSeason.seasonId);
    }

    // ============ Round Management ============

    /**
     * @notice Start a new round
     * @return roundId The new round ID
     */
    function startRound() external onlyOwner seasonActive returns (uint256 roundId) {
        // Check previous round settled
        if (currentSeason.currentRound > 0) {
            Round storage prevRound = rounds[currentSeason.currentRound];
            if (!prevRound.settled) revert PreviousRoundNotSettled();
        }

        // Check season not complete
        if (currentSeason.currentRound >= ROUNDS_PER_SEASON) {
            revert SeasonComplete();
        }

        currentSeason.currentRound++;
        roundId = currentSeason.currentRound;

        // Create round (use configurable duration)
        rounds[roundId] = Round({
            roundId: roundId,
            seasonId: currentSeason.seasonId,
            startTime: block.timestamp,
            endTime: block.timestamp + roundDuration,
            vrfRequestId: 0,
            resultsRequested: false,
            settled: false
        });

        // Generate matches
        _generateMatches(roundId);

        emit RoundStarted(currentSeason.seasonId, roundId, block.timestamp);

        // Auto-seed betting pools if configured
        if (bettingCore != address(0)) {
            try IBettingCore(bettingCore).seedRound(roundId) {} catch {}
        }
    }

    /**
     * @notice Get current round ID
     */
    function getCurrentRound() external view returns (uint256) {
        return currentSeason.currentRound;
    }

    /**
     * @notice Get current season ID
     */
    function getCurrentSeason() external view returns (uint256) {
        return currentSeason.seasonId;
    }

    // ============ VRF Functions ============

    /**
     * @notice Request VRF randomness for match results
     * @param enableNativePayment Use native ETH instead of LINK
     * @return requestId VRF request ID
     * @dev Can be called multiple times if previous request hasn't been fulfilled after cooldown period
     */
    function requestMatchResults(bool enableNativePayment) external onlyOwner returns (uint256 requestId) {
        uint256 roundId = currentSeason.currentRound;
        Round storage round = rounds[roundId];

        if (round.settled) revert RoundAlreadySettled();
        if (block.timestamp < round.endTime) revert RoundDurationNotElapsed();

        // Allow re-requesting if previous request hasn't been fulfilled and cooldown has passed
        if (round.resultsRequested) {
            uint256 previousRequestId = round.vrfRequestId;
            VRFRequest storage previousRequest = vrfRequests[previousRequestId];

            // If previous request was fulfilled, can't request again (round should be settled)
            require(!previousRequest.fulfilled, "VRF already fulfilled");

            // Must wait cooldown period before re-requesting
            require(
                block.timestamp >= roundVRFRequestTime[roundId] + VRF_REREQUEST_COOLDOWN,
                "VRF cooldown not elapsed"
            );
        }

        // Request random words
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: enableNativePayment})
                )
            })
        );

        // Store new request
        vrfRequests[requestId] = VRFRequest({
            exists: true,
            fulfilled: false,
            roundId: roundId
        });

        // Check if this is a re-request
        bool isReRequest = round.resultsRequested;
        uint256 oldRequestId = round.vrfRequestId;

        round.vrfRequestId = requestId;
        round.resultsRequested = true;
        roundVRFRequestTime[roundId] = block.timestamp;

        if (isReRequest) {
            emit VRFReRequested(roundId, oldRequestId, requestId);
        } else {
            emit VRFRequested(roundId, requestId);
        }
    }

    /**
     * @notice VRF callback - settle match results
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        VRFRequest storage request = vrfRequests[requestId];
        require(request.exists, "Invalid request");
        require(!request.fulfilled, "Already fulfilled");

        uint256 roundId = request.roundId;
        Round storage round = rounds[roundId];
        require(!round.settled, "Round already settled");

        // M-04 FIX: Verify round belongs to current season (prevent settling stale rounds from old seasons)
        require(round.seasonId == currentSeason.seasonId, "Round from different season");

        request.fulfilled = true;

        // Settle each match and store results
        for (uint256 i = 0; i < MATCHES_PER_ROUND; i++) {
            _settleMatch(roundId, i, randomWords[i]);
            // Store result as uint8 (1=HOME_WIN, 2=AWAY_WIN, 3=DRAW)
            roundResults[roundId][i] = uint8(matches[roundId][i].outcome);
        }

        round.settled = true;

        emit VRFFulfilled(requestId, roundId);
        emit RoundSettled(currentSeason.seasonId, roundId);

        // Auto-settle in BettingCore if configured
        // CRITICAL: No try-catch - let it revert if settlement fails
        if (bettingCore != address(0)) {
            IBettingCore(bettingCore).settleRound(roundId, roundResults[roundId]);
        }

        // Check season completion
        if (currentSeason.currentRound >= ROUNDS_PER_SEASON) {
            _endSeason(currentSeason.seasonId);
        }
    }

    /**
     * @notice Emergency settlement if VRF fails
     * @param roundId Round to settle
     * @param seed Seed for pseudo-random generation
     */
    function emergencySettleRound(uint256 roundId, uint256 seed) external onlyOwner {
        Round storage round = rounds[roundId];

        if (round.settled) revert RoundAlreadySettled();
        if (roundVRFRequestTime[roundId] == 0) revert VRFNotRequested();
        if (block.timestamp < roundVRFRequestTime[roundId] + VRF_TIMEOUT) {
            revert VRFTimeoutNotReached();
        }

        // Generate pseudo-random results
        for (uint256 i = 0; i < MATCHES_PER_ROUND; i++) {
            uint256 randomWord = uint256(keccak256(abi.encodePacked(
                seed,
                block.prevrandao,
                block.timestamp,
                roundId,
                i
            )));
            _settleMatch(roundId, i, randomWord);
        }

        round.settled = true;

        emit EmergencySettlement(roundId);
        emit RoundSettled(currentSeason.seasonId, roundId);

        // Auto-settle in BettingCore if configured
        // CRITICAL: No try-catch - let it revert if settlement fails
        if (bettingCore != address(0)) {
            IBettingCore(bettingCore).settleRound(roundId, roundResults[roundId]);
        }

        // Check season completion
        if (currentSeason.currentRound >= ROUNDS_PER_SEASON) {
            _endSeason(currentSeason.seasonId);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get match info
     */
    function getMatch(
        uint256 roundId,
        uint256 matchIndex
    ) external view returns (Match memory) {
        if (matchIndex >= MATCHES_PER_ROUND) revert InvalidMatchIndex();
        return matches[roundId][matchIndex];
    }

    /**
     * @notice Get all matches for a round
     */
    function getRoundMatches(uint256 roundId) external view returns (Match[] memory result) {
        result = new Match[](MATCHES_PER_ROUND);
        for (uint256 i = 0; i < MATCHES_PER_ROUND; i++) {
            result[i] = matches[roundId][i];
        }
    }

    /**
     * @notice Get match results array (for betting settlement)
     */
    function getResults(uint256 roundId) external view returns (uint8[10] memory results) {
        return _getResults(roundId);
    }

    /**
     * @notice Internal function to get match results
     */
    function _getResults(uint256 roundId) internal view returns (uint8[10] memory results) {
        for (uint256 i = 0; i < MATCHES_PER_ROUND; i++) {
            Match storage m = matches[roundId][i];
            if (m.outcome == MatchOutcome.HOME_WIN) results[i] = 1;
            else if (m.outcome == MatchOutcome.AWAY_WIN) results[i] = 2;
            else if (m.outcome == MatchOutcome.DRAW) results[i] = 3;
            else results[i] = 0;
        }
    }

    /**
     * @notice Check if round is settled
     */
    function isRoundSettled(uint256 roundId) external view returns (bool) {
        return rounds[roundId].settled;
    }

    /**
     * @notice Get VRF request status for a round
     * @param roundId Round ID to check
     * @return requested Whether VRF was requested
     * @return fulfilled Whether VRF was fulfilled
     * @return canReRequest Whether VRF can be re-requested (cooldown elapsed)
     * @return requestTime Timestamp of last VRF request
     */
    function getVRFStatus(uint256 roundId) external view returns (
        bool requested,
        bool fulfilled,
        bool canReRequest,
        uint256 requestTime
    ) {
        Round storage round = rounds[roundId];
        requested = round.resultsRequested;
        requestTime = roundVRFRequestTime[roundId];

        if (requested && round.vrfRequestId != 0) {
            VRFRequest storage request = vrfRequests[round.vrfRequestId];
            fulfilled = request.fulfilled;

            // Can re-request if not fulfilled and cooldown has passed
            canReRequest = !fulfilled &&
                           !round.settled &&
                           block.timestamp >= requestTime + VRF_REREQUEST_COOLDOWN;
        }
    }

    /**
     * @notice Mark round as seeded by BettingCore (callback)
     * @param roundId Round ID that was seeded
     */
    function markRoundSeeded(uint256 roundId) external {
        require(msg.sender == bettingCore, "Only BettingCore");
        require(rounds[roundId].startTime > 0, "Round not started");
        require(!roundSeededByBetting[roundId], "Already seeded");

        roundSeededByBetting[roundId] = true;
    }

    /**
     * @notice Get match results for a settled round (cached uint8 array)
     * @param roundId Round ID to query
     * @return results Array of match outcomes (1=HOME_WIN, 2=AWAY_WIN, 3=DRAW)
     */
    function getMatchResults(uint256 roundId) external view returns (uint8[10] memory) {
        require(rounds[roundId].settled, "Round not settled");
        return roundResults[roundId];
    }

    /**
     * @notice Get betting window end time for a round
     * @param roundId Round ID to query
     * @return Timestamp when betting closes (30 minutes before round end)
     */
    function getBettingWindowEnd(uint256 roundId) external view returns (uint256) {
        Round storage round = rounds[roundId];
        require(round.startTime > 0, "Round not started");
        return round.endTime - 30 minutes;
    }

    /**
     * @notice Check if betting is allowed for a round
     * @param roundId Round ID to check
     * @return True if round is seeded, not settled, and within betting window
     */
    function isBettingAllowed(uint256 roundId) external view returns (bool) {
        Round storage round = rounds[roundId];
        return roundSeededByBetting[roundId] &&
               !round.settled &&
               block.timestamp <= (round.endTime - 30 minutes);
    }

    /**
     * @notice Get team info
     */
    function getTeam(uint8 teamId) external view returns (Team memory) {
        if (teamId >= TEAMS_COUNT) revert InvalidTeamId();
        return teams[teamId];
    }

    /**
     * @notice Get season standings for a team
     */
    function getTeamStanding(
        uint256 seasonId,
        uint8 teamId
    ) external view returns (Team memory) {
        return seasonStandings[seasonId][teamId];
    }

    /**
     * @notice Get all season standings
     */
    function getSeasonStandings(uint256 seasonId) external view returns (Team[] memory result) {
        result = new Team[](TEAMS_COUNT);
        for (uint256 i = 0; i < TEAMS_COUNT; i++) {
            result[i] = seasonStandings[seasonId][i];
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Set betting core for auto-seeding
     */
    function setBettingCore(address _bettingCore) external onlyOwner {
        bettingCore = _bettingCore;
    }

    /**
     * @notice Authorize a betting contract
     */
    function setAuthorizedBettingContract(address betting, bool authorized) external onlyOwner {
        authorizedBettingContracts[betting] = authorized;
    }

    /**
     * @notice Set round duration
     * @param _duration New round duration in seconds
     * @dev Duration must be between 1 hour and 7 days for safety
     */
    function setRoundDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 hours, "Duration too short");
        require(_duration <= 7 days, "Duration too long");
        roundDuration = _duration;
        emit RoundDurationUpdated(_duration);
    }

    /**
     * @notice Update VRF configuration
     */
    function updateVRFConfig(
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        bytes32 _keyHash
    ) external onlyOwner {
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        keyHash = _keyHash;
    }

    /**
     * @notice Withdraw LINK tokens
     */
    function withdrawLink() external onlyOwner {
        uint256 balance = linkToken.balanceOf(address(this));
        require(linkToken.transfer(owner(), balance), "Transfer failed");
    }

    /**
     * @notice Withdraw native ETH
     */
    function withdrawNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    // ============ Internal Functions ============

    function _initializeTeams() private {
        teams[0] = Team("Manchester City", 0, 0, 0, 0, 0, 0);
        teams[1] = Team("Liverpool", 0, 0, 0, 0, 0, 0);
        teams[2] = Team("Arsenal", 0, 0, 0, 0, 0, 0);
        teams[3] = Team("Chelsea", 0, 0, 0, 0, 0, 0);
        teams[4] = Team("Manchester United", 0, 0, 0, 0, 0, 0);
        teams[5] = Team("Tottenham", 0, 0, 0, 0, 0, 0);
        teams[6] = Team("Newcastle", 0, 0, 0, 0, 0, 0);
        teams[7] = Team("Brighton", 0, 0, 0, 0, 0, 0);
        teams[8] = Team("Aston Villa", 0, 0, 0, 0, 0, 0);
        teams[9] = Team("West Ham", 0, 0, 0, 0, 0, 0);
        teams[10] = Team("Crystal Palace", 0, 0, 0, 0, 0, 0);
        teams[11] = Team("Fulham", 0, 0, 0, 0, 0, 0);
        teams[12] = Team("Brentford", 0, 0, 0, 0, 0, 0);
        teams[13] = Team("Wolves", 0, 0, 0, 0, 0, 0);
        teams[14] = Team("Nottingham Forest", 0, 0, 0, 0, 0, 0);
        teams[15] = Team("Bournemouth", 0, 0, 0, 0, 0, 0);
        teams[16] = Team("Everton", 0, 0, 0, 0, 0, 0);
        teams[17] = Team("Leicester", 0, 0, 0, 0, 0, 0);
        teams[18] = Team("Ipswich", 0, 0, 0, 0, 0, 0);
        teams[19] = Team("Southampton", 0, 0, 0, 0, 0, 0);
    }

    function _resetSeasonStandings(uint256 seasonId) private {
        for (uint256 i = 0; i < TEAMS_COUNT; i++) {
            seasonStandings[seasonId][i] = Team({
                name: teams[i].name,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0
            });
        }
    }

    function _generateMatches(uint256 roundId) private {
        // Shuffle teams for random pairings
        uint256[] memory shuffled = _shuffleTeams(roundId);

        for (uint256 i = 0; i < MATCHES_PER_ROUND; i++) {
            matches[roundId][i] = Match({
                homeTeamId: uint8(shuffled[i * 2]),
                awayTeamId: uint8(shuffled[i * 2 + 1]),
                homeScore: 0,
                awayScore: 0,
                outcome: MatchOutcome.PENDING,
                settled: false
            });
        }
    }

    function _shuffleTeams(uint256 seed) private pure returns (uint256[] memory) {
        uint256[] memory teamIds = new uint256[](TEAMS_COUNT);
        for (uint256 i = 0; i < TEAMS_COUNT; i++) {
            teamIds[i] = i;
        }

        // Fisher-Yates shuffle
        for (uint256 i = TEAMS_COUNT - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encodePacked(seed, i))) % (i + 1);
            (teamIds[i], teamIds[j]) = (teamIds[j], teamIds[i]);
        }

        return teamIds;
    }

    function _settleMatch(uint256 roundId, uint256 matchIndex, uint256 randomWord) private {
        Match storage m = matches[roundId][matchIndex];

        // Generate scores
        m.homeScore = _generateScore(randomWord);
        m.awayScore = _generateScore(uint256(keccak256(abi.encodePacked(randomWord, matchIndex))));
        m.settled = true;

        // Determine outcome
        if (m.homeScore > m.awayScore) {
            m.outcome = MatchOutcome.HOME_WIN;
        } else if (m.awayScore > m.homeScore) {
            m.outcome = MatchOutcome.AWAY_WIN;
        } else {
            m.outcome = MatchOutcome.DRAW;
        }

        // Update standings
        _updateStandings(currentSeason.seasonId, m);

        emit MatchSettled(
            roundId,
            matchIndex,
            m.homeTeamId,
            m.awayTeamId,
            m.homeScore,
            m.awayScore,
            m.outcome
        );
    }

    function _generateScore(uint256 randomWord) private pure returns (uint8) {
        uint256 roll = randomWord % 100;

        // Weighted probabilities for realistic scores
        if (roll < 15) return 0;  // 15%
        if (roll < 40) return 1;  // 25%
        if (roll < 65) return 2;  // 25%
        if (roll < 82) return 3;  // 17%
        if (roll < 93) return 4;  // 11%
        return 5;                  // 7%
    }

    function _updateStandings(uint256 seasonId, Match memory m) private {
        Team storage homeTeam = seasonStandings[seasonId][m.homeTeamId];
        Team storage awayTeam = seasonStandings[seasonId][m.awayTeamId];

        homeTeam.goalsFor += m.homeScore;
        homeTeam.goalsAgainst += m.awayScore;
        awayTeam.goalsFor += m.awayScore;
        awayTeam.goalsAgainst += m.homeScore;

        if (m.outcome == MatchOutcome.HOME_WIN) {
            homeTeam.wins++;
            homeTeam.points += 3;
            awayTeam.losses++;
        } else if (m.outcome == MatchOutcome.AWAY_WIN) {
            awayTeam.wins++;
            awayTeam.points += 3;
            homeTeam.losses++;
        } else {
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points++;
            awayTeam.points++;
        }
    }

    function _endSeason(uint256 seasonId) private {
        currentSeason.active = false;
        currentSeason.completed = true;

        // Find winner (most points)
        uint256 winningTeamId = 0;
        uint256 maxPoints = 0;

        for (uint256 i = 0; i < TEAMS_COUNT; i++) {
            if (seasonStandings[seasonId][i].points > maxPoints) {
                maxPoints = seasonStandings[seasonId][i].points;
                winningTeamId = i;
            }
        }

        currentSeason.winningTeamId = winningTeamId;

        emit SeasonCompleted(seasonId, winningTeamId);
    }

    // Allow receiving ETH for VRF payments
    receive() external payable {}
}

/**
 * @notice Interface for BettingCore integration
 */
interface IBettingCore {
    function seedRound(uint256 roundId) external;
    function settleRound(uint256 roundId, uint8[10] calldata results) external;
}
