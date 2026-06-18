import { Actor, log } from 'apify';
import { FootballDataClient } from './api';
import { buildOutput, transformMatch, transformStandings } from './transform';
import { ActorInput } from './types';

async function handleLive(client: FootballDataClient): Promise<void> {
  const rawMatches = await client.getLiveMatches();
  log.info(`Found ${rawMatches.length} live match(es).`);

  for (const raw of rawMatches) {
    const match = transformMatch(raw);
    await Actor.pushData(buildOutput('live', { matches: [match] }));
  }
}

async function handleMatch(client: FootballDataClient, matchId: number): Promise<void> {
  const raw = await client.getMatch(matchId);
  const match = transformMatch(raw);
  await Actor.pushData(buildOutput('match', { matches: [match] }));
}

async function handleStandings(client: FootballDataClient): Promise<void> {
  const rawGroups = await client.getStandings();
  const standings = transformStandings(rawGroups);
  log.info(`Found ${standings.length} standings row(s).`);
  await Actor.pushData(buildOutput('standings', { standings }));
}

async function handleFull(client: FootballDataClient, teamId?: number): Promise<void> {
  const rawMatches = await client.getFinishedMatches();

  const filtered = teamId !== undefined
    ? rawMatches.filter((m) => m.homeTeam.id === teamId || m.awayTeam.id === teamId)
    : rawMatches;

  log.info(`Found ${filtered.length} completed match(es).`);

  for (const raw of filtered) {
    const match = transformMatch(raw);
    await Actor.pushData(buildOutput('full', { matches: [match] }));
  }
}

async function main(): Promise<void> {
  await Actor.init();

  try {
    const input = await Actor.getInput<ActorInput>();

    if (!input) {
      throw new Error('No input provided.');
    }

    if (!input.mode) {
      throw new Error('Input is missing required field: mode');
    }

    const client = new FootballDataClient(input.footballDataApiKey);

    switch (input.mode) {
      case 'live': {
        await handleLive(client);
        break;
      }
      case 'match': {
        if (!input.matchId) {
          throw new Error("Input is missing required field 'matchId' for mode 'match'");
        }
        await handleMatch(client, input.matchId);
        break;
      }
      case 'standings': {
        await handleStandings(client);
        break;
      }
      case 'full': {
        await handleFull(client, input.teamId);
        break;
      }
      default: {
        throw new Error(`Unknown mode: ${input.mode}`);
      }
    }

    log.info('Run complete.');
    await Actor.exit();
  } catch (error) {
    const message = (error as Error).message;
    log.error(message);
    await Actor.fail(message);
  }
}

main();
