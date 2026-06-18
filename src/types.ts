export type ActorMode = 'live' | 'match' | 'standings' | 'full';

export interface ActorInput {
  mode: ActorMode;
  matchId?: number;
  teamId?: number;
  footballDataApiKey?: string;
}

export interface TeamRef {
  id: number;
  name: string;
  code: string;
  crest?: string;
}

export interface Goal {
  minute: number;
  type: string;
  team: 'home' | 'away';
  player: string;
  assist: string | null;
}

export interface Booking {
  minute: number;
  team: 'home' | 'away';
  player: string;
  card: 'YELLOW' | 'RED' | 'YELLOW_RED';
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group?: string;
  matchday: number | null;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeScore: number | null;
  awayScore: number | null;
  halfTimeHomeScore: number | null;
  halfTimeAwayScore: number | null;
  goals: Goal[];
  bookings: Booking[];
  venue: string | null;
  stats: null;
}

export interface StandingsRow {
  group: string;
  position: number;
  team: TeamRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface ActorOutput {
  fetchedAt: string;
  mode: ActorMode;
  matches?: Match[];
  standings?: StandingsRow[];
}

// football-data.org v4 raw response shapes

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDScore {
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface FDGoal {
  minute: number;
  type: string;
  team: { id: number; name: string };
  scorer: { id: number; name: string } | null;
  assist: { id: number; name: string } | null;
}

export interface FDBooking {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string } | null;
  card: 'YELLOW' | 'RED' | 'YELLOW_RED';
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED';
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
  goals: FDGoal[];
  bookings: FDBooking[];
  venue: string | null;
  referees: unknown[];
}

export interface FDMatchesResponse {
  count: number;
  matches: FDMatch[];
}

export interface FDStandingEntry {
  position: number;
  team: FDTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface FDStandingGroup {
  type: string;
  group: string | null;
  table: FDStandingEntry[];
}

export interface FDStandingsResponse {
  standings: FDStandingGroup[];
}
