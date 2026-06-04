/**
 * Types & Domain Models for MeliPro Enterprise Solution Workspace
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthState {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  authUrl: string;
  authCode: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
  accounts: Array<{ sellerId: string; nickname: string; status: string }>;
  logs: string[];
  step: 'config' | 'authorized' | 'token_exchanged' | 'established';
}

export interface WebhookEvent {
  id: string;
  topic: 'orders' | 'items' | 'questions' | 'claims' | 'messages';
  resource: string;
  receivedAt: string;
  payload: any;
  status: 'queued' | 'processed' | 'retrying' | 'dlq';
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  processingTimeMs?: number;
}

export interface MarketSearchQuery {
  keyword: string;
  category: string;
  volume: number;
  avgPrice: number;
  ticketMedio: number;
  competitiveness: number; // 0 to 100
  potentialIndex: number;  // 0 to 100
  seasonality: Array<{ month: string; searches: number }>;
  topProducts: Array<{
    id: string;
    title: string;
    sellerNickname: string;
    price: number;
    salesCount: number;
    revenue: number;
    stock: number;
    permalink: string;
  }>;
}

export interface CompetitorProduct {
  id: string;
  sku: string;
  title: string;
  sellerName: string;
  price: number;
  stock: number;
  salesEstimated: number;
  reputation: 'green' | 'light_green' | 'yellow' | 'orange' | 'red';
  ruleId: string;
  lastUpdated: string;
  historyPrice: Array<{ date: string; price: number }>;
}

export interface RepricingRule {
  id: string;
  name: string;
  type: 'below_competitor' | 'maintain_margin' | 'match_competitor';
  offsetValue: number; // R$ offset or % offset
  minMargin: number;   // minimum margin permitted in R$ or %
  maxMargin: number;
  isActive: boolean;
}

export interface RepricingAlert {
  id: string;
  timestamp: string;
  sku: string;
  title: string;
  competitorPrice: number;
  originalPrice: number;
  newPrice: number;
  actionTaken: 'automatic_adjust' | 'alert_sent' | 'below_min_margin_ignored';
  competitorName: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  redisQueueSize: number;
  postgresConnCount: number;
  apiRequestsCount: number;
  rateLimitRemaining: number;
  circuitBreakerStatus: 'closed' | 'open' | 'half_open';
  errorRatePercent: number;
}
