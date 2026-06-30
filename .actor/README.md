# FIFA World Cup 2026 Stats & Live Scores

Get FIFA World Cup 2026 match data, live scores, goals, bookings, and standings as clean, flat JSON. Built for dashboards, fantasy football apps, and automated trading/betting tools that need structured tournament data without scraping.

## What data you get

- Match info: id, utcDate, status, stage, group, venue, matchday
- Teams: home/away team id, name, code (TLA), crest URL
- Score: full-time and half-time home/away scores
- Goals: minute, type, player, assist, home/away team
- Bookings: minute, card type, player, home/away team
- Standings: group, position, team, played, won, drawn, lost, goals for/against, goal difference, points
- Stats: not available on the free tier — set to null

## Modes

| Mode | Description |
|------|-------------|
| `live` | All in-progress matches with current score and events |
| `standings` | Group stage table |
| `match` | Full detail (score, goals, bookings) for a single match |
| `full` | All completed matches |

## How to use

### 1. Configure input

In the Apify Console, open the actor and fill in the input form (or pass JSON via API):

```json
{
  "footballDataApiKey": "your_key_here",
  "mode": "live"
}
```

For other modes, set `mode` accordingly and add `matchId` (for `match`) or `teamId` (for `full`).

### 2. Run

Click **Start** in the Console, or call the Run API endpoint:

```
POST https://api.apify.com/v2/acts/seralifatih~wc2026-stats/runs?token=YOUR_APIFY_TOKEN
```

Results land in the run's default dataset — one match/standings record per item.

### 3. Filter by team (optional)

Add `teamId` to fetch only completed matches for a specific team:

```json
{ "footballDataApiKey": "your_key_here", "mode": "full", "teamId": 773 }
```

Useful for building single-team dashboards or tracking a specific country through the tournament.

## Example output

```json
{
  "fetchedAt": "2026-06-11T22:05:00Z",
  "mode": "match",
  "matches": [
    {
      "id": 415082,
      "utcDate": "2026-06-11T20:00:00Z",
      "status": "completed",
      "stage": "Group Stage",
      "group": "A",
      "matchday": 1,
      "homeTeam": { "id": 772, "name": "Mexico", "code": "MEX", "crest": "https://..." },
      "awayTeam": { "id": 773, "name": "United States", "code": "USA", "crest": "https://..." },
      "homeScore": 2,
      "awayScore": 1,
      "halfTimeHomeScore": 1,
      "halfTimeAwayScore": 0,
      "goals": [
        { "minute": 23, "type": "REGULAR", "team": "home", "player": "Raúl Jiménez", "assist": null }
      ],
      "bookings": [
        { "minute": 55, "team": "away", "player": "Tyler Adams", "card": "YELLOW" }
      ],
      "venue": "Estadio Azteca",
      "stats": null
    }
  ]
}
```

## Rate limits

football-data.org free tier allows 10 requests per minute. This actor enforces a 6-second delay between API calls to stay within limits.

## Scheduling live scores

For live match days, set up an [Apify Scheduler](https://docs.apify.com/platform/schedules) to run this actor in `live` mode every 2 minutes. Each run pushes only currently in-progress matches with up-to-date scores, so your dataset stays fresh without manual triggers.

Example schedule cron: `*/2 * * * *`

Only activate the scheduler on match days. The World Cup runs June 11 – July 19, 2026.

## Tech stack

Node.js 20, TypeScript, Apify SDK v3, axios. Data sourced from [football-data.org](https://football-data.org) (free tier, requires API key).
