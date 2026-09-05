export interface ErrorResponse {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
  traceId?: string;
  timestampUtc: string;
}
