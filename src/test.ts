import { FootballDataClient } from './api';

async function main(): Promise<void> {
  const client = new FootballDataClient();

  const standings = await client.getStandings();
  console.log('Standings groups:', standings.length);

  const matches = await client.getFinishedMatches();
  console.log(`Finished match count: ${matches.length}`);
  if (matches.length > 0) {
    console.log('First match:', JSON.stringify(matches[0], null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
