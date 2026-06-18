import { log } from 'apify';
import {
  ActorOutput,
  Booking,
  FDBooking,
  FDGoal,
  FDMatch,
  FDStandingGroup,
  Goal,
  Match,
  StandingsRow,
  TeamRef,
} from './types';

const STATUS_MAP: Record<string, string> = {
  FINISHED: 'completed',
  IN_PLAY: 'in_progress',
  PAUSED: 'in_progress',
  SCHEDULED: 'scheduled',
  TIMED: 'scheduled',
  SUSPENDED: 'suspended',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
  AWARDED: 'completed',
};

function mapStatus(raw: string): string {
  return STATUS_MAP[raw] ?? 'unknown';
}

/** "GROUP_A" → "A", "GROUP_STAGE" → undefined (not a group letter) */
function mapGroup(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/^GROUP_([A-Z])$/);
  return match ? match[1] : undefined;
}

function mapStage(raw: string): string {
  const stages: Record<string, string> = {
    GROUP_STAGE: 'Group Stage',
    LAST_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter-finals',
    SEMI_FINALS: 'Semi-finals',
    THIRD_PLACE: 'Third Place',
    FINAL: 'Final',
  };
  return stages[raw] ?? raw;
}

function mapTeamRef(team: { id: number; name: string; shortName?: string; tla?: string; crest?: string }): TeamRef {
  return {
    id: team.id,
    name: team.name,
    code: team.tla ?? '',
    crest: team.crest,
  };
}

function mapGoals(goals: FDGoal[], homeId: number): Goal[] {
  return goals.map((g) => ({
    minute: g.minute,
    type: g.type,
    team: g.team.id === homeId ? 'home' : 'away',
    player: g.scorer?.name ?? 'Unknown',
    assist: g.assist?.name ?? null,
  }));
}

function mapBookings(bookings: FDBooking[], homeId: number): Booking[] {
  return bookings.map((b) => ({
    minute: b.minute,
    team: b.team.id === homeId ? 'home' : 'away',
    player: b.player?.name ?? 'Unknown',
    card: b.card,
  }));
}

export function transformMatch(raw: FDMatch): Match {
  try {
    const homeId = raw.homeTeam.id;

    return {
      id: raw.id,
      utcDate: raw.utcDate,
      status: mapStatus(raw.status),
      stage: mapStage(raw.stage),
      ...(mapGroup(raw.group) !== undefined ? { group: mapGroup(raw.group) } : {}),
      matchday: raw.matchday ?? null,
      homeTeam: mapTeamRef(raw.homeTeam),
      awayTeam: mapTeamRef(raw.awayTeam),
      homeScore: raw.score.fullTime.home,
      awayScore: raw.score.fullTime.away,
      halfTimeHomeScore: raw.score.halfTime.home,
      halfTimeAwayScore: raw.score.halfTime.away,
      goals: mapGoals(raw.goals ?? [], homeId),
      bookings: mapBookings(raw.bookings ?? [], homeId),
      venue: raw.venue ?? null,
      stats: null,
    };
  } catch (error) {
    log.warning(`transformMatch: failed to transform match ${raw?.id ?? 'unknown'}: ${(error as Error).message}`);
    return {
      id: raw?.id ?? 0,
      utcDate: raw?.utcDate ?? '',
      status: 'unknown',
      stage: 'Unknown',
      matchday: null,
      homeTeam: { id: raw?.homeTeam?.id ?? 0, name: raw?.homeTeam?.name ?? 'Unknown', code: raw?.homeTeam?.tla ?? '' },
      awayTeam: { id: raw?.awayTeam?.id ?? 0, name: raw?.awayTeam?.name ?? 'Unknown', code: raw?.awayTeam?.tla ?? '' },
      homeScore: null,
      awayScore: null,
      halfTimeHomeScore: null,
      halfTimeAwayScore: null,
      goals: [],
      bookings: [],
      venue: null,
      stats: null,
    };
  }
}

export function transformStandings(rawGroups: FDStandingGroup[]): StandingsRow[] {
  const rows: StandingsRow[] = [];

  for (const group of rawGroups) {
    if (group.type !== 'TOTAL') continue;

    const groupLabel = mapGroup(group.group) ?? group.group ?? 'Unknown';

    for (const entry of group.table ?? []) {
      try {
        rows.push({
          group: groupLabel,
          position: entry.position,
          team: mapTeamRef(entry.team),
          played: entry.playedGames,
          won: entry.won,
          drawn: entry.draw,
          lost: entry.lost,
          goalsFor: entry.goalsFor,
          goalsAgainst: entry.goalsAgainst,
          goalDifference: entry.goalDifference,
          points: entry.points,
        });
      } catch (error) {
        log.warning(`transformStandings: failed to transform entry, skipping: ${(error as Error).message}`);
      }
    }
  }

  return rows;
}

export function buildOutput(mode: ActorOutput['mode'], data: Partial<ActorOutput>): ActorOutput {
  return {
    fetchedAt: new Date().toISOString(),
    mode,
    ...data,
  };
}
