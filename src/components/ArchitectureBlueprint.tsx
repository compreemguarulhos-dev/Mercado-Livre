import React, { useState } from 'react';
import { 
  Database, Shield, Cloud, RefreshCw, Key, MessageSquare, 
  Layers, ChevronRight, Activity, DollarSign, Calendar, Copy, Check, FileCode, Server
} from 'lucide-react';
import { POSTGRESQL_SCHEMA_SQL, TS_OAUTH_FLOW_TS, TS_HTTP_RESILIENCY_TS, TS_WEBHOOK_HANDLER_TS } from '../data';

export default function ArchitectureBlueprint() {
  const [activeTab, setActiveTab] = useState<'archi' | 'database' | 'oauth_flow' | 'webhooks_pipe' | 'resilience' | 'observability' | 'security' | 'costs_roadmap'>('archi');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Blueprint Header */}
      <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full inline-block mb-2 font-bold uppercase tracking-wider">
            ESPECIFICAÇÕES DE ARQUITETURA
          </span>
          <h2 className="text-xl font-bold font-sans text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-500 w-5 h-5" /> Blueprint Enterprise MeliPro
          </h2>
        </div>
        <p className="text-xs text-slate-500 max-w-md md:text-right font-medium">
          Plano arquitetural enterprise focado em resiliência, baixa latência, conformidade com a LGPD e alta escalabilidade integrado ao ecossistema do Mercado Livre.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="bg-slate-50/50 px-4 border-b border-slate-250 flex overflow-x-auto scrollbar-none gap-1">
        <button 
          onClick={() => setActiveTab('archi')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'archi' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <Server className="w-4 h-4" /> 1. Serviços e Fluxo
        </button>
        <button 
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'database' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <Database className="w-4 h-4" /> 2. Modelagem SQL
        </button>
        <button 
          onClick={() => setActiveTab('oauth_flow')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'oauth_flow' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <Key className="w-4 h-4" /> 3. OAuth & PKCE
        </button>
        <button 
          onClick={() => setActiveTab('webhooks_pipe')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'webhooks_pipe' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> 4. Webhooks
        </button>
        <button 
          onClick={() => setActiveTab('resilience')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'resilience' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> 5. Resiliência & Backoff
        </button>
        <button 
          onClick={() => setActiveTab('observability')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'observability' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <Activity className="w-4 h-4" /> 6. Observabilidade
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'security' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <Shield className="w-4 h-4" /> 7. Segurança & LGPD
        </button>
        <button 
          onClick={() => setActiveTab('costs_roadmap')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold font-mono whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'costs_roadmap' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50/30'
          }`}
        >
          <DollarSign className="w-4 h-4" /> 8. Custos & Roadmap
        </button>
      </div>

      {/* Pane Content */}
      <div className="p-6 text-slate-650 font-sans leading-relaxed text-sm">
        
        {/* TAB 1: ARQUITETURA DE MICROSERVIÇOS */}
        {activeTab === 'archi' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Topologia de Microserviços
                </h3>
                <p>
                  Para satisfazer a necessidade corporativa de alta disponibilidade, isolamento térmico por domínio e crescimento horizontal independente, MeliPro divide-se nos seguintes microsserviços stateless operando em contêineres Docker e orquestrados por Kubernetes (K8s):
                </p>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-2.5">
                    <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Auth & Account Service (Node.js/TS):</strong>
                      <p className="text-xs text-slate-400 mt-0.5">Gerencia fluxo OAuth 2.0 PKCE, renovação preventiva de tokens, criptografia simétrica de chaves de vendedores e controle de acesso RBAC.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Catalog & Syncer Service (Node.js/TS):</strong>
                      <p className="text-xs text-slate-400 mt-0.5">Sincroniza anúncios locais com o Mercado Livre em lote aplicando filas prioritárias do Redis. Incrementa vendas, altera estoque e atualiza dados cadastrais.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Webhooks Consumer (Go ou Node.js Fast-I/O):</strong>
                      <p className="text-xs text-slate-400 mt-0.5">Receptor HTTP de alto desempenho sob latência de resposta ultra-baixa (&lt;100ms) para receber assinar, validar HMAC e enfileirar imediatamente no Redis (BullMQ).</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Repricer & Intelligence Engine (Python/FastAPI ou Node.js):</strong>
                      <p className="text-xs text-slate-500 mt-0.5">Processa varreduras do mercado, avalia mudanças em concorrentes e aciona regras de precificação reativas em milissegundos sem travar o restante da aplicação.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Dynamic Interactive SVG Component Diagram (Sleek light frame) */}
              <div className="flex-1 bg-white p-5 border border-slate-200 rounded-xl flex flex-col justify-center items-center shadow-xs">
                <span className="text-xs font-mono text-slate-400 mb-2 font-bold uppercase tracking-wider">DIAGRAMA DE INTEGRAÇÃO ENTERPRISE</span>
                <svg viewBox="0 0 500 320" className="w-full h-auto max-w-sm">
                  {/* Outer Frame Grid */}
                  <rect x="10" y="10" width="480" height="300" rx="10" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />
                  
                  {/* Gateway Box */}
                  <rect x="180" y="20" width="140" height="35" rx="5" fill="#3B82F6" stroke="#2563EB" strokeWidth="1" />
                  <text x="250" y="42" fill="#FFFFFF" fontSize="10" textAnchor="middle" fontWeight="bold">Cloudflare API Gateway</text>
                  
                  <path d="M 250 55 L 250 85" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrow)" />
                  
                  {/* Microservices Cluster */}
                  <rect x="20" y="85" width="460" height="110" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                  <text x="30" y="102" fill="#64748B" fontSize="8" fontWeight="bold" letterSpacing="1">KUBERNETES MICROSERVICES CLUSTER</text>
                  
                  {/* Microservices Nodes */}
                  <rect x="35" y="120" width="90" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="80" y="140" fill="#1E293B" fontSize="8" textAnchor="middle" fontWeight="bold">Account Auth</text>
                  <text x="80" y="152" fill="#64748B" fontSize="7" textAnchor="middle">(OAuth PKCE)</text>

                  <rect x="145" y="120" width="100" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="195" y="140" fill="#1E293B" fontSize="8" textAnchor="middle" fontWeight="bold">Webhooks Node</text>
                  <text x="195" y="152" fill="#EF4444" fontSize="7" textAnchor="middle" fontWeight="bold">Low Latency</text>

                  <rect x="265" y="120" width="95" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="312" y="140" fill="#1E293B" fontSize="8" textAnchor="middle" fontWeight="bold">Repricer Engine</text>
                  <text x="312" y="152" fill="#D97706" fontSize="7" textAnchor="middle">(Precificação)</text>

                  <rect x="380" y="120" width="90" height="50" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="425" y="140" fill="#1E293B" fontSize="8" textAnchor="middle" fontWeight="bold">Catalog Service</text>
                  <text x="425" y="152" fill="#10B981" fontSize="7" textAnchor="middle">(Syncer)</text>

                  {/* Flow Lines to Data Layer */}
                  <path d="M 80 170 L 80 240 L 150 240" stroke="#CBD5E1" strokeWidth="1.5" />
                  {/* Webhooks to Redis */}
                  <path d="M 195 170 L 195 240 L 260 240" stroke="#EC4899" strokeWidth="1.5" strokeDasharray="3 3" />
                  {/* Reprice to PG & Redis */}
                  <path d="M 312 170 L 312 240 L 195 240" stroke="#CBD5E1" strokeWidth="1.5" />
                  
                  {/* Data Layer Components */}
                  {/* Postgres SQL */}
                  <rect x="40" y="225" width="110" height="40" rx="6" fill="#E6F4EA" stroke="#34A853" strokeWidth="1" />
                  <text x="95" y="242" fill="#137333" fontSize="9" textAnchor="middle" fontWeight="bold">PostgreSQL OLTP</text>
                  <text x="95" y="254" fill="#1E8E3E" fontSize="7" textAnchor="middle">Durabilidade ACID</text>

                  {/* Redis Cache/Queue */}
                  <rect x="170" y="225" width="110" height="40" rx="6" fill="#FCE8E6" stroke="#EA4335" strokeWidth="1" />
                  <text x="225" y="242" fill="#C5221F" fontSize="9" textAnchor="middle" fontWeight="bold">Redis Cache/Queue</text>
                  <text x="225" y="254" fill="#D93025" fontSize="7" textAnchor="middle">BullMQ Webhooks</text>

                  {/* Elasticsearch Cluster */}
                  <rect x="300" y="225" width="110" height="40" rx="6" fill="#FEF7E0" stroke="#FBBC04" strokeWidth="1" />
                  <text x="355" y="242" fill="#B06000" fontSize="9" textAnchor="middle" fontWeight="bold">Elasticsearch</text>
                  <text x="355" y="254" fill="#C58C00" fontSize="7" textAnchor="middle">Busca & Inteligência</text>

                  {/* Definition of marker arrow */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                    </marker>
                  </defs>
                </svg>
                <div className="text-center mt-3">
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    Conexões baseadas em barramento assíncrono evitam chamadas HTTP síncronas bloqueantes (SOLID).
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold font-mono text-indigo-700 uppercase tracking-widest font-bold">Estratégia de Crescimento e Auto-recuperação (Self-Healing)</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                1. <strong>Escalabilidade Lateral (HPA):</strong> Configuramos o horizontal pod autoscaler (HPA) no K8s baseado na utilização de CPU e tamanho de conexões pendentes no Redis, permitindo que o microsserviço de Webhooks scale de 2 para 50 pods em segundos durante picos de ofertas (ex: Black Friday).
              </p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                2. <strong>Recuperação Ativa (Liveness & Readiness Probes):</strong> K8s restabelece automaticamente pods defeituosos caso o monitor de conexão de banco de dados aponte falhas irremediáveis de timeout de requisição.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: MODELAGEM DE BANCO DE DADOS */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Database className="text-emerald-500 w-5 h-5" /> Modelagem Relacional OLTP no PostgreSQL
                </h3>
                <p className="text-xs text-slate-400">
                  Estrutura com chaves primárias, estrangeiras e indexações cruciais para suportar volume intenso mantendo integridade.
                </p>
              </div>
              <button 
                onClick={() => handleCopy(POSTGRESQL_SCHEMA_SQL, 'sch_sql')}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-all"
              >
                {copiedText === 'sch_sql' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'sch_sql' ? 'Copiado!' : 'Copiar DDL SQL'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl overflow-x-auto">
              <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed select-all">
                {POSTGRESQL_SCHEMA_SQL}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Por que PostgreSQL?
                </h4>
                <p className="text-slate-400 leading-normal">
                  É o banco OLTP central de alta confiabilidade operacional. Suporta transações complexas necessárias para auditoria financeira de pedidos de múltiplos vendedores e gerenciamento seguro de tokens com ACID completo.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Por que Cache com Redis?
                </h4>
                <p className="text-slate-400 leading-normal">
                  Sessões de usuários, buffers de rate limits, locks distribuídos e persistência transiente de filas. O processador de webhooks não pode tocar o disco (Postgres) a cada pulso, ele delega um dump rápido em Redis.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Elasticsearch / OpenSearch
                </h4>
                <p className="text-slate-400 leading-normal">
                  Ideal para a Inteligência de Mercado. Indexa e rastreia milhões de anúncios concorrentes, possibilitando buscas complexas e instantâneas por palavra-chave para extrair o ticket médio sem sobrecarregar o Postgres.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OAUTH DE FLUXO COM PKCE */}
        {activeTab === 'oauth_flow' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Key className="text-blue-500 w-5 h-5" /> Integração OAuth 2.0 com PKCE Mandatório
                </h3>
                <p className="text-xs text-slate-400">
                  Exemplo corporativo em TypeScript para criptografar tokens e transicionar no Mercado Livre.
                </p>
              </div>
              <button 
                onClick={() => handleCopy(TS_OAUTH_FLOW_TS, 'oauth_ts')}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-all"
              >
                {copiedText === 'oauth_ts' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'oauth_ts' ? 'Copiado!' : 'Copiar TS Code'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl overflow-x-auto max-h-[380px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed select-all">
                {TS_OAUTH_FLOW_TS}
              </pre>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold font-mono text-blue-400 mb-2 uppercase tracking-wider">Por que usar PKCE e renovar preventivamente?</h4>
              <p className="text-xs text-slate-400">
                1. <strong>PKCE (Proof Key for Code Exchange) obrigatório:</strong> O uso do Code Verifier e Code Challenge impede ataques de interceptação do Authorization Code (Man-In-The-Middle) impedindo que agentes maliciosos sequestrem o fluxo de login de um cliente.<br/>
                2. <strong>Criptografia Simétrica Baseada em Hardware:</strong> Os tokens de acesso concedidos conferem plenos poderes sobre o faturamento do vendedor. MeliPro criptografa os tokens com AES-256-GCM. As chaves de criptografia são armazenadas no AWS Secrets Manager ou GCP Secret Manager, reduzindo riscos de vazamento por falhas na persistência.<br/>
                3. <strong>Worker Cron Preventivo:</strong> Os tokens expiram a cada 6 horas. Um worker de segundo plano monitora registros cuja expiração ocorrerá nos próximos 30 minutos e de forma totalmente desconectada do fluxo dinâmico do cliente, realiza o refresh token.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: WEBHOOK PIPELINE */}
        {activeTab === 'webhooks_pipe' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="text-pink-500 w-5 h-5" /> Pipeline Resiliente de Webhooks do Mercado Livre
                </h3>
                <p className="text-xs text-slate-400">
                  Tratamento instantâneo de notificações com barramento assíncrono (RabbitMQ / Redis BullMQ).
                </p>
              </div>
              <button 
                onClick={() => handleCopy(TS_WEBHOOK_HANDLER_TS, 'web_ts')}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-all"
              >
                {copiedText === 'web_ts' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'web_ts' ? 'Copiado!' : 'Copiar TS Code'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl overflow-x-auto max-h-[380px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed select-all">
                {TS_WEBHOOK_HANDLER_TS}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-955 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-mono text-[10px] text-pink-400 font-bold uppercase">Idempotência & Bloqueios Concorrentes</span>
                <p className="text-slate-450">
                  Várias notificações para o mesmo evento de pedido podem chegar simultaneamente do Mercado Livre. O sistema cria uma chave com o hash do ID do evento no Redis com validade de 24 horas usando comandos atômicos. Se a chave indicar processamento em andamento, o webhook é descartado imediatamente retornando status HTTP 200 ao Meli para poupar hardware.
                </p>
              </div>
              <div className="bg-slate-955 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-mono text-[10px] text-pink-400 font-bold uppercase">Mecanismos de Retry & Dead Letter Queue (DLQ)</span>
                <p className="text-slate-450">
                  Em caso de falha transiente no processamento (ex: API do Meli ou banco local indisponível), o evento é re-enfileirado com Exponential Backoff (5s, 10s, 20s, 40s, 80s). Se as 5 tentativas explodirem o orçamento, o evento é enviado à Dead Letter Queue (DLQ) para análise manual ou intervenção automatizada através de alertas operacionais.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RESILIÊNCIA E RATE LIMITS */}
        {activeTab === 'resilience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <RefreshCw className="text-amber-500 w-5 h-5" /> Tratamento Avançado de Rate Limits, Circuit Breakers e Backoff
                </h3>
                <p className="text-xs text-slate-400">
                  Prevenção de punições de limite e isolamento de requisições sob estresse mecânico.
                </p>
              </div>
              <button 
                onClick={() => handleCopy(TS_HTTP_RESILIENCY_TS, 'res_ts')}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-all"
              >
                {copiedText === 'res_ts' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'res_ts' ? 'Copiado!' : 'Copiar TS Code'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl overflow-x-auto max-h-[380px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed select-all">
                {TS_HTTP_RESILIENCY_TS}
              </pre>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-amber-500">Mapeamento Técnico de Resiliência:</h4>
              <p className="text-slate-400 leading-normal">
                1. <strong>Exponential Backoff com Jitter:</strong> O algoritmo de retentativa introduz um atraso exponencial acrescido de uma aleatoriedade (Jitter). Isso impede o efeito de manada ("thundering herd problem") onde todos os nós re-tentam a requisição exatamente no mesmo milissegundo, o que causaria sobrecarga repetida no Mercado Livre.<br/>
                2. <strong>Circuit Breaker:</strong> Se um vendedor comete erros contínuos (por exemplo, chaves revogadas ou problemas cadastrais no Mercado Livre), o HttpClient abre o disjuntor (Circuit Breaker STATE: OPEN) pelas próximas 30 segundos, rejeitando imediatamente as requisições sem sequer enviar chamadas de rede no Meli, estancando a perda de cota de taxa de API.<br/>
                3. <strong>Fila de Vazamento (Leaky Bucket Queue):</strong> Para sincronização em lote de dezenas de milhares de anúncios, o sistema utiliza o Redis para regular as rajadas de gravação, despejando chamadas no Mercado Livre em uma taxa constante máxima aceita pelo SLA de sua conta.
              </p>
            </div>
          </div>
        )}

        {/* TAB 6: PLANO DE OBSERVABILIDADE */}
        {activeTab === 'observability' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="text-cyan-500 w-5 h-5" /> Plano de Observabilidade Enterprise
            </h3>
            <p>
              A operação massiva integrada às APIs restritivas do Mercado Livre exige monitoramento proativo em 360º de todas as conexões, latências de workers, erros e o volume de taxa rejeitada. A arquitetura de observabilidade MeliPro compreende:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">1. Coleta de Métricas Proativas e Prometheus</span>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Instrumentação de microsserviços exportando logs binários para Prometheus. Monitoramos tempos de resposta de API do Mercado Livre, número de webhooks enfileirados, duração máxima do worker do Repricer e CPU/Memória por pod do Kubernetes.
                </p>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-mono text-[10px] text-cyan-500 font-bold">Métricas customizadas exportadas em produção:</span>
                  <ul className="font-mono text-[9px] text-slate-400 mt-1.5 space-y-1">
                    <li>- melipro_api_rate_limit_remaining_count</li>
                    <li>- melipro_webhook_latency_seconds_bucket</li>
                    <li>- melipro_repricer_decisions_executed_total</li>
                    <li>- melipro_circuit_breaker_open_state_count</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">2. Logs Estruturados em JSON e Rastreamento Local</span>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Todos os contêneres imprimem logs estruturados padronizados no console (stdout) em formato JSON. Os coletores FluentBit puxam esses logs enviando-os para centralização no Elasticsearch, facilitando montagens de query em tempo real para encontrar IDs de pedidos Meli.
                </p>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-mono text-[10px] text-cyan-500 font-bold">Exemplo de log JSON estruturado em Produção:</span>
                  <pre className="font-mono text-[8px] text-emerald-400 mt-2 leading-tight">
{`{
  "timestamp": "2026-06-04T21:50:44.241Z",
  "level": "INFO",
  "service": "meli-repricer-engine",
  "correlation_id": "corr-8f9d0c2e",
  "message": "Dynamic price updated from R$4390 to R$4388.50 for SKU IPHONE14-128G",
  "meta": {
    "sku": "IPHONE14-128G",
    "competitor_price": 4390.00,
    "rule_applied": "RULE01",
    "execution_time_ms": 48
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SEGURANÇA E CONFORMIDADE LGPD */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Shield className="text-red-500 w-5 h-5" /> Plano de Segurança Corporativo e LGPD
            </h3>
            <p className="text-xs text-slate-400">
              Proteção de dados operacionais confidenciais, tráfego de rede isolado e auditoria transparente de acesso.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="font-mono text-[10px] text-red-400 font-bold uppercase">Criptografia AES-256 de chaves</span>
                <p className="text-xs text-slate-400">
                  Os tokens de acesso são o ativo de maior valor. No banco de dados, são criptografados simetricamente usando algoritmo <strong>AES-256-GCM</strong>. A chave mestra de rotação de cifras reside fora da aplicação, utilizando cofres em nuvem (KMS), garantindo imunidade mesmo se o banco PostgreSQL for acidentalmente acessado.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="font-mono text-[10px] text-red-400 font-bold uppercase">Conformidade LGPD para Compradores</span>
                <p className="text-xs text-slate-400">
                  Conforme regras da LGPD no comércio digital, as informações sigilosas dos compradores do Mercado Livre (CPF, nomes completos, telefones de destino) não são estocadas indefinidamente no SaaS. Dados de endereços são mascarados 15 dias após a entrega do produto, restando dados anonimizados para relatórios analíticos de inteligência.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="font-mono text-[10px] text-red-400 font-bold uppercase">Múltiplos Fatores (MFA) & SSO</span>
                <p className="text-xs text-slate-400">
                  Autenticação corporativa com suporte nativo a MFA (Multi-Factor Authentication via autenticadores TOTP como Authy/Google Authenticator) e suporte de provedores corporativos de autenticação única (SAML / OpenID Connect SSO) para grades de times de grandes vendedores.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="font-mono text-[10px] text-red-400 font-bold uppercase">RBAC (Controle por Função)</span>
                <p className="text-xs text-slate-400">
                  Permissões segregadas por cargo na empresa: <code>Seller_Owner</code> (configura integradores Meli), <code>Commercial_Analyst</code> (ajusta regras de reprecificador e analisa concorrência) e <code>Viewer_Finance</code> (acessa apenas dashboard agregada sem alteração ativa).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: PLANO DE CUSTOS E ROADMAP DO PROJETO */}
        {activeTab === 'costs_roadmap' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Gantt / Phase Roadmap */}
              <div className="space-y-4">
                <h4 className="text-slate-100 font-bold flex items-center gap-2">
                  <Calendar className="text-blue-500 w-4 h-4" /> Roadmap por Fases Corporativas
                </h4>
                <div className="space-y-3.5">
                  <div className="relative pl-5 border-l border-slate-800">
                    <span className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-blue-500"></span>
                    <strong className="text-xs text-slate-100 block">Fase 1: Preparação e Arquitetura Inicial (Mês 1)</strong>
                    <span className="text-[10px] text-slate-500 block mb-1">Foco: Alinhamento, Segurança e OAuth PKCE</span>
                    <p className="text-xs text-slate-400">Modelagem inicial do Postgres, setup do Keycloak para controle RBAC corporativo, desenvolvimento das bibliotecas básicas de criptografia AES e SDK de autenticação e refresh de tokens com o Mercado Livre.</p>
                  </div>

                  <div className="relative pl-5 border-l border-slate-800">
                    <span className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-blue-500"></span>
                    <strong className="text-xs text-slate-100 block">Fase 2: Core e Barramento de Webhooks (Mês 2)</strong>
                    <span className="text-[10px] text-slate-500 block mb-1">Foco: Integração em tempo real e Webhooks</span>
                    <p className="text-xs text-slate-400">Desenvolvimento do microsserviço de Webhooks de alta performance, configuração do barramento em Redis para BullMQ com estratégia de Dead Letter Queue, e validação HMAC de assinaturas Meli.</p>
                  </div>

                  <div className="relative pl-5 border-l border-slate-800">
                    <span className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-amber-500"></span>
                    <strong className="text-xs text-slate-100 block">Fase 3: Repricer Dinâmico e Inteligência (Mês 3)</strong>
                    <span className="text-[10px] text-slate-500 block mb-1">Foco: Motor de precificação e Webscraping de concorrência</span>
                    <p className="text-xs text-slate-400">Criação do motor inteligente de monitoramento sob algoritmos de reatividade a menor preço de concorrentes, e módulo de buscas robustas em massa utilizando indexações via Elasticsearch.</p>
                  </div>

                  <div className="relative pl-5 border-l border-slate-800">
                    <span className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-emerald-500"></span>
                    <strong className="text-xs text-slate-100 block">Fase 4: Escala, Observabilidade e Auditoria (Mês 4)</strong>
                    <span className="text-[10px] text-slate-500 block mb-1">Foco: Deploy sob Alta Disponibilidade</span>
                    <p className="text-xs text-slate-400">Conteinerização Docker, implantação das receitas de orquestração em Kubernetes, canais de alertas automatizados no Grafana/Prometheus e homologação final com a compliance LGPD para produção.</p>
                  </div>
                </div>
              </div>

              {/* Operating Cost Estimation Card */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                <h4 className="text-slate-100 font-bold flex items-center gap-2">
                  <DollarSign className="text-emerald-500 w-4 h-4" /> Estimativa Semanal / Mensal de Infra (AWS/GCP)
                </h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Projeção financeira baseada em ambiente real contendo microsserviços escalados de forma horizontal em Kubernetes gerenciado (AWS EKS ou Google GKE), atendendo até 1.500 vendedores ativos concorrentemente:
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">Kubernetes Cluster (GKE / EKS - 3 nós m5.large):</span>
                    <span className="text-slate-200">US$ 210.00/mês</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">Cloud SQL Postgres (16GB RAM, Dual-AZ Multi-Regiões):</span>
                    <span className="text-slate-200">US$ 180.00/mês</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">AWS ElastiCache Redis Cluster (8GB High-Write IO):</span>
                    <span className="text-slate-200">US$ 95.00/mês</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">AWS OpenSearch (Elasticsearch - 2 nós index):</span>
                    <span className="text-slate-200">US$ 115.00/mês</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">Secrets Manager, Cloud Watch e Telemetria:</span>
                    <span className="text-slate-200">US$ 45.00/mês</span>
                  </div>
                  <div className="flex justify-between py-1.5 pt-3 text-sm font-bold border-t border-slate-800 text-emerald-400">
                    <span>Estimativa Mensal Total:</span>
                    <span>US$ 645.00 / mês</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/40 rounded-lg text-[11px] text-slate-500 leading-normal border border-slate-9D0">
                  💡 <strong>Nota de Redução de Custo de Startup:</strong> Para o estágio de validação MVP, o ambiente pode ser hospedado em instâncias únicas serverless (Cloud Run + Neon Serverless Postgres + Redis Upstash), derrubando o custo operacional inicial para aproximadamente <strong>US$ 35.00 mensais</strong> sem perda de resiliência.
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
