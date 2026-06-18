import axios, { AxiosInstance } from 'axios';
import { FDMatch, FDMatchesResponse, FDStandingGroup, FDStandingsResponse } from './types';

const BASE_URL = 'https://api.football-data.org/v4';
const THROTTLE_MS = 6_000;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class FootballDataClient {
  private readonly http: AxiosInstance;
  private lastRequestAt = 0;

  constructor(apiKey?: string) {
    const key =
      apiKey ||
      process.env['FOOTBALL_DATA_API_KEY'] ||
      'a64512ea36fa4b1db4cfa542b9b4d399';

    this.http = axios.create({
      baseURL: BASE_URL,
      headers: { 'X-Auth-Token': key },
      timeout: 10_000,
    });
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (this.lastRequestAt > 0 && elapsed < THROTTLE_MS) {
      await sleep(THROTTLE_MS - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  private async get<T>(path: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      await this.throttle();
      try {
        const response = await this.http.get<T>(path);
        return response.data;
      } catch (error) {
        lastError = error as Error;
        const status = (error as { response?: { status: number } }).response?.status;
        if (status === 429) {
          // Rate limited — wait an extra cycle before retry
          await sleep(THROTTLE_MS);
        } else if (status !== undefined && status < 500) {
          // 4xx (except 429) — no point retrying
          break;
        }
      }
    }

    throw new Error(
      `football-data.org request failed after ${MAX_RETRIES} attempts: ${lastError?.message ?? 'unknown error'}`,
    );
  }

  async getFinishedMatches(): Promise<FDMatch[]> {
    const data = await this.get<FDMatchesResponse>('/competitions/WC/matches?status=FINISHED');
    return data.matches ?? [];
  }

  async getLiveMatches(): Promise<FDMatch[]> {
    const data = await this.get<FDMatchesResponse>('/competitions/WC/matches?status=IN_PLAY');
    return data.matches ?? [];
  }

  async getMatch(id: number): Promise<FDMatch> {
    return this.get<FDMatch>(`/competitions/WC/matches/${id}`);
  }

  async getStandings(): Promise<FDStandingGroup[]> {
    const data = await this.get<FDStandingsResponse>('/competitions/WC/standings');
    return data.standings ?? [];
  }
}
