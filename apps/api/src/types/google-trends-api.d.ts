declare module 'google-trends-api' {
  export function dailyTrends(options: {
    geo?: string;
    trendDate?: Date;
    hl?: string;
  }): Promise<string>;

  export function realTimeTrends(options: {
    geo?: string;
    category?: string;
    hl?: string;
  }): Promise<string>;

  export function interestOverTime(options: {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    granularTimeResolution?: boolean;
    property?: string;
  }): Promise<string>;

  export function interestByRegion(options: {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    resolution?: 'COUNTRY' | 'REGION' | 'CITY' | 'DMA';
    hl?: string;
  }): Promise<string>;

  export function relatedQueries(options: {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
  }): Promise<string>;

  export function relatedTopics(options: {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
  }): Promise<string>;

  export function autoComplete(options: {
    keyword: string;
    hl?: string;
  }): Promise<string>;
}
