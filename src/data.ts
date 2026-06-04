/**
 * Enterprise Static Specifications, Code Snippets and Mock Datasets
 */

import { CompetitorProduct } from './types';

// -------------------------------------------------------------
// SECURE CODE TEMPLATES & ARCHITECTURE PLANS FOR MELLI PRO
// -------------------------------------------------------------

export const POSTGRESQL_SCHEMA_SQL = `-- SCHEMA ENTERPRISE - PLATAFORMA DE AUTOMAÇÃO MERCADO LIVRE
-- Principais tabelas para persistência durável, alta integridade e auditoria completa

-- 1. Tabela de Contas Conectadas Mercado Livre (OAuth)
CREATE TABLE meli_seller_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id VARCHAR(50) NOT NULL UNIQUE,
    nickname VARCHAR(100) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT[] NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meli_seller_expires ON meli_seller_accounts(expires_at);

-- 2. Tabela de Anúncios / Produtos Sincronizados
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY, -- ID Meli (ex: MLB123456789)
    seller_id VARCHAR(50) NOT NULL REFERENCES meli_seller_accounts(seller_id),
    title TEXT NOT NULL,
    sku VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    currency_id VARCHAR(10) DEFAULT 'BRL',
    available_quantity INTEGER NOT NULL DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    permalink TEXT,
    thumbnail TEXT,
    catalogue_id VARCHAR(50),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_seller ON products(seller_id);

-- 3. Tabela de Concorrentes Monitorados
CREATE TABLE competitor_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id VARCHAR(50) NOT NULL,
    internal_sku VARCHAR(100) NOT NULL,
    competitor_meli_id VARCHAR(50) NOT NULL, -- ID do anúncio dele
    competitor_title TEXT NOT NULL,
    competitor_nickname VARCHAR(100) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    reputation VARCHAR(20),
    rule_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comp_sku_seller ON competitor_tracking(seller_id, internal_sku);

-- 4. Tabela de Regras de Precificação Dinâmica (Repricer)
CREATE TABLE repricer_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('below_competitor', 'match_competitor', 'margin_based')),
    offset_value DECIMAL(10, 2) NOT NULL, -- Ex: -1.50 para cobrir preço por 1,50
    min_margin_percent DECIMAL(5, 2) NOT NULL, -- Margem segura mínima
    max_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Auditoria de Reprecificações (Histórico Temporal)
CREATE TABLE pricing_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    sku VARCHAR(100),
    competitor_product_id VARCHAR(50),
    original_price DECIMAL(10, 2) NOT NULL,
    suggested_price DECIMAL(10, 2) NOT NULL,
    actual_new_price DECIMAL(10, 2) NOT NULL,
    action_status VARCHAR(40) NOT NULL, -- 'applied_automatically', 'manual_pending', 'safety_block'
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Auditoria e Idempotência de Webhooks
CREATE TABLE webhook_processing_log (
    id VARCHAR(100) PRIMARY KEY, -- Idempotency Key (ex: x-payload-hash ou event_id)
    topic VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payload JSONB NOT NULL,
    processing_status VARCHAR(20) NOT NULL CHECK (processing_status IN ('queued', 'processed', 'failed', 'dlq')),
    attempts INTEGER DEFAULT 1,
    last_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_status ON webhook_processing_log(processing_status);
`;

export const TS_OAUTH_FLOW_TS = `/**
 * SERVIÇO ENTERPRISE DE AUTENTICAÇÃO OAUTH 2.0 COM PKCE E RATE LIMITING
 * Caminho conceitual sugerido: /src/services/meli-auth.ts
 */

import crypto from 'crypto';
import axios from 'axios';

// 1. Geração de PKCE robusta no Server-side
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

export interface MeliTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sellerId: string;
  scope: string[];
}

/**
 * Enterprise Service para gerenciamento de credenciais Meli
 */
export class MeliAccountService {
  private encryptionKey: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_SECRET_KEY;
    if (!secret) {
      throw new Error("ENCRYPTION_SECRET_KEY é obrigatória no ambiente.");
    }
    this.encryptionKey = crypto.scryptSync(secret, 'salt-meli', 32);
  }

  // Criptografa o token utilizando AES-256-GCM para conformidade LGPD
  public encryptToken(token: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    return \`\${iv.toString('hex')}:\${encrypted}:\${tag}\`;
  }

  // Descriptografa o token de forma segura
  public decryptToken(encryptedData: string): string {
    const [ivHex, encrypted, tagHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Executa a troca do Authorization Code pelo Access Token aplicando PKCE
   */
  public async exchangeCode(
    authCode: string,
    codeVerifier: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<MeliTokenSet> {
    const url = 'https://api.mercadolibre.com/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    try {
      // Implementa requisição tolerante com timeout e headers limpos
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 8000
      });

      const data = response.data;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        sellerId: String(data.user_id),
        scope: data.scope.split(' ')
      };
    } catch (error: any) {
      console.error("Erro na troca do OAuth Code:", error.response?.data || error.message);
      throw new Error(\`Falha na autenticação Mercado Livre: \${error.response?.data?.message || 'Timeout'}\`);
    }
  }

  /**
   * Renovação Automática do Refresh Token (Background Worker)
   */
  public async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<MeliTokenSet> {
    const url = 'https://api.mercadolibre.com/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    });

    const response = await axios.post(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      sellerId: String(response.data.user_id),
      scope: response.data.scope.split(' ')
    };
  }
}
`;

export const TS_HTTP_RESILIENCY_TS = `/**
 * ESTRATÉGIA DE RESILIÊNCIA ENTERPRISE: CIRCUIT BREAKER + EXPONENTIAL BACKOFF
 * Utilizado para chamadas seguras nas APIs do Mercado Livre sujeitas a Rate Limits severos
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ResilientRequestConfig {
  retries?: number;
  initialDelayMs?: number;
  factor?: number;
}

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class MeliResilientHttpClient {
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private readonly failureThreshold = 5; // Abre circuito com 5 falhas seguidas
  private readonly recoveryTimeMs = 30000; // Tempo em OPEN antes de HALF_OPEN (30s)
  private nextAttemptTime = 0;

  constructor(private api: AxiosInstance) {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Registra métricas de Rate limit retornadas pelo Mercado Livre nos Headers
    this.api.interceptors.response.use(
      (response) => {
        const rateLimitLimit = response.headers['x-ratelimit-limit'];
        const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
        if (rateLimitRemaining) {
          // Publicar métrica de telemetria
          globalThis.lastRemainingRateLimit = Number(rateLimitRemaining);
        }
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  public async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: ResilientRequestConfig
  ): Promise<T> {
    this.checkCircuitStatus();

    const retries = config?.retries ?? 3;
    const initialDelay = config?.initialDelayMs ?? 1000;
    const factor = config?.factor ?? 2;

    let delay = initialDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.api({
          method,
          url,
          data,
          timeout: 6000,
        });

        this.onSuccess();
        return response.data as T;
      } catch (err: any) {
        const isRateLimit = err.response?.status === 429;
        const isServerError = err.response?.status >= 500;
        
        // Só realiza Retry automático em erros transientes (429 Rate limit ou 5xx Server Error)
        if (attempt === retries || (!isRateLimit && !isServerError)) {
          this.onFailure();
          throw err;
        }

        console.warn(\`Tentativa \${attempt} falhou devido a \${err.response?.status || 'network'}. Aplicando backoff...\`);
        
        // Exponential Backoff com Jitter (aleatoriedade para evitar efeito manada)
        const jitter = Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        delay *= factor;
      }
    }

    throw new Error('Todas as tentativas de requisição resiliente falharam.');
  }

  private checkCircuitStatus() {
    if (this.circuitState === 'OPEN') {
      if (Date.now() > this.nextAttemptTime) {
        this.circuitState = 'HALF_OPEN';
        console.info('Medidas de contenção: Circuit Breaker mudou para HALF_OPEN.');
      } else {
        throw new CircuitBreakerError('O circuito de conexões para a API Meli está aberto.');
      }
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.circuitState = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeMs;
      console.error(\`Circuit Breaker ABERTO por \${this.recoveryTimeMs}ms devido a erros consecutivos.\`);
    }
  }
}
`;

export const TS_WEBHOOK_HANDLER_TS = `/**
 * MICROSERVIÇO DE WEBHOOKS COM VALIDAÇÃO DE ASSINATURA, FILA REDIS E IDEMPOTÊNCIA
 * Arquivo sugestivo: /src/services/webhook-handler.ts
 */

import crypto from 'crypto';
import { Queue, QueueEvents } from 'bullmq'; // Pacote recomendado para filas enterprise em Redis

// Configuração de filas assíncronas utilizando Redis
export const webhookQueue = new Queue('MeliWebhookProcessingQueue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD
  }
});

interface MeliWebhookPayload {
  _id: string;
  resource: string;
  user_id: number;
  topic: string;
  application_id: number;
  attempts: number;
  sent: string;
  received: string;
}

/**
 * Controller principal para recepção de eventos
 */
export class WebhookController {
  
  /**
   * 1. Validação de Assinatura (HmacSHA256) emitida pelo Meli para segurança enterprise
   */
  public verifySignature(
    payloadString: string,
    receivedSignature: string,
    clientSecret: string
  ): boolean {
    const computedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(receivedSignature, 'utf8')
    );
  }

  /**
   * 2. Ingresso do Webhook aplicando verificação instantânea de duplicidade (locks idempotentes)
   */
  public async handleIncomingWebhook(
    payload: MeliWebhookPayload,
    signature: string,
    clientSecret: string
  ): Promise<{ status: string; eventId: string }> {
    
    const payloadStr = JSON.stringify(payload);
    
    // Verifica assinatura se presente
    if (signature && !this.verifySignature(payloadStr, signature, clientSecret)) {
      throw new Error("Assinatura HMAC inválida. Rejeitado por segurança.");
    }

    // Cria idempotencyKey única baseada no hash do recurso + ID de envio
    const md5Hash = crypto.createHash('md5').update(\`\${payload.resource}:\${payload.sent}\`).digest('hex');
    const idempotencyKey = \`meli:webhook:\${md5Hash}\`;

    // No ambiente real, faria:
    // const isNew = await redis.set(idempotencyKey, 'processing', 'NX', 'EX', 86400); // Expira após 24h
    // Se isNew for nulo, indica evento duplicado - Retorna 200 imediatamente para o Meli evitar retries
    
    console.log(\`Webhook recebido de forma idempotente para recurso \${payload.resource} no tópico \${payload.topic}\`);

    // 3. Despacha para processamento assíncrono em fila Redis (BullMQ) para isolamento térmico
    await webhookQueue.add(payload.topic, {
      idempotencyKey,
      topic: payload.topic,
      resource: payload.resource,
      userId: payload.user_id,
      sentAt: payload.sent,
      payload
    }, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000 // Inicia com 5 segundos e dobra a cada falha
      },
      removeOnComplete: true
    });

    return { status: 'queued_success', eventId: idempotencyKey };
  }
}
`;

// -------------------------------------------------------------
// EXPERT INTERACTIVE KNOWLEDGE DATABASE (MOCK DE APIS)
// -------------------------------------------------------------

export const INTEL_KEYWORDS_DATABASE: Record<string, typeof POTENTIAL_RESPONSE_EXAMPLE> = {
  "smartphone": {
    keyword: "smartphone",
    category: "Celulares e Telefones > Celulares",
    volume: 1250000,
    avgPrice: 2199.90,
    ticketMedio: 1850.00,
    competitiveness: 92, // High competition
    potentialIndex: 88,    // High potential
    seasonality: [
      { month: "Jan", searches: 800000 },
      { month: "Fev", searches: 780000 },
      { month: "Mar", searches: 850000 },
      { month: "Abr", searches: 820000 },
      { month: "Mai", searches: 1050000 }, // Dia das Mães
      { month: "Jun", searches: 920000 },
      { month: "Jul", searches: 910000 },
      { month: "Ago", searches: 990000 }, // Dia dos Pais
      { month: "Set", searches: 950000 },
      { month: "Out", searches: 1020000 },
      { month: "Nov", searches: 1450000 }, // Black Friday
      { month: "Dez", searches: 1650000 }, // Natal
    ],
    topProducts: [
      { id: "MLB323948271", title: "iPhone 14 Apple 128GB Estrela Meia-Noite Tela 6,1", sellerNickname: "APPLE_STORE_OFICIAL", price: 4199.00, salesCount: 5400, revenue: 22674600, stock: 154, permalink: "#" },
      { id: "MLB312849182", title: "Smartphone Xiaomi Redmi Note 12S 8gb Ram 256gb", sellerNickname: "TECH_ELETRO_E_CIA", price: 1249.90, salesCount: 11200, revenue: 13998880, stock: 953, permalink: "#" },
      { id: "MLB402831201", title: "Samsung Galaxy S23 Ultra 5G 256GB Cream", sellerNickname: "SAMSUNG_OFICIAL_MELI", price: 5499.00, salesCount: 3200, revenue: 17596800, stock: 80, permalink: "#" },
      { id: "MLB332148902", title: "Smartphone Motorola Moto G54 5g 128gb Azul", sellerNickname: "MOTO_DIGITAL", price: 999.00, salesCount: 8900, revenue: 8891100, stock: 432, permalink: "#" },
    ]
  },
  "cadeira gamer": {
    keyword: "cadeira gamer",
    category: "Games > Acessórios > Cadeiras Gamer",
    volume: 680000,
    avgPrice: 899.00,
    ticketMedio: 749.00,
    competitiveness: 79,
    potentialIndex: 72,
    seasonality: [
      { month: "Jan", searches: 480000 },
      { month: "Fev", searches: 420000 },
      { month: "Mar", searches: 450000 },
      { month: "Abr", searches: 410000 },
      { month: "Mai", searches: 460000 },
      { month: "Jun", searches: 520000 },
      { month: "Jul", searches: 590000 }, // Altas nas férias de inverno
      { month: "Ago", searches: 490000 },
      { month: "Set", searches: 510000 },
      { month: "Out", searches: 580000 }, // Dia das Crianças
      { month: "Nov", searches: 840000 }, // Black Friday
      { month: "Dez", searches: 920000 }, // Natal
    ],
    topProducts: [
      { id: "MLB302941121", title: "Cadeira Gamer Ergonomica Reclinável Com Travesseiros ThunderX3", sellerNickname: "E_SHOP_DADOS", price: 849.00, salesCount: 4200, revenue: 3565800, stock: 88, permalink: "#" },
      { id: "MLB394812832", title: "Cadeira Gamer Profissional Husky Gaming Avalanche Preta/Branca", sellerNickname: "LOGISTICA_GAMING", price: 699.90, salesCount: 3800, revenue: 2659620, stock: 120, permalink: "#" },
      { id: "MLB402831991", title: "Cadeira Cg-80 Gamer Preta E Vermelha Mymax Premium", sellerNickname: "MYMAX_STORE", price: 549.00, salesCount: 6500, revenue: 3568500, stock: 340, permalink: "#" },
    ]
  },
  "fone bluetooth": {
    keyword: "fone bluetooth",
    category: "Eletrônicos, Áudio e Vídeo > Fones de Ouvido",
    volume: 980000,
    avgPrice: 189.00,
    ticketMedio: 120.00,
    competitiveness: 88,
    potentialIndex: 91,
    seasonality: [
      { month: "Jan", searches: 600000 },
      { month: "Fev", searches: 550000 },
      { month: "Mar", searches: 590000 },
      { month: "Abr", searches: 570000 },
      { month: "Mai", searches: 720000 },
      { month: "Jun", searches: 780000 },
      { month: "Jul", searches: 710000 },
      { month: "Ago", searches: 740000 },
      { month: "Set", searches: 690000 },
      { month: "Out", searches: 820000 },
      { month: "Nov", searches: 1210000 },
      { month: "Dez", searches: 1450000 },
    ],
    topProducts: [
      { id: "MLB344910281", title: "Fones de Ouvido Sem Fio QCY T13 Bluetooth Cancelamento Ruído", sellerNickname: "QCY_OFICIAL_SÃO_PAULO", price: 139.00, salesCount: 24000, revenue: 3336000, stock: 1200, permalink: "#" },
      { id: "MLB412093829", title: "Fone de Ouvido Bluetooth JBL Wave Flex Intra-auricular Resistente", sellerNickname: "JBL_OFICIAL_BRASIL", price: 349.00, salesCount: 8400, revenue: 2931600, stock: 450, permalink: "#" },
      { id: "MLB322987622", title: "Fone de Ouvido Xiaomi Redmi Buds 4 Active Bluetooth 5.3", sellerNickname: "GLOBAL_TECH_XIAOMI", price: 119.00, salesCount: 19500, revenue: 2320500, stock: 830, permalink: "#" },
    ]
  },
  "garrafa termica": {
    keyword: "garrafa termica",
    category: "Esportes e Fitness > Suplementos > Coqueteleiras e Garrafas",
    volume: 420000,
    avgPrice: 149.00,
    ticketMedio: 110.00,
    competitiveness: 62,
    potentialIndex: 78,
    seasonality: [
      { month: "Jan", searches: 390000 },
      { month: "Fev", searches: 360000 },
      { month: "Mar", searches: 330000 },
      { month: "Abr", searches: 310000 },
      { month: "Mai", searches: 340000 },
      { month: "Jun", searches: 380000 },
      { month: "Jul", searches: 410000 },
      { month: "Ago", searches: 390000 },
      { month: "Set", searches: 420000 },
      { month: "Out", searches: 490000 },
      { month: "Nov", searches: 590000 },
      { month: "Dez", searches: 640000 },
    ],
    topProducts: [
      { id: "MLB329841289", title: "Copo Térmico De Cerveja Stanley Com Tampa Matte Black 473ml", sellerNickname: "STANLEY_OFFICIAL_DIST", price: 199.00, salesCount: 15400, revenue: 3064600, stock: 88, permalink: "#" },
      { id: "MLB384918239", title: "Garrafa Térmica Kouda Inox 500ml Isolamento a Vácuo Parede Dupla", sellerNickname: "KOUDA_SHOP", price: 129.90, salesCount: 4200, revenue: 545580, stock: 150, permalink: "#" },
    ]
  },
};

const POTENTIAL_RESPONSE_EXAMPLE = {
  keyword: "placeholder",
  category: "placeholder",
  volume: 0,
  avgPrice: 0,
  ticketMedio: 0,
  competitiveness: 0,
  potentialIndex: 0,
  seasonality: [] as Array<{ month: string; searches: number }>,
  topProducts: [] as Array<{
    id: string;
    title: string;
    sellerNickname: string;
    price: number;
    salesCount: number;
    revenue: number;
    stock: number;
    permalink: string;
  }>
};

export const INITIAL_COMPETITORS: CompetitorProduct[] = [
  {
    id: "COMP001",
    sku: "IPHONE14-128G",
    title: "iPhone 14 Apple 128GB Estrela Meia-Noite Tela 6,1",
    sellerName: "REVENDA_GOLD_DISTRIB",
    price: 4390.00,
    stock: 45,
    salesEstimated: 120,
    reputation: 'green',
    ruleId: "RULE01",
    lastUpdated: "Há 18 min",
    historyPrice: [
      { date: "01/06", price: 4420 },
      { date: "02/06", price: 4410 },
      { date: "03/06", price: 4399 },
      { date: "04/06", price: 4390 },
    ]
  },
  {
    id: "COMP002",
    sku: "QCY-T13-W",
    title: "Fones de Ouvido Sem Fio QCY T13 Bluetooth TWS",
    sellerName: "VIP_COMPRAS_IMPORTS",
    price: 145.00,
    stock: 490,
    salesEstimated: 950,
    reputation: 'light_green',
    ruleId: "RULE02",
    lastUpdated: "Há 4 min",
    historyPrice: [
      { date: "01/06", price: 149.9 },
      { date: "02/06", price: 149.9 },
      { date: "03/06", price: 147.0 },
      { date: "04/06", price: 145.0 },
    ]
  },
  {
    id: "COMP003",
    sku: "CAD-THUNDERX3",
    title: "Cadeira Gamer Ergonomica Reclinável ThunderX3 TGC12",
    sellerName: "PLANETA_GAMER_ELES",
    price: 889.00,
    stock: 12,
    salesEstimated: 65,
    reputation: 'yellow',
    ruleId: "RULE01",
    lastUpdated: "Há 1 hora",
    historyPrice: [
      { date: "01/06", price: 920 },
      { date: "02/06", price: 899 },
      { date: "03/06", price: 889 },
      { date: "04/06", price: 889 },
    ]
  },
  {
    id: "COMP004",
    sku: "XIAOMI-NOTE12S",
    title: "Smartphone Xiaomi Redmi Note 12S 8GB RAM 256GB Dual Sim",
    sellerName: "XIAOMI_STORE_BRASIL",
    price: 1279.00,
    stock: 124,
    salesEstimated: 410,
    reputation: 'green',
    ruleId: "RULE03",
    lastUpdated: "Há 32 min",
    historyPrice: [
      { date: "01/06", price: 1299 },
      { date: "02/06", price: 1289 },
      { date: "03/06", price: 1285 },
      { date: "04/06", price: 1279 },
    ]
  }
];

export const COCKPIT_CHART_SALES = [
  { day: "Seg", vendas: 74200, pedidos: 310, ticket: 239 },
  { day: "Ter", vendas: 89600, pedidos: 375, ticket: 238 },
  { day: "Qua", vendas: 92400, pedidos: 390, ticket: 236 },
  { day: "Qui", vendas: 112500, pedidos: 485, ticket: 231 },
  { day: "Sex", vendas: 105800, pedidos: 440, ticket: 240 },
  { day: "Sáb", vendas: 81300, pedidos: 340, ticket: 239 },
  { day: "Dom", vendas: 65700, pedidos: 280, ticket: 234 },
];

export const SALES_BY_CATEGORY = [
  { name: "Smartphones", value: 432500, color: "#3B82F6" },
  { name: "Áudio & Fones", value: 189400, color: "#10B981" },
  { name: "Games & Cadeiras", value: 145900, color: "#F59E0B" },
  { name: "Casa & Cozinha", value: 94800, color: "#6366F1" },
  { name: "Eletrodomesticos", value: 71200, color: "#EC4899" },
];

export const MARKET_SHARE_DATA = [
  { year: "2023 Q1", NossoSaaS: 12, ConcorrenteA: 34, ConcorrenteB: 18, Outros: 36 },
  { year: "2023 Q2", NossoSaaS: 14, ConcorrenteA: 32, ConcorrenteB: 19, Outros: 35 },
  { year: "2023 Q3", NossoSaaS: 17, ConcorrenteA: 29, ConcorrenteB: 19, Outros: 35 },
  { year: "2023 Q4", NossoSaaS: 21, ConcorrenteA: 28, ConcorrenteB: 17, Outros: 34 },
  { year: "2024 (Futuro)", NossoSaaS: 28, ConcorrenteA: 24, ConcorrenteB: 16, Outros: 32 },
];
